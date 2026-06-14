/**
 * Non-Drug Catalog Service
 * Handles non-drug catalog operations with full CRUD functionality
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { NonDrug, NonDrugWithRelations, NonDrugCategory, Supplier } from '@/types/pharmacy'
import { mockNonDrugs, mockNonDrugCategories, mockSuppliers } from './mockData'
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
    const supabaseConfigured = isSupabaseConfigured()

    if (supabaseConfigured) {
      // Use real data from Supabase when configured
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
    }

    // Fallback to mock data when Supabase is not configured
    const mockDataIds = ['nd-001', 'nd-002', 'nd-003', 'nd-004', 'nd-005', 'nd-006', 'nd-007', 'nd-008', 'nd-009', 'nd-010', 'nd-011']
    const nonDrugs = mockNonDrugs.filter(
      (d) => d.hospital_id === hospitalId && !mockDataIds.includes(d.id)
    )

    const kpis: NonDrugCatalogKPIs = {
      total: nonDrugs.length,
      active: nonDrugs.filter((d) => d.status === 'active').length,
      inactive: nonDrugs.filter((d) => d.status === 'inactive').length,
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
    const supabaseConfigured = isSupabaseConfigured()
    console.log('[getNonDrugCatalog] Supabase configured:', supabaseConfigured, 'hospitalId:', hospitalId)
    
    if (supabaseConfigured) {
      // Build query
      let query = supabase
        .from('non_drugs')
        .select('*', { count: 'exact' })
        .eq('hospital_id', hospitalId)

      // Apply filters
      if (filter?.search) {
        const search = filter.search
        query = query.or(`item_code.ilike.%${search}%,item_name.ilike.%${search}%,sku.ilike.%${search}%,pku.ilike.%${search}%`)
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

      // Order alphabetically by item_name (then by code) so list shows A → Z
      query = query
        .order('item_name', { ascending: true })
        .order('item_code', { ascending: true })

      // Search filter (applied on Supabase)
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
    }

    // Fallback to mock data - don't filter out mock items if no supabase is configured, otherwise we have no items
    const actualNonDrugs = mockNonDrugs.filter(d => 
      d.hospital_id === hospitalId
    )
    
    console.log('getNonDrugCatalog called with hospitalId:', hospitalId)
    console.log('Total items (excluding mock):', actualNonDrugs.length)
    
    let nonDrugs = [...actualNonDrugs]

    // Apply filters
    if (filter?.search) {
      const search = filter.search.toLowerCase()
      nonDrugs = nonDrugs.filter(d =>
        d.item_code.toLowerCase().includes(search) ||
        d.item_name.toLowerCase().includes(search) ||
        d.sku?.toLowerCase().includes(search) ||
        d.pku?.toLowerCase().includes(search)
      )
    }

    if (filter?.category_id) {
      nonDrugs = nonDrugs.filter(d => d.category_id === filter.category_id)
    }

    if (filter?.supplier_id) {
      nonDrugs = nonDrugs.filter(d => d.supplier_id === filter.supplier_id)
    }

    if (filter?.procurement_vote) {
      nonDrugs = nonDrugs.filter(d => d.procurement_vote === filter.procurement_vote)
    }

    if (filter?.status) {
      nonDrugs = nonDrugs.filter(d => d.status === filter.status)
    }

    // Get categories (excluding mock data)
    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    
    // Enrich with relations
    const nonDrugsWithRelations: NonDrugWithRelations[] = nonDrugs.map(item => {
      const category = categoriesList.find(c => c.id === item.category_id)
      const supplier = mockSuppliers.find(s => s.id === item.supplier_id)
      
      return {
        ...item,
        category,
        supplier,
      }
    })

    const total = nonDrugsWithRelations.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = nonDrugsWithRelations.slice(start, start + pageSize)

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

    if (isSupabaseConfigured()) {
      const { data: nonDrugs, error } = await supabase
        .from('non_drugs')
        .select('*')
        .eq('hospital_id', hospitalId)
        .or(`item_code.ilike.%${query}%,item_name.ilike.%${query}%,sku.ilike.%${query}%,pku.ilike.%${query}%`)
        .limit(limit)

      if (error) throw error

      // Get relations
      const categoriesResult = await getNonDrugCategories()
      const categoriesList = categoriesResult.data || []
      
      // Get suppliers
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('hospital_id', hospitalId)
      const suppliersList = (suppliersData || []) as Supplier[]

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
    }

    // Fallback to mock data
    const search = query.toLowerCase()
    let nonDrugs = mockNonDrugs.filter(d => 
      d.hospital_id === hospitalId && 
      (d.item_code.toLowerCase().includes(search) ||
       d.item_name.toLowerCase().includes(search) ||
       d.sku?.toLowerCase().includes(search) ||
       d.pku?.toLowerCase().includes(search))
    )

    // Get categories (excluding mock data)
    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    
    // Enrich with relations
    const nonDrugsWithRelations: NonDrugWithRelations[] = nonDrugs.slice(0, limit).map(item => {
      const category = categoriesList.find(c => c.id === item.category_id)
      const supplier = mockSuppliers.find(s => s.id === item.supplier_id)
      
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
    const nonDrug = mockNonDrugs.find(d => d.id === nonDrugId)
    
    if (!nonDrug) {
      return { data: null, error: 'Non-drug item not found' }
    }

    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    const category = categoriesList.find(c => c.id === nonDrug.category_id)
    const supplier = mockSuppliers.find(s => s.id === nonDrug.supplier_id)

    const nonDrugWithRelations: NonDrugWithRelations = {
      ...nonDrug,
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
export async function createNonDrug(
  hospitalId: string,
  nonDrugData: Partial<NonDrug>
): Promise<ApiResponse<NonDrugWithRelations>> {
  try {
    const supabaseConfigured = isSupabaseConfigured()
    console.log('[createNonDrug] ========== START ==========')
    console.log('[createNonDrug] Supabase configured:', supabaseConfigured)
    console.log('[createNonDrug] hospitalId:', hospitalId)
    console.log('[createNonDrug] item_code:', nonDrugData.item_code)
    console.log('[createNonDrug] item_name:', nonDrugData.item_name)
    
    const insertData: any = {
      hospital_id: hospitalId,
      item_code: nonDrugData.item_code || `ND-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      item_name: nonDrugData.item_name || '',
      // Ensure UUID fields are valid UUIDs or null to avoid
      // “invalid input syntax for type uuid” errors when Excel
      // columns contain names like "Cannula", "Thermometer", etc.
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

    console.log('[createNonDrug] Insert data:', JSON.stringify(insertData, null, 2))

    if (supabaseConfigured) {
      console.log('[createNonDrug] ✓ Supabase is configured, attempting insert...')
      try {
        const { data, error } = await supabase
          .from('non_drugs')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          console.error('[createNonDrug] ✗ Supabase INSERT ERROR:', error)
          console.error('[createNonDrug] Error code:', error.code)
          console.error('[createNonDrug] Error message:', error.message)
          console.error('[createNonDrug] Error details:', JSON.stringify(error, null, 2))
          console.error('[createNonDrug] Error hint:', error.hint)
          return {
            data: null,
            error: `Failed to create non-drug: ${error.message}${error.hint ? ` (${error.hint})` : ''}`,
          }
        }
        
        if (!data) {
          console.error('[createNonDrug] ✗ No data returned from Supabase insert')
          return {
            data: null,
            error: 'Failed to create non-drug: No data returned from database',
          }
        }
        
        console.log('[createNonDrug] ✓ Successfully inserted into Supabase. ID:', data.id)

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
            .single()
          supplier = supplierData as Supplier | null
        }

        const nonDrugWithRelations: NonDrugWithRelations = {
          ...data,
          category,
          supplier,
        }

        console.log('[createNonDrug] Created non-drug in Supabase:', {
          id: nonDrugWithRelations.id,
          item_code: nonDrugWithRelations.item_code,
          hospital_id: nonDrugWithRelations.hospital_id,
        })

        console.log('[createNonDrug] ========== SUCCESS ==========')
        return { data: nonDrugWithRelations, error: null }
      } catch (insertError) {
        console.error('[createNonDrug] ✗ Exception during Supabase insert:', insertError)
        return {
          data: null,
          error: `Failed to create non-drug: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`,
        }
      }
    } else {
      console.warn('[createNonDrug] ⚠ Supabase not configured - using mock data')
      console.warn('[createNonDrug] Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }

    // Fallback to mock data
    const newId = `nondrug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNonDrug: NonDrug = {
      id: newId,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    const category = categoriesList.find(c => c.id === newNonDrug.category_id)
    const supplier = mockSuppliers.find(s => s.id === newNonDrug.supplier_id)

    const nonDrugWithRelations: NonDrugWithRelations = {
      ...newNonDrug,
      category,
      supplier,
    }

    mockNonDrugs.push(nonDrugWithRelations)
    
    console.log('[createNonDrug] Created non-drug (MOCK - not saved to Supabase):', {
      id: nonDrugWithRelations.id,
      item_code: nonDrugWithRelations.item_code,
    })
    console.log('[createNonDrug] ⚠ WARNING: Item was saved to mock data, not Supabase!')
    console.log('[createNonDrug] ========== END (MOCK) ==========')

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

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('non_drugs')
        .update(updateData)
        .eq('id', nonDrugId)
        .select()
        .single()

      if (error) throw error

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
          .single()
        supplier = supplierData as Supplier | null
      }

      const nonDrugWithRelations: NonDrugWithRelations = {
        ...data,
        category,
        supplier,
      }

      console.log('Updated non-drug in Supabase:', nonDrugId)
      return { data: nonDrugWithRelations, error: null }
    }

    // Fallback to mock data
    const nonDrug = mockNonDrugs.find(d => d.id === nonDrugId)
    
    if (!nonDrug) {
      return { data: null, error: 'Non-drug item not found' }
    }

    const updatedNonDrug: NonDrug = {
      ...nonDrug,
      ...nonDrugData,
      packaging_description: (nonDrugData as any).packaging_description !== undefined 
        ? (nonDrugData as any).packaging_description 
        : (nonDrug as any).packaging_description,
      updated_at: new Date().toISOString(),
    }

    const categoriesResult = await getNonDrugCategories()
    const categoriesList = categoriesResult.data || []
    const category = categoriesList.find(c => c.id === updatedNonDrug.category_id)
    const supplier = mockSuppliers.find(s => s.id === updatedNonDrug.supplier_id)

    const nonDrugWithRelations: NonDrugWithRelations = {
      ...updatedNonDrug,
      category,
      supplier,
    }

    const index = mockNonDrugs.findIndex(d => d.id === nonDrugId)
    if (index !== -1) {
      mockNonDrugs[index] = nonDrugWithRelations
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
    console.log('Supabase configured:', isSupabaseConfigured())
    
    if (isSupabaseConfigured()) {
      // First check if item exists
      const { data: existing, error: checkError } = await supabase
        .from('non_drugs')
        .select('id, item_code, item_name')
        .eq('id', nonDrugId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking non-drug existence:', checkError)
        throw checkError
      }

      if (!existing) {
        console.warn('Non-drug not found in Supabase:', nonDrugId)
        return { data: null, error: 'Non-drug item not found' }
      }

      console.log('Deleting from Supabase:', { id: existing.id, code: existing.item_code, name: existing.item_name })

      const { error } = await supabase
        .from('non_drugs')
        .delete()
        .eq('id', nonDrugId)

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('Successfully deleted non-drug from Supabase:', nonDrugId)
      return { data: undefined, error: null }
    }

    // Fallback to mock data
    console.log('Using mock data (Supabase not configured)')
    const index = mockNonDrugs.findIndex(d => d.id === nonDrugId)
    
    if (index === -1) {
      console.warn('Non-drug not found in mock data:', nonDrugId)
      return { data: null, error: 'Non-drug item not found' }
    }

    const deleted = mockNonDrugs[index]
    mockNonDrugs.splice(index, 1)
    console.log('Deleted non-drug (mock):', {
      id: deleted.id,
      code: deleted.item_code,
      name: deleted.item_name,
      remaining: mockNonDrugs.length
    })

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
    const supabaseConfigured = isSupabaseConfigured()
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'NOT SET'
    const hasAnonKey = !!(import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder-key')
    
    console.log('='.repeat(60))
    console.log('[batchImportNonDrugs] DIAGNOSTICS:')
    console.log('[batchImportNonDrugs] Supabase URL:', supabaseUrl !== 'NOT SET' ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET')
    console.log('[batchImportNonDrugs] Supabase Anon Key:', hasAnonKey ? 'SET' : 'NOT SET')
    console.log('[batchImportNonDrugs] Supabase configured:', supabaseConfigured)
    console.log('[batchImportNonDrugs] Hospital ID:', hospitalId)
    console.log('[batchImportNonDrugs] Total items to import:', nonDrugs.length)
    console.log('='.repeat(60))
    const errors: string[] = []
    let successCount = 0

    // Filter out undefined/null entries and empty objects
    const validNonDrugs = nonDrugs.filter(
      (item, index) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )
    console.log('Valid items after filtering:', validNonDrugs.length)

    const totalItems = validNonDrugs.length

    // Track duplicate item codes within this upload
    const seenItemCodes = new Set<string>()

    // Invalid item codes and names to filter out
    const invalidItemCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'NON-DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']
    const invalidNamePatterns = ['each', 'pack of', 'contract', 'non-drug name', 'item name', 'drug name']

    // Preload existing non-drugs for this hospital to avoid per-row GETs
    let existingByCode: Map<string, { id: string }> | null = null
    if (supabaseConfigured && totalItems > 0) {
      try {
        const allCodes = Array.from(
          new Set(
            validNonDrugs
              .map(d => (d && d.item_code ? String(d.item_code).trim().toUpperCase() : null))
              .filter((code): code is string => !!code)
          )
        )

        existingByCode = new Map()
        const chunkSize = 500
        for (let start = 0; start < allCodes.length; start += chunkSize) {
          const chunk = allCodes.slice(start, start + chunkSize)
          const { data, error } = await supabase
            .from('non_drugs')
            .select('id, item_code')
            .eq('hospital_id', hospitalId)
            .in('item_code', chunk)

          if (error) {
            console.error('[batchImportNonDrugs] Error preloading existing items:', error)
            errors.push(`Failed to check existing non-drug items for some codes: ${error.message}`)
            break
          }

          ;(data || []).forEach((row: any) => {
            if (!row || !row.item_code || !row.id) return
            const code = String(row.item_code).trim().toUpperCase()
            existingByCode!.set(code, { id: row.id })
          })
        }

        console.log(
          '[batchImportNonDrugs] Preloaded existing non-drugs for hospital:',
          existingByCode.size,
          'codes'
        )
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
    
    for (let i = 0; i < validNonDrugs.length; i++) {
      const nonDrugData = validNonDrugs[i]
      
      // Safety check - skip if still undefined/null
      if (!nonDrugData || typeof nonDrugData !== 'object') {
        errors.push(`Row ${i + 2}: Invalid data entry`)
        continue
      }
      
      // Validate required fields
      if (!nonDrugData.item_code || !nonDrugData.item_name) {
        errors.push(`Row ${i + 2}: Missing required fields (Item Code or Non-Drug Name)`)
        continue
      }
      
      // STRICT VALIDATION: Filter out invalid item codes and names
      const itemCode = String(nonDrugData.item_code).trim().toUpperCase()
      const itemName = String(nonDrugData.item_name).trim().toLowerCase()
      
      // Check if item code is invalid (header, label, etc.)
      if (invalidItemCodes.includes(itemCode)) {
        errors.push(`Row ${i + 2}: Invalid item code "${nonDrugData.item_code}" (appears to be a header or label, not a product code)`)
        continue
      }
      
      // Check if item name is invalid (generic text, header, etc.)
      let isInvalidName = false
      for (const pattern of invalidNamePatterns) {
        if (itemName === pattern || itemName.startsWith(pattern + ' ') || itemName === pattern) {
          isInvalidName = true
          break
        }
      }
      
      if (isInvalidName) {
        errors.push(`Row ${i + 2}: Invalid item name "${nonDrugData.item_name}" (appears to be generic text or header, not a product name)`)
        continue
      }
      
      // Additional validation: item code should be at least 3 characters
      if (itemCode.length < 3) {
        errors.push(`Row ${i + 2}: Item code "${nonDrugData.item_code}" is too short (minimum 3 characters)`)
        continue
      }
      
      // Additional validation: item name should be at least 5 characters
      if (itemName.length < 5) {
        errors.push(`Row ${i + 2}: Item name "${nonDrugData.item_name}" is too short (minimum 5 characters)`)
        continue
      }
      
      // Reject if name is just a number
      if (/^\d+$/.test(itemName)) {
        errors.push(`Row ${i + 2}: Item name "${nonDrugData.item_name}" is invalid (cannot be just a number)`)
        continue
      }

      // Check for duplicates within the same upload file
      if (seenItemCodes.has(itemCode)) {
        errors.push(
          `Row ${i + 2}: Duplicate item code "${nonDrugData.item_code}" in this upload. This row was skipped to prevent multiple records for the same code.`
        )
        continue
      }
      seenItemCodes.add(itemCode)

      // Check if non-drug already exists
      let existing: { id: string } | null = null
      if (supabaseConfigured) {
        if (existingByCode) {
          existing = existingByCode.get(itemCode) || null
        }
      } else {
        const found = mockNonDrugs.find(
          d => d.item_code === nonDrugData.item_code && d.hospital_id === hospitalId
        )
        existing = found ? { id: found.id } : null
      }

      if (existing) {
        // Update existing
        try {
          console.log(`[batchImportNonDrugs] Updating existing item ${existing.id} (${nonDrugData.item_code})`)
          const updateResult = await updateNonDrug(existing.id, {
            ...nonDrugData,
            hospital_id: hospitalId,
          } as any)
          if (updateResult.error) {
            console.error(`[batchImportNonDrugs] Update error for row ${i + 2}:`, updateResult.error)
            errors.push(`Row ${i + 2}: ${updateResult.error}`)
          } else {
            console.log(`[batchImportNonDrugs] Successfully updated item ${existing.id}`)
            successCount++
          }
        } catch (error) {
          console.error(`[batchImportNonDrugs] Exception updating row ${i + 2}:`, error)
          errors.push(`Row ${i + 2}: Failed to update - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        // Create new
        try {
          console.log(`[batchImportNonDrugs] Creating new item: ${nonDrugData.item_code} - ${nonDrugData.item_name}`)
          const createResult = await createNonDrug(hospitalId, {
            ...nonDrugData,
          } as any)
          if (createResult.error) {
            console.error(`[batchImportNonDrugs] Create error for row ${i + 2}:`, createResult.error)
            errors.push(`Row ${i + 2}: ${createResult.error}`)
          } else {
            console.log(`[batchImportNonDrugs] Successfully created item:`, createResult.data?.id)
            successCount++
          }
        } catch (error) {
          console.error(`[batchImportNonDrugs] Exception creating row ${i + 2}:`, error)
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

    console.log('Import complete. Success:', successCount, 'Errors:', errors.length)
    console.log('Total items in mockNonDrugs array:', mockNonDrugs.length)
    console.log('Items with matching hospital_id:', mockNonDrugs.filter(d => d.hospital_id === hospitalId).length)
    
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

