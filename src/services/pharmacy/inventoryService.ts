/**
 * Pharmacy Inventory Service
 * Handles drug and non-drug inventory management
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  DrugWithRelations,
  DrugCategory,
  NonDrugWithRelations,
  NonDrugCategory,
  StockBatchWithRelations,
  StockTransaction,
  InventoryFilter,
  StockLocation,
  ExpiryItem,
  SlowMovingItem,
  StockLevelSummary,
} from '@/types/pharmacy'

// =====================================================
// DRUG MANAGEMENT
// =====================================================



/**
 * Get single drug by ID
 */


/**
 * Get drug categories
 */
export async function getDrugCategories(): Promise<ApiResponse<DrugCategory[]>> {
  try {
    const { data, error } = await supabase
      .from('drug_categories')
      .select('*')
      .order('category_name', { ascending: true })

    if (error) throw error

    return { data: (data || []) as DrugCategory[], error: null }
  } catch (error) {
    console.error('Error fetching drug categories:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    }
  }
}

/**
 * Create or get drug category by name
 */
export async function createOrGetDrugCategory(categoryName: string, hospitalId?: string): Promise<ApiResponse<DrugCategory>> {
  try {
    if (!categoryName || !categoryName.trim()) {
      return { data: null, error: 'Category name is required' }
    }

    const nameTrimmed = categoryName.trim()
    const categoryCode = nameTrimmed
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .substring(0, 20)

    // Check if category already exists in Supabase
    // Try to find by name first, then by code
    let query = supabase
      .from('drug_categories')
      .select('*')
      .or(`category_name.ilike."${nameTrimmed}",category_code.ilike."${categoryCode}"`)

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    const { data: existing, error: queryError } = await query.limit(1)

    if (queryError) {
      // If .or() syntax fails, try separate queries
      console.warn('Error with .or() query, trying separate queries:', queryError)

      let nameQuery = supabase
        .from('drug_categories')
        .select('*')
        .ilike('category_name', nameTrimmed)
        .limit(1)

      if (hospitalId) {
        nameQuery = nameQuery.eq('hospital_id', hospitalId)
      }

      const { data: byName } = await nameQuery

      if (byName && byName.length > 0) {
        return { data: byName[0] as DrugCategory, error: null }
      }

      let codeQuery = supabase
        .from('drug_categories')
        .select('*')
        .ilike('category_code', categoryCode)
        .limit(1)

      if (hospitalId) {
        codeQuery = codeQuery.eq('hospital_id', hospitalId)
      }

      const { data: byCode } = await codeQuery

      if (byCode && byCode.length > 0) {
        return { data: byCode[0] as DrugCategory, error: null }
      }
    } else if (existing && existing.length > 0) {
      return { data: existing[0] as DrugCategory, error: null }
    }

    // Create new category in Supabase
    const insertData: any = {
      category_code: categoryCode,
      category_name: nameTrimmed,
      description: `Category for ${nameTrimmed}`,
    }

    if (hospitalId) {
      insertData.hospital_id = hospitalId
    }

    const { data: newCategory, error } = await supabase
      .from('drug_categories')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return { data: newCategory as DrugCategory, error: null }
  } catch (error) {
    console.error('Error creating/getting drug category:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create/get category',
    }
  }
}

// =====================================================
// NON-DRUG MANAGEMENT
// =====================================================

/**
 * Get all non-drugs with optional filtering
 */
export async function getNonDrugs(
  hospitalId: string,
  filter?: InventoryFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<NonDrugWithRelations>>> {
  try {
    let query = supabase
      .from('non_drugs')
      .select(
        `
        id,
        hospital_id,
        item_code,
        item_name,
        category_id,
        unit_of_measure,
        min_stock_level,
        max_stock_level,
        reorder_level,
        status,
        sku,
        pku,
        supplier_id,
        procurement_vote,
        price,
        packaging_description,
        created_at,
        updated_at,
        category:non_drug_categories (*),
        supplier:suppliers (*)
      `,
        { count: 'exact' }
      )
      .eq('hospital_id', hospitalId)

    if (filter?.search) {
      const search = filter.search.trim()
      if (search) {
        query = query.or(
          [
            `item_code.ilike.%${search}%`,
            `item_name.ilike.%${search}%`,
          ].join(',')
        )
      }
    }

    if (filter?.category_id) {
      query = query.eq('category_id', filter.category_id)
    }

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('item_name', { ascending: true })
      .range(from, to)

    if (error) throw error

    const rows = (data || []) as unknown as NonDrugWithRelations[]

    return {
      data: {
        data: rows,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching non-drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch non-drugs',
    }
  }
}

/**
 * Get non-drug categories
 */
export async function getNonDrugCategories(): Promise<ApiResponse<NonDrugCategory[]>> {
  try {
    const { data, error } = await supabase
      .from('non_drug_categories')
      .select('*')
      .order('category_name', { ascending: true })

    if (error) throw error

    return { data: (data || []) as NonDrugCategory[], error: null }
  } catch (error) {
    console.error('Error fetching non-drug categories:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    }
  }
}

/**
 * Create or get non-drug category by name
 */
export async function createOrGetNonDrugCategory(categoryName: string, hospitalId?: string): Promise<ApiResponse<NonDrugCategory>> {
  try {
    if (!categoryName || !categoryName.trim()) {
      return { data: null, error: 'Category name is required' }
    }

    const nameTrimmed = categoryName.trim()
    const categoryCode = nameTrimmed
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .substring(0, 20)

    // Check if category already exists
    let query = supabase
      .from('non_drug_categories')
      .select('*')
      .or(`category_name.ilike.${nameTrimmed},category_code.ilike.${categoryCode}`)
      .limit(1)

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    const { data: existing } = await query

    if (existing && existing.length > 0) {
      return { data: existing[0] as NonDrugCategory, error: null }
    }

    // Create new category
    const insertData: any = {
      category_code: categoryCode,
      category_name: nameTrimmed,
      description: `Category for ${nameTrimmed}`,
    }

    if (hospitalId) {
      insertData.hospital_id = hospitalId
    }

    const { data: newCategory, error } = await supabase
      .from('non_drug_categories')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return { data: newCategory as NonDrugCategory, error: null }
  } catch (error) {
    console.error('Error creating/getting category:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create/get category',
    }
  }
}

// =====================================================
// STOCK BATCH MANAGEMENT
// =====================================================

/**
 * Get stock batches for an item
 */
export async function getStockBatches(
  itemId: string,
  itemType: 'drug' | 'non_drug'
): Promise<ApiResponse<StockBatchWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_batches')
      .select(`
        *,
        location:pharmacy_stock_locations (*)
      `)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return { data: data as StockBatchWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching batches:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch batches',
    }
  }
}

/**
 * Get all batches with optional filtering
 */
export async function getAllBatches(
  hospitalId: string,
  filter?: {
    item_type?: 'drug' | 'non_drug' | 'all'
    status?: string
    location_id?: string
  }
): Promise<ApiResponse<StockBatchWithRelations[]>> {
  try {
    let query = supabase
      .from('pharmacy_stock_batches')
      .select(`
        *,
        location:pharmacy_stock_locations (*)
      `)
      .eq('hospital_id', hospitalId)

    if (filter?.item_type && filter.item_type !== 'all') {
      query = query.eq('item_type', filter.item_type)
    }

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    if (filter?.location_id) {
      query = query.eq('location_id', filter.location_id)
    }

    const { data, error } = await query.order('expiry_date', { ascending: true })

    if (error) throw error
    return { data: data as StockBatchWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching batches:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch batches',
    }
  }
}

// =====================================================
// STOCK LOCATIONS
// =====================================================

/**
 * Get all stock locations
 */


// =====================================================
// EXPIRY MANAGEMENT
// =====================================================

/**
 * Get items near expiry
 */
export async function getNearExpiryItems(
  hospitalId: string,
  daysThreshold: number = 30
): Promise<ApiResponse<ExpiryItem[]>> {
  try {
    // Current date plus threshold
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    // In a real implementation, we would query and join/calculate this.
    // For now, returning empty as it's complex to mirror perfectly from Supabase without time-series/calculated views
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching near expiry items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch near expiry items',
    }
  }
}

/**
 * Get expired items
 */
export async function getExpiredItems(
  hospitalId: string
): Promise<ApiResponse<ExpiryItem[]>> {
  try {
    // Similar to near expiry
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching expired items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch expired items',
    }
  }
}

