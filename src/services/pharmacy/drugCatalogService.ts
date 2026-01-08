/**
 * Drug Catalog Service
 * Handles drug catalog operations with full CRUD functionality
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { Drug, DrugWithRelations, DrugCategory, Supplier } from '@/types/pharmacy'
import { mockDrugs, mockDrugCategories, mockSuppliers } from './mockData'
import { getDrugCategories } from './inventoryService'

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
    if (isSupabaseConfigured()) {
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
    }

    // Mock KPI data
    const drugs = mockDrugs.filter(d => d.hospital_id === hospitalId)
    
    const kpis: DrugCatalogKPIs = {
      total: drugs.length,
      active: drugs.filter(d => d.status === 'active').length,
      inactive: drugs.filter(d => d.status === 'inactive').length,
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
    if (isSupabaseConfigured()) {
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

      // Order alphabetically by drug_name (then by code), so list naturally shows A → Z
      query = query
        .order('drug_name', { ascending: true })
        .order('drug_code', { ascending: true })

      // Apply pagination after ordering
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data: drugs, error } = await query

      if (error) throw error

      // Get relations
      const categoriesResult = await getDrugCategories()
      const categoriesList = categoriesResult.data || []
      
      const drugsWithRelations: DrugWithRelations[] = (drugs || []).map(drug => {
        const category = categoriesList.find(c => c.id === drug.category_id)
        
        let supplier = null
        if (drug.supplier_id) {
          // Get supplier from Supabase or mock
          const mockSupplier = mockSuppliers.find(s => s.id === drug.supplier_id)
          supplier = mockSupplier || null
        }
        
        return {
          ...drug,
          category,
          supplier,
        }
      })

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: {
          data: drugsWithRelations,
          total,
          page,
          pageSize,
          totalPages,
        },
        error: null,
      }
    }

    // Fallback to mock data
    let drugs = [...mockDrugs].filter(d => d.hospital_id === hospitalId)

    // Apply filters
    if (filter?.search) {
      const search = filter.search.toLowerCase()
      drugs = drugs.filter(d =>
        d.drug_code.toLowerCase().includes(search) ||
        d.drug_name.toLowerCase().includes(search) ||
        d.generic_name?.toLowerCase().includes(search) ||
        d.brand_name?.toLowerCase().includes(search) ||
        d.sku?.toLowerCase().includes(search) ||
        d.pku?.toLowerCase().includes(search)
      )
    }

    if (filter?.category_id) {
      drugs = drugs.filter(d => d.category_id === filter.category_id)
    }

    if (filter?.supplier_id) {
      drugs = drugs.filter(d => d.supplier_id === filter.supplier_id)
    }

    if (filter?.procurement_vote) {
      drugs = drugs.filter(d => d.procurement_vote === filter.procurement_vote)
    }

    if (filter?.status) {
      drugs = drugs.filter(d => d.status === filter.status)
    }

    // Enrich with relations
    const drugsWithRelations: DrugWithRelations[] = drugs.map(drug => {
      const category = mockDrugCategories.find(c => c.id === drug.category_id)
      const supplier = mockSuppliers.find(s => s.id === drug.supplier_id)
      
      return {
        ...drug,
        category,
        supplier,
      }
    })

    const total = drugsWithRelations.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = drugsWithRelations.slice(start, start + pageSize)

    return {
      data: {
        data,
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

    if (isSupabaseConfigured()) {
      const { data: drugs, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('hospital_id', hospitalId)
        .or(`drug_code.ilike.%${query}%,drug_name.ilike.%${query}%,generic_name.ilike.%${query}%,brand_name.ilike.%${query}%,sku.ilike.%${query}%,pku.ilike.%${query}%`)
        .limit(limit)

      if (error) throw error

      // Get relations
      const categoriesResult = await getDrugCategories()
      const categoriesList = categoriesResult.data || []
      
      const drugsWithRelations: DrugWithRelations[] = (drugs || []).map(drug => {
        const category = categoriesList.find(c => c.id === drug.category_id)
        
        let supplier = null
        if (drug.supplier_id) {
          const mockSupplier = mockSuppliers.find(s => s.id === drug.supplier_id)
          supplier = mockSupplier || null
        }
        
        return {
          ...drug,
          category,
          supplier,
        }
      })

      return { data: drugsWithRelations, error: null }
    }

    // Fallback to mock data
    const search = query.toLowerCase()
    let drugs = mockDrugs.filter(d => 
      d.hospital_id === hospitalId &&
      (d.drug_code.toLowerCase().includes(search) ||
       d.drug_name.toLowerCase().includes(search) ||
       d.generic_name?.toLowerCase().includes(search) ||
       d.brand_name?.toLowerCase().includes(search) ||
       d.sku?.toLowerCase().includes(search) ||
       d.pku?.toLowerCase().includes(search))
    )

    // Enrich with relations
    const drugsWithRelations: DrugWithRelations[] = drugs.slice(0, limit).map(drug => {
      const category = mockDrugCategories.find(c => c.id === drug.category_id)
      const supplier = mockSuppliers.find(s => s.id === drug.supplier_id)
      
      return {
        ...drug,
        category,
        supplier,
      }
    })

    return { data: drugsWithRelations, error: null }
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
    const drug = mockDrugs.find(d => d.id === drugId)
    
    if (!drug) {
      return { data: null, error: 'Drug not found' }
    }

    const category = mockDrugCategories.find(c => c.id === drug.category_id)
    const supplier = mockSuppliers.find(s => s.id === drug.supplier_id)

    const drugWithRelations: DrugWithRelations = {
      ...drug,
      category,
      supplier,
    }

    return { data: drugWithRelations, error: null }
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
    // Validate category_id is a valid UUID if Supabase is configured
    if (isSupabaseConfigured() && drugData.category_id && !isValidUUID(drugData.category_id)) {
      console.error('Invalid category_id format (not a UUID):', drugData.category_id)
      return {
        data: null,
        error: `Invalid category_id format: "${drugData.category_id}". Category ID must be a valid UUID. This usually means the category was not properly resolved from the Excel import.`,
      }
    }

    // Validate supplier_id is a valid UUID if Supabase is configured
    if (isSupabaseConfigured() && drugData.supplier_id && !isValidUUID(drugData.supplier_id)) {
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

    if (isSupabaseConfigured()) {
      try {
        console.log('[createDrug] Inserting drug:', insertData.drug_code, 'Procurement Vote:', insertData.procurement_vote)
        const { data, error } = await supabase
          .from('drugs')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          console.error('Error creating drug in Supabase:', error)
          console.error('Failing data:', insertData)
          return {
            data: null,
            error: `Failed to create drug: ${error.message}${error.hint ? ` (${error.hint})` : ''}`,
          }
        }

        if (!data) {
          return {
            data: null,
            error: 'Failed to create drug: No data returned from database',
          }
        }

        // Get relations
        const categoriesResult = await getDrugCategories()
        const categoriesList = categoriesResult.data || []
        const category = categoriesList.find(c => c.id === data.category_id)
        
        let supplier = null
        if (data.supplier_id) {
          const { data: supplierData } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', data.supplier_id)
            .single()
          supplier = supplierData as Supplier | null
        }

        const drugWithRelations: DrugWithRelations = {
          ...data,
          category,
          supplier,
        }

        console.log('Created drug in Supabase:', drugWithRelations.id)
        return { data: drugWithRelations, error: null }
      } catch (insertError) {
        console.error('Exception during Supabase insert:', insertError)
        return {
          data: null,
          error: `Failed to create drug: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`,
        }
      }
    }

    // Fallback to mock data
    const newId = `drug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newDrug: Drug = {
      id: newId,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const category = mockDrugCategories.find(c => c.id === newDrug.category_id)
    const supplier = mockSuppliers.find(s => s.id === newDrug.supplier_id)

    const drugWithRelations: DrugWithRelations = {
      ...newDrug,
      category,
      supplier,
    }

    mockDrugs.push(drugWithRelations)
    console.warn('Created drug (MOCK - not saved to Supabase):', drugWithRelations.id)

    return { data: drugWithRelations, error: null }
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
    // Validate category_id is a valid UUID if Supabase is configured
    if (isSupabaseConfigured() && drugData.category_id !== undefined && drugData.category_id !== null && !isValidUUID(drugData.category_id)) {
      console.error('Invalid category_id format (not a UUID):', drugData.category_id)
      return {
        data: null,
        error: `Invalid category_id format: "${drugData.category_id}". Category ID must be a valid UUID.`,
      }
    }

    // Validate supplier_id is a valid UUID if Supabase is configured
    if (isSupabaseConfigured() && drugData.supplier_id !== undefined && drugData.supplier_id !== null && !isValidUUID(drugData.supplier_id)) {
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

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('drugs')
        .update(updateData)
        .eq('id', drugId)
        .select()
        .single()

      if (error) {
        console.error('Error updating drug in Supabase:', error)
        throw error
      }

      if (!data) {
        return { data: null, error: 'Drug not found' }
      }

      // Get relations
      const categoriesResult = await getDrugCategories()
      const categoriesList = categoriesResult.data || []
      const category = categoriesList.find(c => c.id === data.category_id)
      
      let supplier = null
      if (data.supplier_id) {
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', data.supplier_id)
          .single()
        supplier = supplierData as Supplier | null
      }

      const drugWithRelations: DrugWithRelations = {
        ...data,
        category,
        supplier,
      }

      console.log('Updated drug in Supabase:', drugId)
      return { data: drugWithRelations, error: null }
    }

    // Fallback to mock data
    const drug = mockDrugs.find(d => d.id === drugId)
    
    if (!drug) {
      return { data: null, error: 'Drug not found' }
    }

    const updatedDrug: Drug = {
      ...drug,
      ...drugData,
      packaging_description: (drugData as any).packaging_description !== undefined 
        ? (drugData as any).packaging_description 
        : (drug as any).packaging_description,
      item_sub_class: (drugData as any).item_sub_class !== undefined 
        ? (drugData as any).item_sub_class 
        : (drug as any).item_sub_class,
      updated_at: new Date().toISOString(),
    }

    const category = mockDrugCategories.find(c => c.id === updatedDrug.category_id)
    const supplier = mockSuppliers.find(s => s.id === updatedDrug.supplier_id)

    const drugWithRelations: DrugWithRelations = {
      ...updatedDrug,
      category,
      supplier,
    }

    // Update the item in the mock data array
    const index = mockDrugs.findIndex(d => d.id === drugId)
    if (index !== -1) {
      mockDrugs[index] = drugWithRelations
    }

    return { data: drugWithRelations, error: null }
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
    const drug = mockDrugs.find(d => d.id === drugId)
    
    if (!drug) {
      return { data: null, error: 'Drug not found' }
    }

    // In real implementation, this would delete from database
    // For now, we'll just return success
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
      drug.supplier?.supplier_name || '',
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
    const supabaseConfigured = isSupabaseConfigured()
    console.log('='.repeat(60))
    console.log('[batchImportDrugs] DIAGNOSTICS:')
    console.log('[batchImportDrugs] Supabase configured:', supabaseConfigured)
    console.log('[batchImportDrugs] Hospital ID:', hospitalId)
    console.log('[batchImportDrugs] Total items to import:', drugs.length)
    console.log('='.repeat(60))

    const errors: string[] = []
    let successCount = 0

    // Filter out undefined/null entries and empty objects
    const validDrugs = drugs.filter(
      (item, index) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )
    console.log('[batchImportDrugs] Valid items after filtering:', validDrugs.length)

    // Track duplicate item codes within this upload to avoid processing same code multiple times
    const seenDrugCodes = new Set<string>()

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
    const invalidNamePatterns = ['each', 'pack of', 'contract', 'drug name', 'item name']

    // Preload existing drugs for this hospital in a single (chunked) query to avoid
    // thousands of per-row GET calls which slow imports dramatically.
    let existingByCode: Map<string, { id: string }> | null = null
    if (supabaseConfigured && totalItems > 0) {
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

          ;(data || []).forEach((row: any) => {
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
    
    for (let i = 0; i < validDrugs.length; i++) {
      const drugData = validDrugs[i]
      
      // Safety check - skip if still undefined/null
      if (!drugData || typeof drugData !== 'object') {
        errors.push(`Row ${i + 2}: Invalid data entry`)
        continue
      }
      
      // Validate required fields
      if (!drugData.drug_code || !drugData.drug_name) {
        errors.push(`Row ${i + 2}: Missing required fields (Item Code or Drug Name)`)
        continue
      }
      
      // STRICT VALIDATION: Filter out invalid drug codes and names
      const drugCode = String(drugData.drug_code).trim().toUpperCase()
      const drugName = String(drugData.drug_name).trim().toLowerCase()
      
      // Check if drug code is invalid (header, label, etc.)
      if (invalidDrugCodes.includes(drugCode)) {
        errors.push(`Row ${i + 2}: Invalid drug code "${drugData.drug_code}" (appears to be a header or label, not a product code)`)
        continue
      }

      // Check for duplicates within the same upload file
      if (seenDrugCodes.has(drugCode)) {
        errors.push(`Row ${i + 2}: Duplicate item code "${drugData.drug_code}" in this upload. This row was skipped to prevent multiple records for the same code.`)
        continue
      }
      seenDrugCodes.add(drugCode)
      
      // Check if drug name is invalid (generic text, header, etc.)
      let isInvalidName = false
      for (const pattern of invalidNamePatterns) {
        if (drugName === pattern || drugName.startsWith(pattern + ' ') || drugName === pattern) {
          isInvalidName = true
          break
        }
      }
      
      if (isInvalidName) {
        errors.push(`Row ${i + 2}: Invalid drug name "${drugData.drug_name}" (appears to be generic text or header, not a product name)`)
        continue
      }
      
      // Additional validation: drug code should be at least 3 characters
      if (drugCode.length < 3) {
        errors.push(`Row ${i + 2}: Drug code "${drugData.drug_code}" is too short (minimum 3 characters)`)
        continue
      }
      
      // Additional validation: drug name should be at least 5 characters
      if (drugName.length < 5) {
        errors.push(`Row ${i + 2}: Drug name "${drugData.drug_name}" is too short (minimum 5 characters)`)
        continue
      }
      
      // Reject if name is just a number
      if (/^\d+$/.test(drugName)) {
        errors.push(`Row ${i + 2}: Drug name "${drugData.drug_name}" is invalid (cannot be just a number)`)
        continue
      }

      // Check if drug already exists
      let existing: { id: string } | null = null
      if (supabaseConfigured) {
        // Use preloaded map instead of per-row network calls
        if (existingByCode) {
          existing = existingByCode.get(drugCode) || null
        }
      } else {
        // Check in mock data
        const found = mockDrugs.find(
          d => d.drug_code === drugCode && d.hospital_id === hospitalId
        )
        existing = found ? { id: found.id } : null
      }

      if (existing) {
        // Update existing
        try {
          const updateResult = await updateDrug(existing.id, {
            ...drugData,
            hospital_id: hospitalId,
          } as any)
          if (updateResult.error) {
            errors.push(`Row ${i + 2}: ${updateResult.error}`)
          } else {
            successCount++
            console.log(`[batchImportDrugs] ✓ Updated drug: ${drugCode}`)
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to update - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        // Create new
        try {
          const createResult = await createDrug(hospitalId, {
            ...drugData,
          } as any)
          if (createResult.error) {
            errors.push(`Row ${i + 2}: ${createResult.error}`)
          } else {
            successCount++
            console.log(`[batchImportDrugs] ✓ Created drug: ${drugCode}`)
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to create - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Per-row progress callback
      if (onProgress) {
        const processed = i + 1
        onProgress({
          processed,
          total: totalItems,
          success: successCount,
          failed: errors.length,
        })
      }
    }

    console.log('[batchImportDrugs] Import complete. Success:', successCount, 'Errors:', errors.length)
    if (supabaseConfigured) {
      // Verify in Supabase
      const { count } = await supabase
        .from('drugs')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId)
      console.log('[batchImportDrugs] Total drugs in Supabase for hospital:', count)
    } else {
      console.log('[batchImportDrugs] Total items in mockDrugs array:', mockDrugs.length)
      console.log('[batchImportDrugs] Items with matching hospital_id:', mockDrugs.filter(d => d.hospital_id === hospitalId).length)
      console.warn('[batchImportDrugs] ⚠ WARNING: Items saved to mock data, not Supabase!')
    }
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

