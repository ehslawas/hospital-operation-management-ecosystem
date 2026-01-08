/**
 * Pharmacy Inventory Service
 * Handles drug and non-drug inventory management
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  Drug,
  DrugWithRelations,
  DrugCategory,
  NonDrug,
  NonDrugWithRelations,
  NonDrugCategory,
  StockBatch,
  StockBatchWithRelations,
  StockLocation,
  StockTransaction,
  InventoryFilter,
  ExpiryItem,
  SlowMovingItem,
  StockLevelSummary,
  DrugFormData,
} from '@/types/pharmacy'
import {
  mockDrugs,
  mockDrugCategories,
  mockNonDrugs,
  mockNonDrugCategories,
  mockStockBatches,
  mockStockLocations,
  mockExpiryItems,
  mockSlowMovingItems,
} from './mockData'

// =====================================================
// DRUG MANAGEMENT
// =====================================================

/**
 * Get all drugs with optional filtering
 */
export async function getDrugs(
  hospitalId: string,
  filter?: InventoryFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<DrugWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      // Base query scoped to hospital
      let query = supabase
        .from('drugs')
        .select(
          `
          id,
          hospital_id,
          drug_code,
          drug_name,
          generic_name,
          brand_name,
          dosage_form,
          strength,
          unit_of_measure,
          category_id,
          is_controlled,
          requires_prescription,
          storage_conditions,
          min_stock_level,
          max_stock_level,
          reorder_level,
          lead_time_days,
          status,
          sku,
          pku,
          supplier_id,
          procurement_vote,
          price,
          packaging_description,
          item_sub_class,
          category:drug_categories (*),
          supplier:suppliers (*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)

      // Search filter (code/name/generic)
      if (filter?.search) {
        const search = filter.search.trim()
        if (search) {
          query = query.or(
            [
              `drug_code.ilike.%${search}%`,
              `drug_name.ilike.%${search}%`,
              `generic_name.ilike.%${search}%`,
            ].join(',')
          )
        }
      }

      // Category filter
      if (filter?.category_id) {
        query = query.eq('category_id', filter.category_id)
      }

      // Status filter
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }

      // Controlled drug filter
      if (filter?.is_controlled !== undefined) {
        query = query.eq('is_controlled', filter.is_controlled)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('drug_name', { ascending: true })
        .range(from, to)

      if (error) throw error

      const rows = (data || []) as DrugWithRelations[]

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
    }

    // Fallback to in-memory mock data when Supabase is not configured
    let drugs = [...mockDrugs]

    // Apply filters
    if (filter?.search) {
      const search = filter.search.toLowerCase()
      drugs = drugs.filter(d =>
        d.drug_code.toLowerCase().includes(search) ||
        d.drug_name.toLowerCase().includes(search) ||
        d.generic_name?.toLowerCase().includes(search)
      )
    }

    if (filter?.category_id) {
      drugs = drugs.filter(d => d.category_id === filter.category_id)
    }

    if (filter?.status && filter.status !== 'all') {
      drugs = drugs.filter(d => d.status === filter.status)
    }

    if (filter?.stock_status && filter.stock_status !== 'all') {
      drugs = drugs.filter(d => d.stock_status === filter.stock_status)
    }

    if (filter?.is_controlled !== undefined) {
      drugs = drugs.filter(d => d.is_controlled === filter.is_controlled)
    }

    const total = drugs.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = drugs.slice(start, start + pageSize)

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
    console.error('Error fetching drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch drugs',
    }
  }
}

/**
 * Get single drug by ID
 */
export async function getDrugById(drugId: string): Promise<ApiResponse<DrugWithRelations>> {
  try {
    const drug = mockDrugs.find(d => d.id === drugId)
    
    if (!drug) {
      return { data: null, error: 'Drug not found' }
    }

    return { data: drug, error: null }
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
export async function createDrug(
  hospitalId: string,
  data: DrugFormData
): Promise<ApiResponse<Drug>> {
  try {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newDrug: Drug = {
      id: `drug-${Date.now()}`,
      hospital_id: hospitalId,
      ...data,
      created_at: new Date().toISOString(),
    }

    return { data: newDrug, error: null }
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
  data: Partial<DrugFormData>
): Promise<ApiResponse<Drug>> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const drug = mockDrugs.find(d => d.id === drugId)
    if (!drug) {
      return { data: null, error: 'Drug not found' }
    }

    const updated = {
      ...drug,
      ...data,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error updating drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update drug',
    }
  }
}

/**
 * Get drug categories
 */
export async function getDrugCategories(): Promise<ApiResponse<DrugCategory[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('drug_categories')
        .select('*')
        .order('category_name', { ascending: true })

      if (error) throw error

      return { data: (data || []) as DrugCategory[], error: null }
    }

    // Fallback to mock data when Supabase is not configured
    return { data: mockDrugCategories, error: null }
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
    const nameLower = nameTrimmed.toLowerCase()
    const categoryCode = nameTrimmed
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .substring(0, 20)

    if (isSupabaseConfigured()) {
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
          console.log(`[CATEGORY] Found existing drug category in Supabase by name: ${nameTrimmed} (ID: ${byName[0].id})`)
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
          console.log(`[CATEGORY] Found existing drug category in Supabase by code: ${nameTrimmed} (ID: ${byCode[0].id})`)
          return { data: byCode[0] as DrugCategory, error: null }
        }
      } else if (existing && existing.length > 0) {
        console.log(`[CATEGORY] Found existing drug category in Supabase: ${nameTrimmed} (ID: ${existing[0].id})`)
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

      console.log(`[CATEGORY] Created new drug category in Supabase: ${nameTrimmed} (ID: ${newCategory.id})`)
      return { data: newCategory as DrugCategory, error: null }
    }

    // Fallback to mock data
    let existingCategory = mockDrugCategories.find(
      c => c.category_name.toLowerCase() === nameLower || c.category_code.toLowerCase() === nameLower
    )

    if (existingCategory) {
      return { data: existingCategory, error: null }
    }

    const newCategory: DrugCategory = {
      id: `dcat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category_code: categoryCode,
      category_name: nameTrimmed,
      description: `Category for ${nameTrimmed}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockDrugCategories.push(newCategory)
    console.log(`[CATEGORY] Created new drug category (mock): ${nameTrimmed} (ID: ${newCategory.id})`)

    return { data: newCategory, error: null }
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
    if (isSupabaseConfigured()) {
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

      const rows = (data || []) as NonDrugWithRelations[]

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
    }

    // Fallback to mock data
    let items = [...mockNonDrugs]

    if (filter?.search) {
      const search = filter.search.toLowerCase()
      items = items.filter(d =>
        d.item_code.toLowerCase().includes(search) ||
        d.item_name.toLowerCase().includes(search)
      )
    }

    if (filter?.category_id) {
      items = items.filter(d => d.category_id === filter.category_id)
    }

    if (filter?.status && filter.status !== 'all') {
      items = items.filter(d => d.status === filter.status)
    }

    if (filter?.stock_status && filter.stock_status !== 'all') {
      items = items.filter(d => d.stock_status === filter.stock_status)
    }

    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = items.slice(start, start + pageSize)

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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('non_drug_categories')
        .select('*')
        .order('category_name', { ascending: true })

      if (error) throw error

      return { data: (data || []) as NonDrugCategory[], error: null }
    }

    // Fallback to mock data
    const mockCategoryIds = ['ncat-001', 'ncat-002', 'ncat-003']
    const actualCategories = mockNonDrugCategories.filter(c => !mockCategoryIds.includes(c.id))
    
    return { data: actualCategories, error: null }
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
    const nameLower = nameTrimmed.toLowerCase()
    const categoryCode = nameTrimmed
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .substring(0, 20)

    if (isSupabaseConfigured()) {
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

      console.log(`[CATEGORY] Created new non-drug category in Supabase: ${nameTrimmed} (ID: ${newCategory.id})`)
      return { data: newCategory as NonDrugCategory, error: null }
    }

    // Fallback to mock data
    let existingCategory = mockNonDrugCategories.find(
      c => c.category_name.toLowerCase() === nameLower || c.category_code.toLowerCase() === nameLower
    )

    if (existingCategory) {
      return { data: existingCategory, error: null }
    }

    const newCategory: NonDrugCategory = {
      id: `ncat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category_code: categoryCode,
      category_name: nameTrimmed,
      description: `Category for ${nameTrimmed}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockNonDrugCategories.push(newCategory)
    console.log(`[CATEGORY] Created new category (mock): ${nameTrimmed} (ID: ${newCategory.id})`)

    return { data: newCategory, error: null }
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
    const batches = mockStockBatches.filter(
      b => b.item_id === itemId && b.item_type === itemType
    )
    return { data: batches, error: null }
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
    let batches = [...mockStockBatches]

    if (filter?.item_type && filter.item_type !== 'all') {
      batches = batches.filter(b => b.item_type === filter.item_type)
    }

    if (filter?.status) {
      batches = batches.filter(b => b.status === filter.status)
    }

    if (filter?.location_id) {
      batches = batches.filter(b => b.location_id === filter.location_id)
    }

    return { data: batches, error: null }
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
export async function getStockLocations(
  hospitalId: string
): Promise<ApiResponse<StockLocation[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_stock_locations')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('location_name', { ascending: true })

      if (error) throw error

      return { data: (data || []) as StockLocation[], error: null }
    }

    // Fallback to mock locations when Supabase is not configured
    return { data: mockStockLocations, error: null }
  } catch (error) {
    console.error('Error fetching locations:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch locations',
    }
  }
}

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
    const items = mockExpiryItems.filter(e => e.days_to_expiry <= daysThreshold)
    return { data: items, error: null }
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
    const items = mockExpiryItems.filter(e => e.status === 'expired')
    return { data: items, error: null }
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
    const items = mockSlowMovingItems.filter(
      s => s.days_since_movement >= daysSinceMovement
    )
    return { data: items, error: null }
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
    const summaries: StockLevelSummary[] = [
      ...mockDrugs.map(d => ({
        item_id: d.id,
        item_type: 'drug' as const,
        item_code: d.drug_code,
        item_name: d.drug_name,
        unit_of_measure: d.unit_of_measure,
        min_stock: d.min_stock_level,
        max_stock: d.max_stock_level,
        reorder_level: d.reorder_level,
        current_stock: d.current_stock || 0,
        available_stock: d.current_stock || 0,
        reserved_stock: 0,
        status: d.stock_status || 'in_stock',
      })),
      ...mockNonDrugs.map(n => ({
        item_id: n.id,
        item_type: 'non_drug' as const,
        item_code: n.item_code,
        item_name: n.item_name,
        unit_of_measure: n.unit_of_measure,
        min_stock: n.min_stock_level,
        max_stock: n.max_stock_level,
        reorder_level: n.reorder_level,
        current_stock: n.current_stock || 0,
        available_stock: n.current_stock || 0,
        reserved_stock: 0,
        status: n.stock_status || 'in_stock',
      })),
    ]

    return { data: summaries, error: null }
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
    await new Promise(resolve => setTimeout(resolve, 500))

    const newTransaction: StockTransaction = {
      id: `txn-${Date.now()}`,
      transaction_number: `TXN-${Date.now()}`,
      ...transaction,
      created_at: new Date().toISOString(),
    }

    return { data: newTransaction, error: null }
  } catch (error) {
    console.error('Error creating transaction:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    }
  }
}