// =====================================================
// SLOW MOVING ITEMS
// =====================================================

/**
 * Get slow moving items
 */
export async function getSlowMovingItems(
  hospitalId: string,
  daysSinceMovement: number = 90
): Promise<ApiResponse<SlowMovingItem[]>> {
  try {
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching slow moving items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch slow moving items',
    }
  }
}

// =====================================================
// STOCK LEVEL SUMMARY
// =====================================================

/**
 * Get stock level summary for all items
 */
export async function getStockLevelSummary(
  hospitalId: string,
  filter?: InventoryFilter
): Promise<ApiResponse<StockLevelSummary[]>> {
  try {
    // In a real implementation, this would be a complex join or a view
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching stock level summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stock level summary',
    }
  }
}

// =====================================================
// STOCK TRANSACTIONS
// =====================================================

/**
 * Create stock transaction
 */
export async function createStockTransaction(
  hospitalId: string,
  transaction: Omit<StockTransaction, 'id' | 'created_at' | 'transaction_number'>
): Promise<ApiResponse<StockTransaction>> {
  try {
    const { data: newTransaction, error } = await supabase
      .from('pharmacy_stock_transactions')
      .insert({
        ...transaction,
        hospital_id: hospitalId,
      })
      .select()
      .single()

    if (error) throw error

    return { data: newTransaction as StockTransaction, error: null }
  } catch (error) {
    console.error('Error creating transaction:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    }
  }
}

export async function getStockLocations(hospitalId: string): Promise<ApiResponse<StockLocation[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_locations')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('location_name')

    if (error) throw error

    return { data: data as StockLocation[], error: null }
  } catch (error) {
    console.error('Error fetching stock locations:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stock locations',
    }
  }
}
