// @ts-nocheck
/**
 * Pharmacy Inventory Service
 * Handles drug and non-drug inventory management
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { parseAndNormalizeDate } from '@/lib/utils'
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
  InventoryReportRow,
  ReportPeriod,
  InventoryReportFilter,
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
} from '@/services/pharmacy/mockData'
import { loadFacilityDrugInventory } from '@/services/pharmacy/facilityDrugInventoryService'
import { loadFacilityNonDrugInventory } from '@/services/pharmacy/facilityNonDrugInventoryService'

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
          cc_contract_number,
          cc_contract_start_date,
          cc_contract_end_date,
          cc_contract_status,
          cc_supplier_name,
          category:drug_categories!drugs_category_id_fkey (*),
          supplier:suppliers (*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)
      
      const vote = filter?.procurement_vote?.toLowerCase()
      if (vote && vote !== 'all') {
        query = query.eq('procurement_vote', vote)
      }

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

    if (filter?.procurement_vote && filter.procurement_vote !== 'all') {
      drugs = drugs.filter(d => d.procurement_vote?.toLowerCase() === filter.procurement_vote.toLowerCase())
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
        .maybeSingle()

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
          created_at,
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
          cc_contract_number,
          cc_contract_start_date,
          cc_contract_end_date,
          cc_contract_status,
          cc_supplier_name,
          category:non_drug_categories (*),
          supplier:suppliers (*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)
      
      const vote = filter?.procurement_vote?.toLowerCase()
      if (vote && vote !== 'all') {
        query = query.eq('procurement_vote', vote)
      }

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

    if (filter?.procurement_vote && filter.procurement_vote !== 'all') {
      items = items.filter(d => d.procurement_vote?.toLowerCase() === filter.procurement_vote.toLowerCase())
    }

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
 * Get non-drug by ID
 */
export async function getNonDrugById(nonDrugId: string): Promise<ApiResponse<NonDrugWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('non_drugs')
        .select('*')
        .eq('id', nonDrugId)
        .single()

      if (error) throw error
      return { data: data as NonDrugWithRelations, error: null }
    }

    const nonDrug = mockNonDrugs.find(d => d.id === nonDrugId)
    if (!nonDrug) {
      return { data: null, error: 'Non-drug item not found' }
    }
    return { data: nonDrug as NonDrugWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching non-drug:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch non-drug',
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
        .maybeSingle()

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
 * Helper to populate drug and non_drug relations for batches
 */
async function populateBatchItems(batches: any[]): Promise<any[]> {
  if (!batches || batches.length === 0) return []
  
  const drugIds = batches.filter(b => b.item_type === 'drug').map(b => b.item_id)
  const nonDrugIds = batches.filter(b => b.item_type === 'non_drug').map(b => b.item_id)
  
  const drugsMap = new Map()
  const nonDrugsMap = new Map()
  
  if (drugIds.length > 0) {
    const { data: drugs } = await supabase
      .from('drugs')
      .select('*')
      .in('id', drugIds)
    drugs?.forEach(d => drugsMap.set(d.id, d))
  }
  
  if (nonDrugIds.length > 0) {
    const { data: nonDrugs } = await supabase
      .from('non_drugs')
      .select('*')
      .in('id', nonDrugIds)
    nonDrugs?.forEach(n => nonDrugsMap.set(n.id, n))
  }
  
  return batches.map(b => {
    if (b.item_type === 'drug') {
      return { ...b, drug: drugsMap.get(b.item_id) }
    } else {
      return { ...b, non_drug: nonDrugsMap.get(b.item_id) }
    }
  })
}

/**
 * Get stock batches for an item
 */
export async function getStockBatches(
  itemId: string,
  itemType: 'drug' | 'non_drug'
): Promise<ApiResponse<StockBatchWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_stock_batches')
        .select(`
          *,
          location:pharmacy_stock_locations(location_name)
        `)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .gt('quantity_on_hand', 0)
        .order('expiry_date', { ascending: true })

      if (error) throw error
      let populated = await populateBatchItems(data || [])

      // If no active batch found in pharmacy_stock_batches, check if the item has positive stock in catalog/facility inventory
      if (!populated || populated.length === 0) {
        let currentStock = 0
        let hospitalId = ''
        if (itemType === 'drug') {
          const { data: drug } = await supabase.from('drugs').select('hospital_id').eq('id', itemId).maybeSingle()
          if (drug) {
            hospitalId = drug.hospital_id || ''
          }
          const { data: facDrug } = await supabase.from('facility_drug_inventory').select('facility_stock, hospital_id').eq('drug_id', itemId).limit(1)
          if (facDrug && facDrug.length > 0) {
            currentStock = facDrug[0].facility_stock || 0
            if (!hospitalId) hospitalId = facDrug[0].hospital_id || ''
          }
        } else {
          const { data: nonDrug } = await supabase.from('non_drugs').select('hospital_id').eq('id', itemId).maybeSingle()
          if (nonDrug) {
            hospitalId = nonDrug.hospital_id || ''
          }
          const { data: facNonDrug } = await supabase.from('facility_non_drug_inventory').select('facility_stock, hospital_id').eq('nondrug_id', itemId).limit(1)
          if (facNonDrug && facNonDrug.length > 0) {
            currentStock = facNonDrug[0].facility_stock || 0
            if (!hospitalId) hospitalId = facNonDrug[0].hospital_id || ''
          }
        }

        if (currentStock > 0 && hospitalId) {
          const virtualBatch: StockBatchWithRelations = {
            id: `batch-virtual-opening-${itemId}`,
            hospital_id: hospitalId,
            item_id: itemId,
            item_type: itemType,
            batch_number: 'STOK-SEDIA-ADA',
            quantity_received: currentStock,
            quantity_on_hand: currentStock,
            quantity_reserved: 0,
            expiry_date: null as any,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          return { data: [virtualBatch], error: null }
        }
      }

      return { data: populated as StockBatchWithRelations[], error: null }
    }

    let batches = mockStockBatches.filter(
      b => b.item_id === itemId && b.item_type === itemType && (b.quantity_on_hand || 0) > 0
    )

    if (batches.length === 0) {
      let currentStock = 0
      if (itemType === 'drug') {
        const drug = mockDrugs.find(d => d.id === itemId)
        if (drug) currentStock = drug.current_stock || 0
      } else {
        const nonDrug = mockNonDrugs.find(n => n.id === itemId)
        if (nonDrug) currentStock = nonDrug.current_stock || 0
      }

      if (currentStock > 0) {
        const year = new Date().getFullYear()
        const newMockBatch: StockBatch = {
          id: `batch-chk-fnd-${itemId}`,
          hospital_id: 'hosp-001',
          item_id: itemId,
          item_type: itemType,
          batch_number: `CHK-FND-${year}`,
          quantity_received: currentStock,
          quantity_on_hand: currentStock,
          quantity_reserved: 0,
          expiry_date: undefined,
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        mockStockBatches.push(newMockBatch)
        batches = [newMockBatch]
      }
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
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_stock_batches')
        .select(`
          *,
          location:pharmacy_stock_locations(location_name)
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

      const { data, error } = await query
      if (error) throw error
      const populated = await populateBatchItems(data || [])
      return { data: populated as StockBatchWithRelations[], error: null }
    }
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
    if (isSupabaseConfigured()) {
      const { data: batches, error } = await supabase
        .from('pharmacy_stock_batches')
        .select(`
          *,
          location:pharmacy_stock_locations(location_name)
        `)
        .eq('hospital_id', hospitalId)
        .gt('quantity_on_hand', 0)
        .not('expiry_date', 'is', null)

      if (error) throw error

      const populated = await populateBatchItems(batches || [])
      const now = new Date()
      const expiryItems: ExpiryItem[] = populated
        .map(b => {
          const expDate = new Date(b.expiry_date)
          const timeDiff = expDate.getTime() - now.getTime()
          const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24))
          
          let status: 'valid' | 'near_expiry' | 'expired' = 'valid'
          if (daysToExpiry <= 0) status = 'expired'
          else if (daysToExpiry <= daysThreshold) status = 'near_expiry'

          const itemCode = b.item_type === 'drug' ? b.drug?.drug_code : b.non_drug?.item_code
          const itemName = b.item_type === 'drug' ? b.drug?.drug_name : b.non_drug?.item_name

          return {
            batch_id: b.id,
            item_id: b.item_id,
            item_type: b.item_type,
            item_code: itemCode || 'UNKNOWN',
            item_name: itemName || 'Unknown Item',
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            quantity: b.quantity_on_hand,
            days_to_expiry: daysToExpiry,
            location_name: b.location?.location_name || 'Stor Farmasi',
            status
          }
        })
        .filter(item => item.days_to_expiry <= daysThreshold)
        .sort((a, b) => a.days_to_expiry - b.days_to_expiry)

      return { data: expiryItems, error: null }
    }

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
    if (isSupabaseConfigured()) {
      const res = await getNearExpiryItems(hospitalId, 0)
      if (res.error) throw new Error(res.error)
      return { data: res.data || [], error: null }
    }

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
    if (isSupabaseConfigured()) {
      const summaryRes = await getStockLevelSummary(hospitalId)
      if (summaryRes.error) throw new Error(summaryRes.error)
      
      const itemsList = summaryRes.data || []
      
      const { data: txns, error: txnError } = await supabase
        .from('pharmacy_stock_transactions')
        .select('item_id, transaction_date')
        .eq('hospital_id', hospitalId)
        .order('transaction_date', { ascending: false })
      
      if (txnError) throw txnError

      const lastMovementMap = new Map<string, string>()
      txns?.forEach(t => {
        if (!lastMovementMap.has(t.item_id)) {
          lastMovementMap.set(t.item_id, t.transaction_date)
        }
      })

      const now = new Date()
      const slowItems: SlowMovingItem[] = itemsList
        .filter(i => i.current_stock > 0)
        .map(i => {
          const lastMovement = lastMovementMap.get(i.item_id) || i.created_at || new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString()
          const moveDate = new Date(lastMovement)
          const daysDiff = Math.ceil((now.getTime() - moveDate.getTime()) / (1000 * 3600 * 24))
          
          return {
            item_id: i.item_id,
            item_type: i.item_type,
            item_code: i.item_code,
            item_name: i.item_name,
            current_stock: i.current_stock,
            last_movement_date: lastMovement,
            days_since_movement: daysDiff,
            unit_value: i.price || 0,
            total_value: (i.current_stock || 0) * (i.price || 0)
          }
        })
        .filter(i => i.days_since_movement >= daysSinceMovement)
        .sort((a, b) => b.days_since_movement - a.days_since_movement)

      return { data: slowItems, error: null }
    }

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
// INVENTORY REPORT (STORE MOVEMENTS & VALUES)
// =====================================================

/**
 * Compute start and end dates for report period
 */
export function getPeriodDateRange(period: ReportPeriod, year: number, subPeriod: number): { startDate: string; endDate: string } {
  let startMonth = 0
  let endMonth = 11

  if (period === 'monthly') {
    startMonth = (subPeriod || 1) - 1
    endMonth = startMonth
  } else if (period === 'quarterly') {
    const q = Math.min(Math.max(subPeriod || 1, 1), 4)
    startMonth = (q - 1) * 3
    endMonth = startMonth + 2
  } else if (period === 'half-yearly') {
    const h = Math.min(Math.max(subPeriod || 1, 1), 2)
    startMonth = (h - 1) * 6
    endMonth = startMonth + 5
  } else if (period === 'yearly') {
    startMonth = 0
    endMonth = 11
  }

  const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999))

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

/**
 * Accurately determines an item's procurement vote / Skim (appl, cc, lp, dp)
 */
export function getCleanProcurementVote(item: any): 'appl' | 'cc' | 'dp' | 'lp' {
  if (!item) return 'appl'

  const voteRaw = item.procurement_vote || item.procurement_scheme || item.vote || item.skim || item.scheme
  if (voteRaw && typeof voteRaw === 'string') {
    const v = voteRaw.trim().toLowerCase()
    if (v === 'appl') return 'appl'
    if (v === 'cc' || v === 'contract' || v === 'cost centre' || v === 'cc/dp') return 'cc'
    if (v === 'lp' || v === 'pembelian terus' || v === 'local purchase' || v === 'local_purchase') return 'lp'
    if (v === 'dp' || v === 'direct procurement' || v === 'direct_procurement') return 'dp'
  }

  // Contract number presence implies Cost Centre (CC)
  if (item.cc_contract_number || item.kkm_contract_number || item.contract_number) {
    return 'cc'
  }

  const code = String(item.drug_code || item.item_code || item.code || '').trim()

  // KPK codes are Local Purchase (LP)
  if (code.toUpperCase().startsWith('KPK')) {
    return 'lp'
  }

  // Explicit sheet source or APPL flag
  if (item.sheet_source === 'Lampiran B') {
    return 'appl'
  }

  // Standard myPhis / KKM codes (e.g. D01.0419.02, D02.0001.03, B01AC06..., N02BA..., D05BB..., S01EA...)
  // If not explicitly marked as APPL contract in catalog, these belong to CC (Cost Centre) or LP
  if (
    code.startsWith('D0') ||
    code.startsWith('D1') ||
    code.startsWith('D2') ||
    code.startsWith('D3') ||
    code.startsWith('D4') ||
    code.startsWith('D5') ||
    code.startsWith('D6') ||
    code.startsWith('D7') ||
    code.startsWith('D8') ||
    code.startsWith('D9') ||
    code.includes('-T10-') ||
    code.startsWith('N02') ||
    code.startsWith('B01') ||
    code.startsWith('S01')
  ) {
    return 'cc'
  }

  if (item.is_appl === false) {
    return 'cc'
  }

  return 'appl'
}

/**
 * Get inventory movement & value report for store operation analysis
 */
export async function getInventoryReport(
  hospitalId: string,
  filter: InventoryReportFilter
): Promise<ApiResponse<InventoryReportRow[]>> {
  try {
    const { startDate, endDate } = getPeriodDateRange(filter.period, filter.year, filter.subPeriod)

    // *** STRICT: Only show items actually registered in Facility Inventory ***
    // Load the facility inventory arrays directly as the source of truth.
    // This avoids false positives from loose code-normalisation matching in getStockLevelSummary.
    const [facilityDrugs, facilityNonDrugs] = await Promise.all([
      loadFacilityDrugInventory(hospitalId),
      loadFacilityNonDrugInventory(hospitalId),
    ])

    // Build lookup sets of exact catalog drug/non-drug IDs from the real facility inventory lists
    const facilityDrugCatalogIds = new Set<string>()
    ;(facilityDrugs || []).forEach(fd => {
      const drugId = fd.drug_id || fd.id
      if (drugId) facilityDrugCatalogIds.add(drugId)
    })

    const facilityNonDrugCatalogIds = new Set<string>()
    ;(facilityNonDrugs || []).forEach(fn => {
      const nonDrugId = fn.nondrug_id || fn.id
      if (nonDrugId) facilityNonDrugCatalogIds.add(nonDrugId)
    })

    // Load enriched stock level summary (prices, stock levels, etc.)
    const summaryRes = await getStockLevelSummary(hospitalId)
    if (summaryRes.error) throw new Error(summaryRes.error)
    let items = summaryRes.data || []

    // Filter to ONLY items that exist in the actual facility inventory lists
    // (strict cross-reference by catalog ID)
    items = items.filter(i => {
      if (i.item_type === 'drug') {
        return facilityDrugCatalogIds.has(i.item_id)
      } else {
        return facilityNonDrugCatalogIds.has(i.item_id)
      }
    })

    // Filter by Item Type
    if (filter.item_type && filter.item_type !== 'all') {
      items = items.filter(i => i.item_type === filter.item_type)
    }

    // Filter by Skim / Procurement Vote (appl, cc, dp, lp)
    if (filter.procurement_vote && filter.procurement_vote !== 'all') {
      const voteFilter = filter.procurement_vote.toLowerCase()
      items = items.filter(i => getCleanProcurementVote(i) === voteFilter)
    }

    // Filter by Search query
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim()
      items = items.filter(i => (i.item_name || '').toLowerCase().includes(q) || (i.item_code || '').toLowerCase().includes(q))
    }

    // Collect real transactions from Supabase AND localStorage
    let realTxns: any[] = []

    if (isSupabaseConfigured()) {
      const { data: dbTxns, error: txnErr } = await supabase
        .from('pharmacy_stock_transactions')
        .select('*')
        .eq('hospital_id', hospitalId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)

      if (!txnErr && dbTxns) {
        realTxns.push(...dbTxns)
      }
    }

    // Combine with local transactions stored in localStorage
    if (typeof window !== 'undefined') {
      try {
        const localTxStr = localStorage.getItem('pharmacy_stock_transactions')
        if (localTxStr) {
          const parsed = JSON.parse(localTxStr)
          if (Array.isArray(parsed)) {
            const startMs = new Date(startDate).getTime()
            const endMs = new Date(endDate).getTime()
            const localFiltered = parsed.filter(t => {
              const txTime = new Date(t.transaction_date || t.created_at || Date.now()).getTime()
              return txTime >= startMs && txTime <= endMs
            })
            realTxns.push(...localFiltered)
          }
        }
      } catch (e) {
        console.warn('Failed to parse local transactions:', e)
      }
    }

    const reportRows: InventoryReportRow[] = items.map(item => {
      const unitPrice = item.price || 0
      const itemTxns = realTxns.filter(t => 
        (t.item_id && t.item_id === item.item_id) ||
        (t.facility_inventory_id && t.facility_inventory_id === item.facility_inventory_id) ||
        (t.item_code && normalizeItemCode(t.item_code) === normalizeItemCode(item.item_code))
      )

      let receiptQty = 0
      let transferInQty = 0
      let issueQty = 0
      let transferOutQty = 0
      let returnQty = 0
      let adjustmentQty = 0

      itemTxns.forEach(t => {
        const qty = Math.abs(t.quantity || t.quantity_received || 0)
        const type = (t.transaction_type || t.type || '').toLowerCase()

        if (type === 'receipt' || type === 'receive' || type === 'grn' || type === 'penerimaan' || type === 'bring_forward' || type === 'bawa_ke_hadapan') {
          receiptQty += qty
        } else if (type === 'transfer_in' || type === 'borrow_in' || type === 'pindahan_masuk') {
          transferInQty += qty
        } else if (type === 'issue' || type === 'dispense' || type === 'pengeluaran') {
          issueQty += qty
        } else if (type === 'transfer_out' || type === 'lend_out' || type === 'pindahan_keluar') {
          transferOutQty += qty
        } else if (type === 'return' || type === 'pulangan') {
          returnQty += qty
        } else if (type === 'adjustment' || type === 'check_found' || type === 'pelarasan') {
          adjustmentQty += (t.quantity || 0)
        }
      })

      const netInPeriod = (receiptQty + transferInQty + returnQty + Math.max(0, adjustmentQty)) - (issueQty + transferOutQty + Math.abs(Math.min(0, adjustmentQty)))
      const closingQty = Math.max(0, item.current_stock)
      const openingQty = Math.max(0, closingQty - netInPeriod)

      const voteLabel = getCleanProcurementVote(item).toUpperCase()

      return {
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        item_type: item.item_type,
        procurement_vote: voteLabel,
        unit_price: unitPrice,
        opening_qty: openingQty,
        opening_value: openingQty * unitPrice,
        receipt_qty: receiptQty,
        receipt_value: receiptQty * unitPrice,
        transfer_in_qty: transferInQty,
        transfer_in_value: transferInQty * unitPrice,
        issue_qty: issueQty,
        issue_value: issueQty * unitPrice,
        transfer_out_qty: transferOutQty,
        transfer_out_value: transferOutQty * unitPrice,
        return_qty: returnQty,
        return_value: returnQty * unitPrice,
        adjustment_qty: adjustmentQty,
        adjustment_value: adjustmentQty * unitPrice,
        closing_qty: closingQty,
        closing_value: closingQty * unitPrice,
      }
    })

    reportRows.sort((a, b) => a.item_name.localeCompare(b.item_name, 'ms', { sensitivity: 'base' }))

    return { data: reportRows, error: null }
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate inventory report',
    }
  }
}

// =====================================================
// CODE NORMALIZATION & SCAN MATCHING HELPERS
// =====================================================

/**
 * Normalizes item codes by converting all unicode dashes/hyphens (en-dash '–', em-dash '—', etc.)
 * to standard ASCII hyphens ('-'), trimming whitespace, and converting to lowercase.
 */
export function normalizeItemCode(code: string | null | undefined): string {
  if (!code) return ''
  return code
    .trim()
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-') // Normalize all Unicode hyphens/dashes to ASCII '-'
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip hidden zero-width spaces/BOM
}

/**
 * Strips all non-alphanumeric characters from an item code (ignores dashes, spaces, slashes).
 */
export function stripItemCode(code: string | null | undefined): string {
  return normalizeItemCode(code).replace(/[^a-z0-9]/g, '')
}

/**
 * Matches an item from a list of StockLevelSummary items by ID, code, or name,
 * with full support for unicode dash normalization and stripped alphanumeric matching.
 */
export function matchStockItem<T extends { item_id?: string; id?: string; facility_inventory_id?: string; item_code?: string; drug_code?: string; item_name?: string; item_type?: string }>(
  items: T[],
  targetCode: string,
  targetId?: string | null,
  targetType?: string | null
): T | undefined {
  if (!targetCode && !targetId) return undefined

  const normTargetCode = normalizeItemCode(targetCode)
  const strippedTargetCode = stripItemCode(targetCode)

  if (!normTargetCode && !targetId) return undefined

  // Pass 1: Direct ID match (highest priority)
  if (targetId) {
    const idMatch = items.find(i => {
      const itemId = (i.item_id || i.id || i.facility_inventory_id || '').trim()
      return itemId === targetId || i.facility_inventory_id === targetId
    })
    if (idMatch) return idMatch
  }

  // Pass 2: Exact normalized code match (e.g. 'C10AA05–000–T10–01–XXX' vs 'C10AA05-000-T10-01-XXX')
  if (normTargetCode) {
    const exactCodeMatch = items.find(i => {
      const itemCodeStr = i.item_code || (i as any).drug_code || ''
      const normItemCode = normalizeItemCode(itemCodeStr)
      return normItemCode === normTargetCode
    })
    if (exactCodeMatch) return exactCodeMatch
  }

  // Pass 3: Exact stripped alphanumeric code match (ignores all dashes, slashes, spaces)
  if (strippedTargetCode && strippedTargetCode.length >= 3) {
    const exactStrippedMatch = items.find(i => {
      const itemCodeStr = i.item_code || (i as any).drug_code || ''
      const strippedItemCode = stripItemCode(itemCodeStr)
      return strippedItemCode === strippedTargetCode
    })
    if (exactStrippedMatch) return exactStrippedMatch
  }

  // Pass 4: Item Name exact or strict prefix match
  if (normTargetCode && normTargetCode.length >= 3) {
    const nameMatch = items.find(i => {
      const normItemName = normalizeItemCode(i.item_name || '')
      return normItemName === normTargetCode
    })
    if (nameMatch) return nameMatch
  }

  return undefined
}

// =====================================================
// STOCK LEVEL SUMMARY
// =====================================================

/**
 * Get stock level summary for facility registered items
 */
export async function getStockLevelSummary(
  hospitalId: string,
  filter?: InventoryFilter
): Promise<ApiResponse<StockLevelSummary[]>> {
  try {
    // Load registered items from Facility Inventory (drugs & non-drugs)
    const [facilityDrugs, facilityNonDrugs] = await Promise.all([
      loadFacilityDrugInventory(hospitalId),
      loadFacilityNonDrugInventory(hospitalId)
    ])

    const registeredDrugIds = new Set<string>()
    const registeredDrugCodes = new Set<string>()
    ;(facilityDrugs || []).forEach(d => {
      if (d.drug_id) registeredDrugIds.add(d.drug_id)
      if (d.id) registeredDrugIds.add(d.id)
      if (d.facility_inventory_id) registeredDrugIds.add(d.facility_inventory_id)
      const code = d.drug_code || d.item_code
      if (code) registeredDrugCodes.add(normalizeItemCode(code))
    })

    const registeredNonDrugIds = new Set<string>()
    const registeredNonDrugCodes = new Set<string>()
    ;(facilityNonDrugs || []).forEach(n => {
      if (n.nondrug_id) registeredNonDrugIds.add(n.nondrug_id)
      if (n.id) registeredNonDrugIds.add(n.id)
      if (n.facility_inventory_id) registeredNonDrugIds.add(n.facility_inventory_id)
      const code = n.item_code || n.drug_code
      if (code) registeredNonDrugCodes.add(normalizeItemCode(code))
    })

    if (isSupabaseConfigured()) {
      // Get all item codes from contracts synced from Google Sheets
      const { data: syncedContracts } = await supabase
        .from('contracts')
        .select('item_code')
        .eq('hospital_id', hospitalId)
        .not('last_synced_at', 'is', null)
        .not('item_code', 'is', null)

      const contractItemCodes = new Set(syncedContracts?.map(c => c.item_code) || [])

      let drugsQuery = supabase
        .from('drugs')
        .select('id, drug_code, drug_name, unit_of_measure, min_stock_level, max_stock_level, reorder_level, price, created_at, sheet_source, procurement_vote, cc_contract_number, packaging_description')
        .eq('hospital_id', hospitalId)
      
      if (filter?.search) {
        drugsQuery = drugsQuery.or(`drug_code.ilike.%${filter.search}%,drug_name.ilike.%${filter.search}%`)
      }

      const { data: rawDrugs, error: drugsError } = await drugsQuery
      if (drugsError) throw drugsError

      // Only include drugs that are registered in Facility Inventory (or contract fallback if none registered yet)
      const drugs = (rawDrugs || []).filter(d => {
        if (filter?.include_unregistered) return true
        if (registeredDrugIds.size > 0 || registeredDrugCodes.size > 0) {
          const normCode = normalizeItemCode(d.drug_code)
          return registeredDrugIds.has(d.id) || (normCode && registeredDrugCodes.has(normCode))
        }
        return d.sheet_source === 'Lampiran B' || contractItemCodes.has(d.drug_code)
      })

      let nonDrugsQuery = supabase
        .from('non_drugs')
        .select('id, item_code, item_name, unit_of_measure, min_stock_level, max_stock_level, reorder_level, price, created_at, procurement_vote, cc_contract_number, packaging_description')
        .eq('hospital_id', hospitalId)
      
      if (filter?.search) {
        nonDrugsQuery = nonDrugsQuery.or(`item_code.ilike.%${filter.search}%,item_name.ilike.%${filter.search}%`)
      }

      const { data: rawNonDrugs, error: nonDrugsError } = await nonDrugsQuery
      if (nonDrugsError) throw nonDrugsError

      // Only include non-drugs registered in Facility Inventory (or contract fallback if none registered yet)
      const nonDrugs = (rawNonDrugs || []).filter(n => {
        if (filter?.include_unregistered) return true
        if (registeredNonDrugIds.size > 0 || registeredNonDrugCodes.size > 0) {
          const normCode = normalizeItemCode(n.item_code)
          return registeredNonDrugIds.has(n.id) || (normCode && registeredNonDrugCodes.has(normCode))
        }
        return contractItemCodes.has(n.item_code)
      })

      const { data: batches, error: batchesError } = await supabase
        .from('pharmacy_stock_batches')
        .select('item_id, item_type, quantity_on_hand, quantity_reserved')
        .eq('hospital_id', hospitalId)
        .in('status', ['available', 'quarantine'])

      if (batchesError) throw batchesError

      const qtyMap = new Map<string, { onHand: number; reserved: number }>()
      batches?.forEach(b => {
        const key = b.item_id
        const current = qtyMap.get(key) || { onHand: 0, reserved: 0 }
        qtyMap.set(key, {
          onHand: current.onHand + (b.quantity_on_hand || 0),
          reserved: current.reserved + (b.quantity_reserved || 0)
        })
      })

      let summaries: StockLevelSummary[] = []

      if (filter?.item_type === 'all' || filter?.item_type === 'drug' || !filter?.item_type) {
        drugs?.forEach(d => {
          const qty = qtyMap.get(d.id) || { onHand: 0, reserved: 0 }
          const facilityMatch = facilityDrugs.find(fd => 
            (fd.drug_id && fd.drug_id === d.id) || 
            (fd.id && fd.id === d.id) ||
            (fd.facility_inventory_id && fd.facility_inventory_id === d.id) ||
            (fd.drug_code && normalizeItemCode(fd.drug_code) === normalizeItemCode(d.drug_code))
          )
          const currentStock = qty.onHand > 0 ? qty.onHand : (facilityMatch?.facility_stock ?? d.current_stock ?? 0)
          const minStock = facilityMatch?.min_buffer_level ?? d.min_stock_level ?? 0
          
          let status: StockLevelSummary['status'] = 'in_stock'
          if (currentStock <= 0) status = 'out_of_stock'
          else if (currentStock <= minStock * 0.5) status = 'critical'
          else if (currentStock <= minStock) status = 'low_stock'

          summaries.push({
            item_id: d.id,
            item_type: 'drug',
            item_code: d.drug_code,
            item_name: d.drug_name,
            unit_of_measure: d.unit_of_measure || 'unit',
            packaging_description: d.packaging_description || (facilityMatch as any)?.packaging_description || (d.unit_of_measure?.toLowerCase().includes('tablet') ? 'Pack of 10 x 10 Tablets' : `${d.unit_of_measure || 'Pack'}`),
            min_stock: minStock,
            max_stock: d.max_stock_level || null,
            reorder_level: d.reorder_level || null,
            current_stock: currentStock,
            available_stock: currentStock - qty.reserved,
            reserved_stock: qty.reserved,
            status,
            price: d.price || 0,
            created_at: d.created_at,
            sheet_source: d.sheet_source,
            procurement_vote: getCleanProcurementVote(d),
            procurement_scheme: getCleanProcurementVote(d),
            is_appl: getCleanProcurementVote(d) === 'appl',
            location: facilityMatch?.location || (d as any).location || null,
            facility_inventory_id: facilityMatch?.facility_inventory_id || facilityMatch?.id || undefined
          })
        })
      }

      if (filter?.item_type === 'all' || filter?.item_type === 'non_drug' || !filter?.item_type) {
        nonDrugs?.forEach(n => {
          const qty = qtyMap.get(n.id) || { onHand: 0, reserved: 0 }
          const facilityMatch = facilityNonDrugs.find(fn => 
            (fn.nondrug_id && fn.nondrug_id === n.id) || 
            (fn.id && fn.id === n.id) ||
            (fn.facility_inventory_id && fn.facility_inventory_id === n.id) ||
            (fn.item_code && normalizeItemCode(fn.item_code) === normalizeItemCode(n.item_code))
          )
          const currentStock = qty.onHand > 0 ? qty.onHand : (facilityMatch?.facility_stock ?? n.current_stock ?? 0)
          const minStock = facilityMatch?.min_buffer_level ?? n.min_stock_level ?? 0
          
          let status: StockLevelSummary['status'] = 'in_stock'
          if (currentStock <= 0) status = 'out_of_stock'
          else if (currentStock <= minStock * 0.5) status = 'critical'
          else if (currentStock <= minStock) status = 'low_stock'

          summaries.push({
            item_id: n.id,
            item_type: 'non_drug',
            item_code: n.item_code,
            item_name: n.item_name,
            unit_of_measure: n.unit_of_measure || 'unit',
            packaging_description: n.packaging_description || (facilityMatch as any)?.packaging_description || `${n.unit_of_measure || 'Pack'}`,
            min_stock: minStock,
            max_stock: n.max_stock_level || null,
            reorder_level: n.reorder_level || null,
            current_stock: currentStock,
            available_stock: currentStock - qty.reserved,
            reserved_stock: qty.reserved,
            status,
            price: n.price || 0,
            created_at: n.created_at,
            procurement_vote: getCleanProcurementVote(n),
            procurement_scheme: getCleanProcurementVote(n),
            is_appl: getCleanProcurementVote(n) === 'appl',
            location: facilityMatch?.location || (n as any).location || null,
            facility_inventory_id: facilityMatch?.facility_inventory_id || facilityMatch?.id || undefined
          })
        })
      }

      // Merge any registered facilityDrugs not returned by rawDrugs query
      if (filter?.item_type === 'all' || filter?.item_type === 'drug' || !filter?.item_type) {
        ;(facilityDrugs || []).forEach(fd => {
          const fdCode = normalizeItemCode(fd.drug_code || fd.item_code)
          const fdId = fd.drug_id || fd.id || fd.facility_inventory_id
          const alreadyIn = summaries.some(s => 
            (s.item_id && s.item_id === fdId) ||
            (s.facility_inventory_id && s.facility_inventory_id === fd.facility_inventory_id) ||
            (fdCode && normalizeItemCode(s.item_code) === fdCode)
          )
          if (!alreadyIn) {
            const currentStock = fd.facility_stock ?? fd.current_stock ?? 0
            const minStock = fd.min_buffer_level ?? fd.min_stock_level ?? 20
            let status: StockLevelSummary['status'] = 'in_stock'
            if (currentStock <= 0) status = 'out_of_stock'
            else if (currentStock <= minStock * 0.5) status = 'critical'
            else if (currentStock <= minStock) status = 'low_stock'

            summaries.push({
              item_id: fdId || `drug-${Date.now()}`,
              item_type: 'drug',
              item_code: fd.drug_code || fd.item_code || '',
              item_name: fd.drug_name || fd.item_name || '',
              unit_of_measure: fd.unit_of_measure || 'unit',
              packaging_description: (fd as any).packaging_description || 'Box of 10 x 10\'s',
              min_stock: minStock,
              max_stock: fd.max_stock_level || null,
              reorder_level: fd.reorder_level || null,
              current_stock: currentStock,
              available_stock: currentStock,
              reserved_stock: 0,
              status,
              price: fd.price || 0,
              created_at: fd.added_at || (fd as any).created_at,
              procurement_vote: getCleanProcurementVote(fd),
              procurement_scheme: getCleanProcurementVote(fd),
              is_appl: getCleanProcurementVote(fd) === 'appl',
              location: fd.location || null,
              facility_inventory_id: fd.facility_inventory_id || fd.id
            })
          }
        })
      }

      // Merge any registered facilityNonDrugs not returned by rawNonDrugs query
      if (filter?.item_type === 'all' || filter?.item_type === 'non_drug' || !filter?.item_type) {
        ;(facilityNonDrugs || []).forEach(fn => {
          const fnCode = normalizeItemCode(fn.item_code || fn.drug_code)
          const fnId = fn.nondrug_id || fn.id || fn.facility_inventory_id
          const alreadyIn = summaries.some(s => 
            (s.item_id && s.item_id === fnId) ||
            (s.facility_inventory_id && s.facility_inventory_id === fn.facility_inventory_id) ||
            (fnCode && normalizeItemCode(s.item_code) === fnCode)
          )
          if (!alreadyIn) {
            const currentStock = fn.facility_stock ?? fn.current_stock ?? 0
            const minStock = fn.min_buffer_level ?? fn.min_stock_level ?? 20
            let status: StockLevelSummary['status'] = 'in_stock'
            if (currentStock <= 0) status = 'out_of_stock'
            else if (currentStock <= minStock * 0.5) status = 'critical'
            else if (currentStock <= minStock) status = 'low_stock'

            summaries.push({
              item_id: fnId || `nondrug-${Date.now()}`,
              item_type: 'non_drug',
              item_code: fn.item_code || '',
              item_name: fn.item_name || '',
              unit_of_measure: fn.unit_of_measure || 'unit',
              packaging_description: (fn as any).packaging_description || `${fn.unit_of_measure || 'Pack'}`,
              min_stock: minStock,
              max_stock: fn.max_stock_level || null,
              reorder_level: fn.reorder_level || null,
              current_stock: currentStock,
              available_stock: currentStock,
              reserved_stock: 0,
              status,
              price: fn.price || 0,
              created_at: fn.added_at || (fn as any).created_at,
              procurement_vote: getCleanProcurementVote(fn),
              procurement_scheme: getCleanProcurementVote(fn),
              is_appl: getCleanProcurementVote(fn) === 'appl',
              location: fn.location || null,
              facility_inventory_id: fn.facility_inventory_id || fn.id
            })
          }
        })
      }

      if (filter?.stock_status && filter.stock_status !== 'all') {
        summaries = summaries.filter(s => s.status === filter.stock_status)
      }

      return { data: summaries, error: null }
    }

    // Mock/local cache fallback mode:
    let summaries: StockLevelSummary[] = []
    if (registeredDrugIds.size > 0 || registeredNonDrugIds.size > 0) {
      facilityDrugs.forEach(d => {
        const currentStock = d.facility_stock ?? d.current_stock ?? 0
        const minStock = d.min_buffer_level ?? d.min_stock_level ?? 0
        let status: StockLevelSummary['status'] = 'in_stock'
        if (currentStock <= 0) status = 'out_of_stock'
        else if (currentStock <= minStock * 0.5) status = 'critical'
        else if (currentStock <= minStock) status = 'low_stock'

        summaries.push({
          item_id: d.id || d.drug_id,
          item_type: 'drug',
          item_code: d.drug_code || d.item_code || '',
          item_name: d.drug_name || d.item_name || '',
          unit_of_measure: d.unit_of_measure || 'unit',
          min_stock: minStock,
          max_stock: d.max_stock_level || null,
          reorder_level: d.reorder_level || null,
          current_stock: currentStock,
          available_stock: currentStock,
          reserved_stock: 0,
          status,
          price: d.price || 0,
          location: d.location || null,
          facility_inventory_id: d.facility_inventory_id || d.id
        })
      })

      facilityNonDrugs.forEach(n => {
        const currentStock = n.facility_stock ?? n.current_stock ?? 0
        const minStock = n.min_buffer_level ?? n.min_stock_level ?? 0
        let status: StockLevelSummary['status'] = 'in_stock'
        if (currentStock <= 0) status = 'out_of_stock'
        else if (currentStock <= minStock * 0.5) status = 'critical'
        else if (currentStock <= minStock) status = 'low_stock'

        summaries.push({
          item_id: n.id || n.nondrug_id,
          item_type: 'non_drug',
          item_code: n.item_code || '',
          item_name: n.item_name || '',
          unit_of_measure: n.unit_of_measure || 'unit',
          min_stock: minStock,
          max_stock: n.max_stock_level || null,
          reorder_level: n.reorder_level || null,
          current_stock: currentStock,
          available_stock: currentStock,
          reserved_stock: 0,
          status,
          price: n.price || 0,
          location: n.location || null,
          facility_inventory_id: n.facility_inventory_id || n.id
        })
      })

      if (filter?.include_unregistered) {
        mockDrugs.forEach(d => {
          const isRegistered = facilityDrugs.some(fd => (fd.id || fd.drug_id) === d.id)
          if (!isRegistered) {
            summaries.push({
              item_id: d.id,
              item_type: 'drug',
              item_code: d.drug_code,
              item_name: d.drug_name,
              unit_of_measure: d.unit_of_measure || 'unit',
              min_stock: d.min_stock_level || 0,
              max_stock: d.max_stock_level || null,
              reorder_level: d.reorder_level || null,
              current_stock: 0,
              available_stock: 0,
              reserved_stock: 0,
              status: 'out_of_stock',
              price: d.price || 0,
              location: null
            })
          }
        })

        mockNonDrugs.forEach(n => {
          const isRegistered = facilityNonDrugs.some(fn => (fn.id || fn.nondrug_id) === n.id)
          if (!isRegistered) {
            summaries.push({
              item_id: n.id,
              item_type: 'non_drug',
              item_code: n.item_code,
              item_name: n.item_name,
              unit_of_measure: n.unit_of_measure || 'unit',
              min_stock: n.min_stock_level || 0,
              max_stock: n.max_stock_level || null,
              reorder_level: n.reorder_level || null,
              current_stock: 0,
              available_stock: 0,
              reserved_stock: 0,
              status: 'out_of_stock',
              price: n.price || 0,
              location: null
            })
          }
        })
      }
    } else {
      summaries = [
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
          price: d.price || 0,
          location: d.location || null
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
          price: n.price || 0,
          location: n.location || null
        })),
      ]
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase()
      summaries = summaries.filter(s => 
        s.item_code.toLowerCase().includes(q) || 
        s.item_name.toLowerCase().includes(q)
      )
    }

    return { data: summaries, error: null }
  } catch (error) {
    console.error('Error fetching stock level summary:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch stock level summary',
    }
  }
}

// =====================================================
// STOCK TRANSACTIONS
// =====================================================

/**
 * Get all stock transactions with optional filtering
 */
export async function getStockTransactions(
  hospitalId: string,
  filter?: {
    item_id?: string
    transaction_type?: string
    date_from?: string
    date_to?: string
    to_location_id?: string
    search_query?: string
  }
): Promise<ApiResponse<StockTransactionWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_stock_transactions')
        .select(`
          *,
          from_location:pharmacy_stock_locations!pharmacy_stock_transactions_from_location_id_fkey(*),
          to_location:pharmacy_stock_locations!pharmacy_stock_transactions_to_location_id_fkey(*),
          performed_by_user:users!pharmacy_stock_transactions_performed_by_fkey(*),
          batch:pharmacy_stock_batches(*)
        `)
        .eq('hospital_id', hospitalId)
        .order('transaction_date', { ascending: false })

      if (filter?.item_id) {
        query = query.eq('item_id', filter.item_id)
      }
      if (filter?.transaction_type && filter.transaction_type !== 'all') {
        query = query.eq('transaction_type', filter.transaction_type)
      }
      if (filter?.to_location_id && filter.to_location_id !== 'all') {
        query = query.eq('to_location_id', filter.to_location_id)
      }
      if (filter?.date_from) {
        query = query.gte('transaction_date', `${filter.date_from}T00:00:00`)
      }
      if (filter?.date_to) {
        query = query.lte('transaction_date', `${filter.date_to}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error

      let populated = await populateBatchItems(data || [])

      if (filter?.search_query && filter.search_query.trim()) {
        const q = filter.search_query.toLowerCase().trim()
        populated = populated.filter((t: any) =>
          t.transaction_number?.toLowerCase().includes(q) ||
          t.reason?.toLowerCase().includes(q) ||
          t.batch?.batch_number?.toLowerCase().includes(q) ||
          t.to_location?.location_name?.toLowerCase().includes(q)
        )
      }

      return { data: populated as StockTransactionWithRelations[], error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    }
  }
}

/**
 * Get aggregated item movement summary (Current Balance, Total Received, Total Issued, Departments Count)
 */
export async function getItemMovementSummary(
  hospitalId: string,
  itemId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<MovementSummary>> {
  try {
    let currentBalance = 0
    let totalReceived = 0
    let totalIssued = 0
    const deptsSet = new Set<string>()
    let lastReceiptDate: string | null = null
    let lastIssueDate: string | null = null

    if (isSupabaseConfigured()) {
      // 1. Fetch current stock balance from batches
      const { data: batches } = await supabase
        .from('pharmacy_stock_batches')
        .select('quantity_on_hand')
        .eq('hospital_id', hospitalId)
        .eq('item_id', itemId)

      if (batches) {
        currentBalance = batches.reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0)
      }

      // 2. Fetch transactions for period aggregates
      let txQuery = supabase
        .from('pharmacy_stock_transactions')
        .select('transaction_type, quantity, to_location_id, transaction_date, created_at')
        .eq('hospital_id', hospitalId)
        .eq('item_id', itemId)
        .order('transaction_date', { ascending: false })

      if (dateFrom) {
        txQuery = txQuery.gte('transaction_date', `${dateFrom}T00:00:00`)
      }
      if (dateTo) {
        txQuery = txQuery.lte('transaction_date', `${dateTo}T23:59:59`)
      }

      const { data: txns } = await txQuery

      if (txns) {
        for (const t of txns) {
          const qty = Number(t.quantity) || 0
          const tDate = t.transaction_date || t.created_at

          if (t.transaction_type === 'receipt' || t.transaction_type === 'bring_forward') {
            totalReceived += qty
            if (!lastReceiptDate && tDate) lastReceiptDate = tDate
          } else if (t.transaction_type === 'issue' || t.transaction_type === 'transfer_out') {
            totalIssued += qty
            if (!lastIssueDate && tDate) lastIssueDate = tDate
            if (t.to_location_id) {
              deptsSet.add(t.to_location_id)
            }
          }
        }
      }
    }

    return {
      data: {
        currentBalance,
        totalReceived,
        totalIssued,
        deptCount: deptsSet.size,
        lastReceiptDate,
        lastIssueDate
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching item movement summary:', error)
    return {
      data: {
        currentBalance: 0,
        totalReceived: 0,
        totalIssued: 0,
        deptCount: 0,
        lastReceiptDate: null,
        lastIssueDate: null
      },
      error: error instanceof Error ? error.message : 'Failed to fetch summary'
    }
  }
}

/**
 * Get department issuance breakdown for a specific item
 */
export async function getDepartmentIssuanceBreakdown(
  hospitalId: string,
  itemId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<DeptBreakdownRow[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_stock_transactions')
        .select(`
          quantity,
          to_location_id,
          to_location:pharmacy_stock_locations!pharmacy_stock_transactions_to_location_id_fkey(id, location_name)
        `)
        .eq('hospital_id', hospitalId)
        .eq('item_id', itemId)
        .in('transaction_type', ['issue', 'transfer_out'])

      if (dateFrom) {
        query = query.gte('transaction_date', `${dateFrom}T00:00:00`)
      }
      if (dateTo) {
        query = query.lte('transaction_date', `${dateTo}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error

      const locationMap = new Map<string, { name: string; total: number }>()
      let grandTotal = 0

      if (data) {
        for (const row of data) {
          const qty = Number(row.quantity) || 0
          grandTotal += qty
          const locId = row.to_location_id || 'unknown'
          const locName = (row.to_location as any)?.location_name || 'Jabatan Lain / Tidak Nyata'

          const existing = locationMap.get(locId) || { name: locName, total: 0 }
          existing.total += qty
          locationMap.set(locId, existing)
        }
      }

      const breakdown: DeptBreakdownRow[] = Array.from(locationMap.entries()).map(([locId, val]) => ({
        location_id: locId,
        location_name: val.name,
        total_issued: val.total,
        percentage: grandTotal > 0 ? Math.round((val.total / grandTotal) * 1000) / 10 : 0
      }))

      breakdown.sort((a, b) => b.total_issued - a.total_issued)

      return { data: breakdown, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching department issuance breakdown:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch department breakdown'
    }
  }
}

/**
 * Create stock transaction
 */
export async function createStockTransaction(
  hospitalId: string,
  transaction: Omit<StockTransaction, 'id' | 'created_at'> & { transaction_number?: string; transaction_date?: string }
): Promise<ApiResponse<StockTransaction>> {
  try {
    const txnDate = transaction.transaction_date || new Date().toISOString()
    const txnNumber = transaction.transaction_number || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    if (isSupabaseConfigured()) {
      // Ensure performed_by is a valid UUID or null to prevent 400 Bad Request (22P02 invalid UUID)
      const performedByUuid = (transaction.performed_by && /^[0-9a-fA-F-]{36}$/.test(transaction.performed_by))
        ? transaction.performed_by
        : null

      const toLocUuid = (transaction.to_location_id && /^[0-9a-fA-F-]{36}$/.test(transaction.to_location_id))
        ? transaction.to_location_id
        : null

      const fromLocUuid = (transaction.from_location_id && /^[0-9a-fA-F-]{36}$/.test(transaction.from_location_id))
        ? transaction.from_location_id
        : null

      const { data, error } = await supabase
        .from('pharmacy_stock_transactions')
        .insert({
          hospital_id: hospitalId,
          ...transaction,
          performed_by: performedByUuid,
          to_location_id: toLocUuid,
          from_location_id: fromLocUuid,
          transaction_number: txnNumber,
          transaction_date: txnDate
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505' || error.message?.includes('pharmacy_stock_transactions_transaction_number_key')) {
          const uniqueTxnNum = `${txnNumber}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`
          const { data: retryData, error: retryError } = await supabase
            .from('pharmacy_stock_transactions')
            .insert({
              hospital_id: hospitalId,
              ...transaction,
              performed_by: performedByUuid,
              to_location_id: toLocUuid,
              from_location_id: fromLocUuid,
              transaction_number: uniqueTxnNum,
              transaction_date: txnDate
            })
            .select()
            .single()

          if (!retryError && retryData) {
            return { data: retryData as StockTransaction, error: null }
          }
        }
        throw error
      }
      return { data: data as StockTransaction, error: null }
    }

    const newTransaction: StockTransaction = {
      id: `txn-${Date.now()}`,
      ...transaction,
      transaction_number: txnNumber,
      transaction_date: txnDate,
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

export async function updateStockTransaction(
  transactionId: string,
  updates: Partial<StockTransaction> & { received_from?: string; supplier_id?: string; batch_id?: string }
): Promise<ApiResponse<StockTransaction>> {
  try {
    if (isSupabaseConfigured()) {
      const payload: Record<string, any> = {}
      if (updates.quantity !== undefined) payload.quantity = updates.quantity
      if (updates.transaction_date !== undefined) payload.transaction_date = updates.transaction_date
      if (updates.transaction_number !== undefined) payload.transaction_number = updates.transaction_number
      
      let finalReason = updates.reason || (updates as any).notes
      if (updates.received_from) {
        if (!finalReason) {
          finalReason = `Penerimaan stok daripada: ${updates.received_from}`
        } else if (!finalReason.includes(updates.received_from)) {
          finalReason = `${finalReason} | Sumber: ${updates.received_from}`
        }
      }
      if (finalReason !== undefined) {
        payload.reason = finalReason
      }

      const { data, error } = await supabase
        .from('pharmacy_stock_transactions')
        .update(payload)
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error

      const batchIdToUpdate = updates.batch_id || (data as any)?.batch_id
      if (updates.supplier_id && batchIdToUpdate) {
        try {
          await supabase
            .from('pharmacy_stock_batches')
            .update({ supplier_id: updates.supplier_id, updated_at: new Date().toISOString() })
            .eq('id', batchIdToUpdate)
        } catch (batchErr) {
          console.warn('Batch supplier update skipped:', batchErr)
        }
      }

      const returnData = {
        ...data,
        received_from: updates.received_from || (data as any)?.received_from
      }

      return { data: returnData as StockTransaction, error: null }
    }

    return { data: updates as any, error: null }
  } catch (error) {
    console.error('Error updating transaction:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update transaction',
    }
  }
}

/**
 * Perform Stock Receipt (Penerimaan)
 */
export async function createStockReceipt(
  hospitalId: string,
  payload: {
    item_type: 'drug' | 'non_drug'
    item_id: string
    batch_number: string
    transaction_number?: string
    manufacturing_date?: string
    expiry_date?: string
    quantity_received: number
    unit_cost?: number
    location_id: string
    supplier_id?: string
    received_from?: string
    received_date?: string
    transaction_date?: string
    performed_by: string
  }
): Promise<ApiResponse<{ batch: StockBatch; transaction: StockTransaction }>> {
  try {
    const recDate = payload.received_date || new Date().toISOString().split('T')[0]
    const txnDate = payload.transaction_date || (payload.received_date ? new Date(payload.received_date).toISOString() : new Date().toISOString())
    const isFacilityTransfer = payload.received_from?.toLowerCase().includes('fasiliti')
    const defaultPrefix = isFacilityTransfer ? 'TRF-FAC' : 'GRN-SUP'
    const txnNumber = payload.transaction_number || `${defaultPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

    if (isSupabaseConfigured()) {
      // 1. Check if same batch/item/location already exists
      const { data: existingBatches, error: findError } = await supabase
        .from('pharmacy_stock_batches')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('item_id', payload.item_id)
        .eq('batch_number', payload.batch_number)
        .eq('location_id', payload.location_id)
        .limit(1)

      if (findError) throw findError

      let batch: StockBatch
      if (existingBatches && existingBatches.length > 0) {
        // Increment quantity
        const eb = existingBatches[0]
        const newQty = (eb.quantity_on_hand || 0) + payload.quantity_received
        const { data: updatedBatch, error: updateError } = await supabase
          .from('pharmacy_stock_batches')
          .update({
            quantity_received: (eb.quantity_received || 0) + payload.quantity_received,
            quantity_on_hand: newQty,
            status: 'available', // reactivate if depleted
            updated_at: new Date().toISOString()
          })
          .eq('id', eb.id)
          .select()
          .single()

        if (updateError) throw updateError
        batch = updatedBatch as StockBatch
      } else {
        // Create new batch
        const { data: newBatch, error: insertError } = await supabase
          .from('pharmacy_stock_batches')
          .insert({
            hospital_id: hospitalId,
            item_type: payload.item_type,
            item_id: payload.item_id,
            batch_number: payload.batch_number,
            manufacturing_date: payload.manufacturing_date || null,
            expiry_date: payload.expiry_date || null,
            quantity_received: payload.quantity_received,
            quantity_on_hand: payload.quantity_received,
            quantity_reserved: 0,
            unit_cost: payload.unit_cost || null,
            location_id: payload.location_id,
            status: 'available',
            received_date: recDate,
            supplier_id: payload.supplier_id || null
          })
          .select()
          .single()

        if (insertError) throw insertError
        batch = newBatch as StockBatch
      }

      // 2. Log transaction
      const reasonText = payload.received_from 
        ? `Penerimaan stok daripada: ${payload.received_from}`
        : 'Penerimaan stok pembekal / QR Scan'

      const txnRes = await createStockTransaction(hospitalId, {
        transaction_type: 'receipt',
        transaction_number: txnNumber,
        item_type: payload.item_type,
        item_id: payload.item_id,
        batch_id: batch.id,
        quantity: payload.quantity_received,
        to_location_id: payload.location_id,
        performed_by: payload.performed_by,
        reason: reasonText,
        transaction_date: txnDate
      })

      if (txnRes.error) throw new Error(txnRes.error)

      return { data: { batch, transaction: txnRes.data! }, error: null }
    }

    // Mock fallback success
    return {
      data: {
        batch: { id: `batch-${Date.now()}`, ...payload, received_date: recDate, quantity_on_hand: payload.quantity_received } as any,
        transaction: { id: `txn-${Date.now()}`, transaction_number: txnNumber, transaction_type: 'receipt', quantity: payload.quantity_received, transaction_date: txnDate } as any
      },
      error: null
    }
  } catch (error) {
    console.error('Error performing receipt:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to perform stock receipt',
    }
  }
}

/**
 * Perform Stock Bring Forward (Baki Bawa Ke Hadapan - BKH / Opening Balance)
 */
export async function bringForwardStock(
  hospitalId: string,
  payload: {
    item_type: 'drug' | 'non_drug'
    item_id: string
    batch_number?: string
    transaction_number?: string
    expiry_date?: string
    bring_forward_qty: number
    location_id: string
    transaction_date?: string
    period_type?: 'previous_year' | 'previous_month' | 'initial_balance'
    performed_by: string
    reason?: string
  }
): Promise<ApiResponse<{ batch: StockBatch; transaction: StockTransaction }>> {
  try {
    const txnDate = payload.transaction_date 
      ? `${payload.transaction_date}T00:00:00.000Z` 
      : new Date().toISOString()
    const currentYear = new Date().getFullYear()
    const uniqueSuffix = `${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`
    const batchNum = (payload.batch_number?.trim() && !payload.batch_number.endsWith('-0001')) 
      ? payload.batch_number.trim() 
      : `BKH-${currentYear}-${uniqueSuffix}`
    const txnNumber = (payload.transaction_number?.trim() && !payload.transaction_number.endsWith('-0001')) 
      ? payload.transaction_number.trim() 
      : `BKH-${currentYear}-${uniqueSuffix}`
    
    const reasonPrefix = payload.period_type === 'previous_year'
      ? '[Bawa Ke Hadapan - Tahun Lepas]'
      : payload.period_type === 'previous_month'
      ? '[Bawa Ke Hadapan - Bulan Lepas]'
      : '[Baki Pembukaan Asal]'
    
    const fullReason = payload.reason?.trim()
      ? `${reasonPrefix} ${payload.reason.trim()}`
      : `${reasonPrefix} Baki pembukaan dipindahkan ke tempoh baharu.`

    if (isSupabaseConfigured()) {
      // 1. Check existing batch or create new
      const { data: existingBatches, error: findError } = await supabase
        .from('pharmacy_stock_batches')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('item_id', payload.item_id)
        .eq('batch_number', batchNum)
        .limit(1)

      if (findError) throw findError

      let batch: StockBatch
      if (existingBatches && existingBatches.length > 0) {
        const eb = existingBatches[0]
        const newQty = (eb.quantity_on_hand || 0) + payload.bring_forward_qty
        const { data: updatedBatch, error: updateError } = await supabase
          .from('pharmacy_stock_batches')
          .update({
            quantity_received: (eb.quantity_received || 0) + payload.bring_forward_qty,
            quantity_on_hand: newQty,
            status: 'available',
            updated_at: new Date().toISOString()
          })
          .eq('id', eb.id)
          .select()
          .single()

        if (updateError) throw updateError
        batch = updatedBatch as StockBatch
      } else {
        const { data: newBatch, error: insertError } = await supabase
          .from('pharmacy_stock_batches')
          .insert({
            hospital_id: hospitalId,
            item_type: payload.item_type,
            item_id: payload.item_id,
            batch_number: batchNum,
            expiry_date: payload.expiry_date || null,
            quantity_received: payload.bring_forward_qty,
            quantity_on_hand: payload.bring_forward_qty,
            quantity_reserved: 0,
            location_id: payload.location_id,
            status: 'available',
            received_date: payload.transaction_date || new Date().toISOString().split('T')[0],
          })
          .select()
          .single()

        if (insertError) throw insertError
        batch = newBatch as StockBatch
      }

      // 2. Create stock transaction
      const txnRes = await createStockTransaction(hospitalId, {
        transaction_type: 'bring_forward',
        transaction_number: txnNumber,
        item_type: payload.item_type,
        item_id: payload.item_id,
        batch_id: batch.id,
        quantity: payload.bring_forward_qty,
        to_location_id: payload.location_id,
        performed_by: payload.performed_by,
        reason: fullReason,
        transaction_date: txnDate
      })

      if (txnRes.error) throw new Error(txnRes.error)

      return { data: { batch, transaction: txnRes.data! }, error: null }
    }

    return {
      data: {
        batch: { id: `batch-bf-${Date.now()}`, ...payload, quantity_on_hand: payload.bring_forward_qty } as any,
        transaction: { id: `txn-bf-${Date.now()}`, transaction_number: txnNumber, transaction_type: 'bring_forward', quantity: payload.bring_forward_qty, transaction_date: txnDate, reason: fullReason } as any
      },
      error: null
    }
  } catch (error) {
    console.error('Error performing bring forward:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to perform bring forward balance',
    }
  }
}


/**
 * Perform Stock Issuing (Pengeluaran / FEFO)
 */
export async function issueStock(
  hospitalId: string,
  payload: {
    batch_id: string
    quantity: number
    transaction_number?: string
    to_location_id?: string
    reason?: string
    performed_by: string
    issued_date?: string
    transaction_date?: string
  }
): Promise<ApiResponse<StockTransaction>> {
  try {
    const txnDate = payload.transaction_date || (payload.issued_date ? new Date(payload.issued_date).toISOString() : new Date().toISOString())
    const txnNumber = payload.transaction_number || `ISS-DEPT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

    if (isSupabaseConfigured()) {
      // 1. Fetch batch first to confirm inventory
      const { data: batch, error: getError } = await supabase
        .from('pharmacy_stock_batches')
        .select('*')
        .eq('id', payload.batch_id)
        .single()

      if (getError) throw getError
      if (!batch) throw new Error('Batch not found')

      const qtyAvailable = (batch.quantity_on_hand || 0) - (batch.quantity_reserved || 0)
      if (qtyAvailable < payload.quantity) {
        throw new Error(`Stok tidak mencukupi. Baki tersedia: ${qtyAvailable}`)
      }

      // 2. Decrement quantity
      const nextQty = (batch.quantity_on_hand || 0) - payload.quantity
      const nextStatus = nextQty <= 0 ? 'depleted' : batch.status

      const { error: updateError } = await supabase
        .from('pharmacy_stock_batches')
        .update({
          quantity_on_hand: nextQty,
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', batch.id)

      if (updateError) throw updateError

      // 3. Create transaction
      const txnRes = await createStockTransaction(hospitalId, {
        transaction_type: 'issue',
        transaction_number: txnNumber,
        item_type: batch.item_type,
        item_id: batch.item_id,
        batch_id: batch.id,
        quantity: payload.quantity,
        from_location_id: batch.location_id,
        to_location_id: payload.to_location_id || null,
        performed_by: payload.performed_by,
        reason: payload.reason || 'Pengeluaran stok / QR Scan',
        transaction_date: txnDate
      })

      if (txnRes.error) throw new Error(txnRes.error)

      return { data: txnRes.data!, error: null }
    }

    const mockBatch = mockStockBatches.find(b => b.id === payload.batch_id)
    if (mockBatch) {
      mockBatch.quantity_on_hand = Math.max(0, (mockBatch.quantity_on_hand || 0) - payload.quantity)
      if (mockBatch.quantity_on_hand <= 0) mockBatch.status = 'depleted'
    }

    return {
      data: { id: `txn-${Date.now()}`, transaction_number: txnNumber, transaction_type: 'issue', quantity: payload.quantity, transaction_date: txnDate } as any,
      error: null
    }
  } catch (error) {
    console.error('Error performing issuing:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to perform stock issue',
    }
  }
}

/**
 * Perform Stock Check & Found (Semakan & Penemuan Stok / Verifikasi KEW.PS-4)
 */
export async function performStockCheckAndFound(
  hospitalId: string,
  payload: {
    item_type: 'drug' | 'non_drug'
    item_id: string
    batch_id?: string
    physical_quantity: number
    system_quantity: number
    location_id?: string
    checked_by: string
    reason?: string
    transaction_date?: string
  }
): Promise<ApiResponse<StockTransaction>> {
  try {
    const txnDate = payload.transaction_date 
      ? (payload.transaction_date.includes('T') ? payload.transaction_date : `${payload.transaction_date}T12:00:00.000Z`)
      : new Date().toISOString()
    const txnNumber = `CHK-FND-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
    
    const diff = payload.physical_quantity - payload.system_quantity
    const diffSignStr = diff > 0 ? `+${diff}` : `${diff}`
    const statusText = diff === 0 ? 'Sama (Matched)' : diff > 0 ? `Penemuan (+${diff})` : `Pelarasan (${diff})`

    const reasonText = payload.reason?.trim()
      ? `[Check & Found: ${statusText}] Fizikal: ${payload.physical_quantity}, Sistem: ${payload.system_quantity} — ${payload.reason.trim()}`
      : `[Check & Found: ${statusText}] Semakan stok fizikal KEW.PS-4 (Fizikal: ${payload.physical_quantity}, Sistem: ${payload.system_quantity})`

    if (isSupabaseConfigured()) {
      // 1. Direct update to facility inventory stock table
      if (payload.item_type === 'drug') {
        await supabase
          .from('facility_drug_inventory')
          .update({ facility_stock: payload.physical_quantity, updated_at: new Date().toISOString() })
          .eq('drug_id', payload.item_id)
      } else {
        await supabase
          .from('facility_non_drug_inventory')
          .update({ facility_stock: payload.physical_quantity, updated_at: new Date().toISOString() })
          .eq('nondrug_id', payload.item_id)
      }

      // 2. Synchronize pharmacy_stock_batches so total quantity_on_hand equals physical_quantity
      if (payload.batch_id) {
        const { data: batch, error: bError } = await supabase
          .from('pharmacy_stock_batches')
          .select('*')
          .eq('id', payload.batch_id)
          .single()

        if (!bError && batch) {
          const nextQty = Math.max(0, payload.physical_quantity)
          const nextStatus = nextQty <= 0 ? 'depleted' : 'available'
          await supabase
            .from('pharmacy_stock_batches')
            .update({
              quantity_on_hand: nextQty,
              status: nextStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', batch.id)
        }
      } else {
        const { data: batches } = await supabase
          .from('pharmacy_stock_batches')
          .select('*')
          .eq('hospital_id', hospitalId)
          .eq('item_id', payload.item_id)
          .in('status', ['available', 'quarantine', 'active'])
          .order('expiry_date', { ascending: true })

        if (batches && batches.length > 0) {
          const primaryBatch = batches[0]
          await supabase
            .from('pharmacy_stock_batches')
            .update({
              quantity_on_hand: payload.physical_quantity,
              status: payload.physical_quantity <= 0 ? 'depleted' : 'available',
              updated_at: new Date().toISOString()
            })
            .eq('id', primaryBatch.id)

          if (batches.length > 1) {
            for (let i = 1; i < batches.length; i++) {
              await supabase
                .from('pharmacy_stock_batches')
                .update({
                  quantity_on_hand: 0,
                  status: 'depleted',
                  updated_at: new Date().toISOString()
                })
                .eq('id', batches[i].id)
            }
          }
        } else if (payload.physical_quantity > 0) {
          // If no active batch exists, create an initial carry-forward batch
          const year = new Date().getFullYear()
          const defaultBatchNum = `BF-${year}-OPENING`

          const { data: newBatch } = await supabase
            .from('pharmacy_stock_batches')
            .insert({
              hospital_id: hospitalId,
              item_id: payload.item_id,
              item_type: payload.item_type,
              batch_number: defaultBatchNum,
              quantity_on_hand: payload.physical_quantity,
              expiry_date: null,
              status: 'available',
              location_id: payload.location_id || null,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          if (newBatch) {
            payload.batch_id = newBatch.id
          }
        }
      }

      const txnRes = await createStockTransaction(hospitalId, {
        transaction_type: 'check_found',
        transaction_number: txnNumber,
        item_type: payload.item_type,
        item_id: payload.item_id,
        batch_id: payload.batch_id || null,
        quantity: Math.abs(diff),
        to_location_id: payload.location_id || null,
        performed_by: payload.checked_by,
        reason: reasonText,
        transaction_date: txnDate
      })

      if (txnRes.error) throw new Error(txnRes.error)
      return { data: txnRes.data!, error: null }
    }

    const mockBatch = mockStockBatches.find(b => b.item_id === payload.item_id && b.item_type === payload.item_type)
    if (mockBatch) {
      mockBatch.quantity_on_hand = payload.physical_quantity
      mockBatch.status = payload.physical_quantity > 0 ? 'available' : 'depleted'
    } else if (payload.physical_quantity > 0) {
      const year = new Date().getFullYear()
      mockStockBatches.push({
        id: `batch-chk-fnd-${payload.item_id}`,
        hospital_id: hospitalId,
        item_id: payload.item_id,
        item_type: payload.item_type,
        batch_number: `CHK-FND-${year}`,
        quantity_received: payload.physical_quantity,
        quantity_on_hand: payload.physical_quantity,
        quantity_reserved: 0,
        expiry_date: undefined,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    return {
      data: {
        id: `txn-${Date.now()}`,
        transaction_number: txnNumber,
        transaction_type: 'check_found',
        quantity: Math.abs(diff),
        reason: reasonText,
        transaction_date: txnDate
      } as any,
      error: null
    }
  } catch (error) {
    console.error('Error performing Check & Found:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to perform Check & Found',
    }
  }
}


/**
 * Get fast moving items
 */
export async function getFastMovingItems(
  hospitalId: string,
  daysThreshold: number = 90
): Promise<ApiResponse<any[]>> {
  try {
    if (isSupabaseConfigured()) {
      // Get all issue transactions in the last daysThreshold days
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - daysThreshold)
      
      const { data: txns, error: txnError } = await supabase
        .from('pharmacy_stock_transactions')
        .select('item_id, item_type, quantity, transaction_date')
        .eq('hospital_id', hospitalId)
        .eq('transaction_type', 'issue')
        .gte('transaction_date', ninetyDaysAgo.toISOString())
        
      if (txnError) throw txnError
      
      const summaryRes = await getStockLevelSummary(hospitalId)
      if (summaryRes.error) throw new Error(summaryRes.error)
      const itemsList = summaryRes.data || []
      const itemsMap = new Map(itemsList.map(i => [i.item_id, i]))
      
      // Aggregate quantity issued by item_id
      const quantityMap = new Map<string, number>()
      txns?.forEach(t => {
        const current = quantityMap.get(t.item_id) || 0
        quantityMap.set(t.item_id, current + (t.quantity || 0))
      })
      
      const fastItems = Array.from(quantityMap.entries())
        .map(([itemId, totalQty]) => {
          const item = itemsMap.get(itemId)
          return {
            item_id: itemId,
            item_type: item?.item_type || 'drug',
            item_code: item?.item_code || '',
            item_name: item?.item_name || 'Unknown Item',
            current_stock: item?.current_stock || 0,
            total_movement: totalQty,
            usage_per_month: parseFloat((totalQty / (daysThreshold / 30)).toFixed(1)),
            price: item?.price || 0
          }
        })
        .sort((a, b) => b.total_movement - a.total_movement)
        
      return { data: fastItems, error: null }
    }
    
    // Fallback mock data when Supabase is not configured
    const mockFastItems = [
      { item_id: 'drug-001', item_type: 'drug', item_code: 'PCM500', item_name: 'Paracetamol 500mg', current_stock: 1200, total_movement: 600, usage_per_month: 200, price: 0.10 },
      { item_id: 'drug-003', item_type: 'drug', item_code: 'METF500', item_name: 'Metformin 500mg', current_stock: 800, total_movement: 450, usage_per_month: 150, price: 0.15 },
    ]
    return { data: mockFastItems, error: null }
  } catch (error) {
    console.error('Error fetching fast moving items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch fast moving items',
    }
  }
}

// =====================================================
// APPL SYNC & CATALOG MANAGEMENT
// =====================================================

// Mock tables for APPL local simulation
export let mockApplApprovedSuppliers = [
  {
    id: 'supp-appl-001',
    hospital_id: 'hosp-001',
    drug_id: 'drug-001',
    drug_code: 'D01.3003.11',
    supplier_name: 'Duopharma Manufacturing (Bangi) Sdn Bhd',
    manufacturer_name: 'Duopharma Manufacturing (Bangi) Sdn Bhd',
    country_of_origin: 'Malaysia',
    brand_name: 'Uphamol 120 Infant Syrup',
    mal_mda_number: 'MAL19912686XZ',
    procurement_scheme: 'SPPB',
    appl_effective_date: '2024-04-01',
    notes: 'Produk boleh dibeli melalui Konsesi seperti biasa.',
    status: 'active'
  },
  {
    id: 'supp-appl-002',
    hospital_id: 'hosp-001',
    drug_id: 'drug-001',
    drug_code: 'D01.3003.11',
    supplier_name: 'Idaman Pharma Manufacturing Sdn Bhd',
    manufacturer_name: 'Idaman Pharma Manufacturing Sdn Bhd',
    country_of_origin: 'Malaysia',
    brand_name: 'Fepril Syrup 120mg/5ml',
    mal_mda_number: 'MAL19912158XZ',
    procurement_scheme: 'SPPB',
    appl_effective_date: '2024-04-01',
    notes: 'Produk boleh dibeli melalui Konsesi seperti biasa.',
    status: 'active'
  },
  {
    id: 'supp-appl-003',
    hospital_id: 'hosp-001',
    drug_id: 'drug-002',
    drug_code: 'D01.0016.05',
    supplier_name: 'Natural Wellness Industries Sdn Bhd',
    manufacturer_name: 'Natural Wellness Industries Sdn Bhd',
    country_of_origin: 'Malaysia',
    brand_name: 'Nw Acriflavine Lotion 0.1%',
    mal_mda_number: 'MAL10120051XZ',
    procurement_scheme: 'SPPB',
    appl_effective_date: '2024-05-01',
    notes: 'Produk boleh dibeli melalui Konsesi seperti biasa.',
    status: 'active'
  },
  {
    id: 'supp-appl-004',
    hospital_id: 'hosp-001',
    drug_id: 'drug-002',
    drug_code: 'D01.0016.05',
    supplier_name: 'Teraputics Sdn Bhd',
    manufacturer_name: 'Teraputics Sdn Bhd',
    country_of_origin: 'Malaysia',
    brand_name: 'Flavisept Lotion 0.1%W/V',
    mal_mda_number: 'MAL19940184XCZ',
    procurement_scheme: 'SPPB',
    appl_effective_date: '2024-05-01',
    notes: 'Produk boleh dibeli melalui Konsesi seperti biasa.',
    status: 'active'
  }
];

export let mockApplSyncLogs = [
  {
    id: 'log-001',
    hospital_id: 'hosp-001',
    synced_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    status: 'success',
    sheet_tab: 'Lampiran B',
    rows_fetched: 612,
    drugs_upserted: 45,
    suppliers_upserted: 98,
    triggered_by: 'manual'
  }
];

/**
 * Get APPL catalog items with optional filtering
 */
export async function getApplItems(
  hospitalId: string,
  filter?: InventoryFilter & { procurement_scheme?: string },
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<DrugWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('drugs')
        .select(
          `
          *,
          category:drug_categories!drugs_category_id_fkey (*),
          supplier:suppliers (*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'appl')
        .eq('sheet_source', 'Lampiran B')

      if (filter?.search) {
        const search = filter.search.trim()
        if (search) {
          query = query.or(
            [
              `drug_code.ilike.%${search}%`,
              `drug_name.ilike.%${search}%`,
              `generic_name.ilike.%${search}%`,
              `appl_kod.ilike.%${search}%`,
              `appl_code.ilike.%${search}%`
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
        .order('drug_name', { ascending: true })
        .range(from, to)

      if (error) throw error

      return {
        data: {
          data: (data || []) as DrugWithRelations[],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        error: null,
      }
    }

    // Mock Fallback
    let items = mockDrugs.filter(d => d.procurement_vote === 'appl' && d.drug_code.startsWith('D'))

    if (filter?.search) {
      const search = filter.search.toLowerCase().trim()
      items = items.filter(
        d =>
          d.drug_code.toLowerCase().includes(search) ||
          d.drug_name.toLowerCase().includes(search) ||
          d.generic_name?.toLowerCase().includes(search)
      )
    }

    if (filter?.category_id) {
      items = items.filter(d => d.category_id === filter.category_id)
    }

    if (filter?.status && filter.status !== 'all') {
      items = items.filter(d => d.status === filter.status)
    }

    // Sort by name
    items.sort((a, b) => a.drug_name.localeCompare(b.drug_name))

    const total = items.length
    const start = (page - 1) * pageSize
    const paginated = items.slice(start, start + pageSize)

    // Map relationships to mock
    const enriched = paginated.map(item => {
      const cat = mockDrugCategories.find(c => c.id === item.category_id)
      const sup = mockSuppliers.find(s => s.id === item.supplier_id)
      return {
        ...item,
        category: cat || null,
        supplier: sup || null,
        appl_kod: item.appl_kod || item.drug_code.replace('D', ''),
        appl_code: item.drug_code,
        price: item.price || 5.72,
        moq: item.moq || '1 Pack',
        packaging_description: item.packaging_description || 'Bottle of 100 ml',
      }
    })

    return {
      data: {
        data: enriched as DrugWithRelations[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching APPL items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch APPL items',
    }
  }
}

/**
 * Get approved suppliers for a specific APPL drug
 */
export async function getApplSuppliers(
  hospitalId: string,
  drugCode: string
): Promise<ApiResponse<any[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('appl_approved_suppliers')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('drug_code', drugCode)
        .order('supplier_name', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    }

    // Mock Fallback
    const suppliers = mockApplApprovedSuppliers.filter(
      s => s.hospital_id === hospitalId && s.drug_code === drugCode
    )
    return { data: suppliers, error: null }
  } catch (error) {
    console.error('Error fetching APPL suppliers:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch APPL suppliers',
    }
  }
}

/**
 * Get the latest APPL sync log
 */
export async function getApplSyncStatus(
  hospitalId: string
): Promise<ApiResponse<any>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('appl_sync_logs')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return { data: data || null, error: null }
    }

    // Mock Fallback
    const latest = mockApplSyncLogs.length > 0 ? mockApplSyncLogs[mockApplSyncLogs.length - 1] : null
    return { data: latest, error: null }
  } catch (error) {
    console.error('Error fetching APPL sync status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch APPL sync status',
    }
  }
}

/**
 * Manually trigger the APPL sync edge function
 */
export async function triggerApplSync(
  hospitalId: string
): Promise<ApiResponse<{ rows_processed: number; drugs_upserted: number; suppliers_upserted: number }>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('appl-sheet-sync', {
        body: { hospital_id: hospitalId },
      })

      if (error) throw error
      return { data, error: null }
    }

    // Local Mock Simulation
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulation delay

    // Update prices of some mock items slightly to simulate a real change
    mockDrugs.forEach(d => {
      if (d.procurement_vote === 'appl' && d.price) {
        d.price = parseFloat((d.price * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2))
      }
    })

    const newLog = {
      id: `log-${Date.now()}`,
      hospital_id: hospitalId,
      synced_at: new Date().toISOString(),
      status: 'success' as const,
      sheet_tab: 'Lampiran B',
      rows_fetched: 612,
      drugs_upserted: Math.floor(Math.random() * 5) + 1,
      suppliers_upserted: Math.floor(Math.random() * 15) + 5,
      triggered_by: 'manual' as const
    }
    mockApplSyncLogs.push(newLog)

    return {
      data: {
        rows_processed: 612,
        drugs_upserted: newLog.drugs_upserted,
        suppliers_upserted: newLog.suppliers_upserted,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error triggering APPL sync:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to trigger APPL sync',
    }
  }
}

/**
 * Manually trigger the LP Sync Edge Function
 */
export async function triggerLpSync(
  hospitalId: string
): Promise<ApiResponse<{ total_rows_processed: number; drugs_upserted: number; non_drugs_upserted: number }>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Move wrong/seeded LP items to 'cc' so they don't corrupt the LP catalog view
      await supabase
        .from('drugs')
        .update({ procurement_vote: 'cc' })
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'lp')
        .is('sheet_source', null)

      await supabase
        .from('non_drugs')
        .update({ procurement_vote: 'cc' })
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'lp')
        .is('sheet_source', null)

      // 2. Fetch and parse tabs from the Google Sheet
      const sheetId = '1wZ51z75XwDOS3sWgp_N-4-Jv_m9LRjH1OHDzFzPKm4Q';
      const tabs = [
        { name: 'PFB: Ubat Sebut Harga (LQ)', gid: '1798977390', type: 'lq' },
        { name: 'PFB: Ubat CFLN', gid: '1387022075', type: 'cfln' },
        { name: 'PFB: Non Drug', gid: '2121929903', type: 'non_drug' },
      ];

      // Custom helpers inside function
      const parseCSV = (text: string): string[][] => {
        const result: string[][] = [];
        let row: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const next = text[i + 1];
          if (inQuotes) {
            if (char === '"') {
              if (next === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += char;
            }
          } else {
            if (char === '"') {
              inQuotes = true;
            } else if (char === ',') {
              row.push(current.trim());
              current = '';
            } else if (char === '\n' || char === '\r') {
              if (char === '\r' && next === '\n') {
                i++;
              }
              row.push(current.trim());
              result.push(row);
              row = [];
              current = '';
            } else {
              current += char;
            }
          }
        }
        if (row.length > 0 || current !== '') {
          row.push(current.trim());
          result.push(row);
        }
        return result;
      };

      const deriveDosageForm = (productName: string, pkgDesc: string): string => {
        const text = `${productName} ${pkgDesc}`.toLowerCase();
        if (text.includes('tablet') || text.includes('tab')) return 'tablet';
        if (text.includes('capsule') || text.includes('cap')) return 'capsule';
        if (text.includes('injection') || text.includes('inj') || text.includes('vial') || text.includes('ampoule')) return 'injection';
        if (text.includes('syrup') || text.includes('syr')) return 'syrup';
        if (text.includes('suspension') || text.includes('susp')) return 'suspension';
        if (text.includes('ointment') || text.includes('oint')) return 'ointment';
        if (text.includes('cream')) return 'cream';
        if (text.includes('drop')) return 'drops';
        if (text.includes('inhaler') || text.includes('inhalation') || text.includes('puff')) return 'inhaler';
        if (text.includes('patch')) return 'patch';
        if (text.includes('suppository') || text.includes('supp')) return 'suppository';
        if (text.includes('powder')) return 'powder';
        if (text.includes('solution') || text.includes('soln')) return 'solution';
        if (text.includes('lotion')) return 'lotion';
        if (text.includes('liquid')) return 'liquid';
        if (text.includes('granules')) return 'granules';
        if (text.includes('spray')) return 'spray';
        if (text.includes('enema')) return 'enema';
        if (text.includes('gel')) return 'gel';
        if (text.includes('aerosol')) return 'aerosol';
        return 'other';
      };

      const parsePrice = (val: string): number | null => {
        if (!val) return null;
        const clean = val.replace(/[^0-9.]/g, '');
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? null : parsed;
      };

      const parseInteger = (val: string): number | null => {
        if (!val) return null;
        const clean = val.replace(/[^0-9-]/g, '');
        const parsed = parseInt(clean, 10);
        return isNaN(parsed) ? null : parsed;
      };

      const parseDate = (val: string): string | null => {
        if (!val || val.toLowerCase() === 'not applicable' || val.toLowerCase() === 'in progress') return null;
        const cleanVal = val.trim();
        if (cleanVal.includes('/')) {
          const slashes = cleanVal.split('/');
          if (slashes.length === 3) {
            const day = parseInt(slashes[0], 10);
            const month = parseInt(slashes[1], 10);
            let year = parseInt(slashes[2], 10);
            if (year < 100) {
              year += year > 50 ? 1900 : 2000;
            }
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
        if (cleanVal.includes('.')) {
          const dots = cleanVal.split('.');
          if (dots.length === 3) {
            const day = parseInt(dots[0], 10);
            const month = parseInt(dots[1], 10);
            let year = parseInt(dots[2], 10);
            if (year < 100) {
              year += year > 50 ? 1900 : 2000;
            }
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
        try {
          const d = new Date(cleanVal);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().split('T')[0];
        } catch {
          return null;
        }
      };

      let totalFetched = 0;
      let drugsUpsertedTotal = 0;
      let nonDrugsUpsertedTotal = 0;

      for (const tab of tabs) {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${tab.gid}`;
        console.log(`Fetching tab "${tab.name}" client-side from: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch tab "${tab.name}": ${response.statusText}`);
        }

        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        const dataRows = rows.slice(2).filter(row => {
          const codeIndex = tab.type === 'lq' ? 2 : 1;
          return row.length > 5 && row[codeIndex] && row[codeIndex].trim() !== '' && !row[codeIndex].includes('Code') && !row[codeIndex].includes('CODE');
        });

        totalFetched += dataRows.length;

        if (tab.type === 'lq') {
          const drugUpserts = dataRows.map(row => {
            const startDate = parseDate(row[0]);
            const endDate = parseDate(row[1]);
            const drugCode = row[2].trim();
            const name = row[3].trim();
            const pkgDesc = row[4].trim();
            const price = parsePrice(row[5]);
            const remarks = row[6].trim();
            const rxCategory = row[7].trim();
            const quota = parseInteger(row[8]);
            const balance = parseInteger(row[9]);
            const dosageForm = deriveDosageForm(name, pkgDesc);

            return {
              hospital_id: hospitalId,
              drug_code: drugCode,
              drug_name: name,
              generic_name: name,
              dosage_form: dosageForm,
              unit_of_measure: 'unit',
              status: 'active',
              procurement_vote: 'lp',
              price,
              packaging_description: pkgDesc,
              lp_start_date: startDate,
              lp_end_date: endDate,
              lp_remarks: remarks,
              lp_rx_category: rxCategory,
              lp_quota: quota,
              lp_balance: balance,
              lp_type: 'sebut_harga_lq',
              last_synced_from_sheet: new Date().toISOString(),
              sheet_source: `Google Sheet LP - ${tab.name}`,
            };
          });

          const CHUNK_SIZE = 50;
          for (let i = 0; i < drugUpserts.length; i += CHUNK_SIZE) {
            const chunk = drugUpserts.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
              .from('drugs')
              .upsert(chunk, { onConflict: 'hospital_id, drug_code' });
            if (error) throw error;
          }
          drugsUpsertedTotal += drugUpserts.length;

        } else if (tab.type === 'cfln') {
          const drugUpserts = dataRows.map(row => {
            const subclass = row[0].trim();
            const drugCode = row[1].trim();
            const name = row[2].trim();
            const sku = row[3].trim().toLowerCase();
            const pkgDesc = row[4].trim();
            const remarks = row[5].trim();
            const rxCategory = row[6].trim();
            const balance = parseInteger(row[7]);
            const dosageForm = deriveDosageForm(name, pkgDesc);

            return {
              hospital_id: hospitalId,
              drug_code: drugCode,
              drug_name: name,
              generic_name: name,
              dosage_form: dosageForm,
              unit_of_measure: sku || 'unit',
              status: 'active',
              procurement_vote: 'lp',
              price: null,
              packaging_description: pkgDesc,
              lp_remarks: remarks,
              lp_rx_category: rxCategory,
              lp_quota: null,
              lp_balance: balance,
              lp_type: 'cfln',
              item_sub_class: subclass,
              last_synced_from_sheet: new Date().toISOString(),
              sheet_source: `Google Sheet LP - ${tab.name}`,
            };
          });

          const CHUNK_SIZE = 50;
          for (let i = 0; i < drugUpserts.length; i += CHUNK_SIZE) {
            const chunk = drugUpserts.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
              .from('drugs')
              .upsert(chunk, { onConflict: 'hospital_id, drug_code' });
            if (error) throw error;
          }
          drugsUpsertedTotal += drugUpserts.length;

        } else if (tab.type === 'non_drug') {
          const nonDrugUpserts = dataRows.map(row => {
            const contract = row[0].trim();
            let startDate: string | null = null;
            let endDate: string | null = null;
            if (contract.includes('-')) {
              const parts = contract.split('-');
              if (parts[0]) startDate = parseDate(parts[0].trim());
              if (parts[1]) endDate = parseDate(parts[1].trim());
            } else {
              startDate = parseDate(contract);
            }
            const itemCode = row[1].trim();
            const name = row[2].trim();
            const pku = row[3].trim();
            const remarks = row[4].trim();
            const price = parsePrice(row[5]);
            const quota = parseInteger(row[6]);
            const balance = parseInteger(row[7]);

            return {
              hospital_id: hospitalId,
              item_code: itemCode,
              item_name: name,
              unit_of_measure: pku || 'unit',
              status: 'active',
              procurement_vote: 'lp',
              price,
              packaging_description: remarks,
              lp_start_date: startDate,
              lp_end_date: endDate,
              lp_quota: quota,
              lp_balance: balance,
              lp_type: 'non_drug',
              lp_remarks: remarks,
              last_synced_from_sheet: new Date().toISOString(),
              sheet_source: `Google Sheet LP - ${tab.name}`,
            };
          });

          const CHUNK_SIZE = 50;
          for (let i = 0; i < nonDrugUpserts.length; i += CHUNK_SIZE) {
            const chunk = nonDrugUpserts.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
              .from('non_drugs')
              .upsert(chunk, { onConflict: 'hospital_id, item_code' });
            if (error) throw error;
          }
          nonDrugsUpsertedTotal += nonDrugUpserts.length;
        }

        // Record log per tab
        await supabase
          .from('lp_sync_logs')
          .insert({
            hospital_id: hospitalId,
            status: 'success',
            sheet_tab: tab.name,
            rows_fetched: dataRows.length,
            drugs_upserted: tab.type === 'non_drug' ? 0 : dataRows.length,
            non_drugs_upserted: tab.type === 'non_drug' ? dataRows.length : 0,
            triggered_by: 'manual',
          });
      }

      return {
        data: {
          total_rows_processed: totalFetched,
          drugs_upserted: drugsUpsertedTotal,
          non_drugs_upserted: nonDrugsUpsertedTotal,
        },
        error: null,
      }
    }

    // Local Mock Simulation
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      data: {
        total_rows_processed: 120,
        drugs_upserted: 80,
        non_drugs_upserted: 40,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error triggering LP sync:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to trigger LP sync',
    }
  }
}

/**
 * Fetch LP sync logs
 */
export async function getLpSyncLogs(
  hospitalId: string
): Promise<ApiResponse<any[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('lp_sync_logs')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('synced_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return { data, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching LP sync logs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch LP sync logs',
    }
  }
}

/**
 * Manually trigger the CC Sync client-side
 */
export async function triggerCcSync(
  hospitalId: string
): Promise<ApiResponse<{ total_rows_processed: number; drugs_upserted: number }>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch and parse the "Kontrak Aktif" tab from the Google Sheet
      const sheetId = '1YtAA_9agBmlRvVsaKJCHY3rZwRTIZWOfwyR4-ZfiIxM';
      const gid = '659138877';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      console.log(`Fetching CC contract sheet client-side from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch CC sheet: ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Reuse custom CSV parser
      const parseCSV = (text: string): string[][] => {
        const result: string[][] = [];
        let row: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const next = text[i + 1];
          if (inQuotes) {
            if (char === '"') {
              if (next === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += char;
            }
          } else {
            if (char === '"') {
              inQuotes = true;
            } else if (char === ',') {
              row.push(current.trim());
              current = '';
            } else if (char === '\n' || char === '\r') {
              if (char === '\r' && next === '\n') {
                i++;
              }
              row.push(current.trim());
              result.push(row);
              row = [];
              current = '';
            } else {
              current += char;
            }
          }
        }
        if (row.length > 0 || current !== '') {
          row.push(current.trim());
          result.push(row);
        }
        return result;
      };

      const deriveDosageForm = (productName: string): string => {
        const text = productName.toLowerCase();
        if (text.includes('tablet') || text.includes('tab')) return 'tablet';
        if (text.includes('capsule') || text.includes('cap')) return 'capsule';
        if (text.includes('injection') || text.includes('inj') || text.includes('vial') || text.includes('ampoule')) return 'injection';
        if (text.includes('syrup') || text.includes('syr')) return 'syrup';
        if (text.includes('suspension') || text.includes('susp')) return 'suspension';
        if (text.includes('ointment') || text.includes('oint')) return 'ointment';
        if (text.includes('cream')) return 'cream';
        if (text.includes('drop')) return 'drops';
        if (text.includes('inhaler') || text.includes('inhalation') || text.includes('puff')) return 'inhaler';
        if (text.includes('patch')) return 'patch';
        if (text.includes('suppository') || text.includes('supp')) return 'suppository';
        if (text.includes('powder')) return 'powder';
        if (text.includes('solution') || text.includes('soln')) return 'solution';
        if (text.includes('lotion')) return 'lotion';
        if (text.includes('liquid')) return 'liquid';
        if (text.includes('granules')) return 'granules';
        if (text.includes('spray')) return 'spray';
        if (text.includes('enema')) return 'enema';
        if (text.includes('gel')) return 'gel';
        if (text.includes('aerosol')) return 'aerosol';
        return 'other';
      };

      const parseDate = (val: string): string | null => {
        if (!val) return null;
        const cleanVal = String(val).trim();
        if (!cleanVal || cleanVal === '-' || cleanVal === '—') return null;

        const lower = cleanVal.toLowerCase();
        if (lower.includes('kkm') || lower.includes('mal') || lower.includes('box') || lower.includes('vial') || lower.includes('pack') || lower.includes('unit') || lower.includes('tablet') || lower.includes('injection')) {
          return null;
        }

        const norm = parseAndNormalizeDate(cleanVal);
        return (norm && norm.length === 10 && norm.includes('-')) ? norm : null;
      };

      const rows = parseCSV(csvText);

      // Dynamic header mapping for CC items
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const rowLower = rows[i].map(c => String(c || '').toLowerCase());
        if (rowLower.some(c => c.includes('mdc') || c.includes('nama') || c.includes('kontrak') || c.includes('pembekal') || c.includes('pembungkusan'))) {
          headerRowIdx = i;
          break;
        }
      }

      const headers = rows[headerRowIdx].map(h => String(h || '').trim().toLowerCase());

      const getColIdx = (keywords: string[], fallbackIdx: number): number => {
        const found = headers.findIndex(h => keywords.some(kw => h.includes(kw)));
        return found !== -1 ? found : fallbackIdx;
      };

      // 1. Smart Item Name Column Detection
      let itemNameIdx = getColIdx(['nama ubat', 'nama barangan', 'nama item', 'nama', 'perihalan', 'keterangan', 'description', 'item', 'ubat', 'product', 'spec'], -1);
      if (itemNameIdx === -1) {
        for (let c = 0; c < Math.min(rows[headerRowIdx + 1]?.length || 0, 15); c++) {
          const sampleCell = rows.slice(headerRowIdx + 1, headerRowIdx + 10).map(r => String(r[c] || '')).join(' ').toLowerCase();
          if (sampleCell.includes('injection') || sampleCell.includes('tablet') || sampleCell.includes('capsule') || sampleCell.includes('mg') || sampleCell.includes('solution') || sampleCell.includes('infusion')) {
            itemNameIdx = c;
            break;
          }
        }
      }
      if (itemNameIdx === -1) itemNameIdx = 8;

      // 2. Smart Date Columns Detection
      let contractMulaIdx = getColIdx(['kontrak mula', 'tarikh mula', 'tarikh bermula', 'mula kontrak', 'start date', 'contract start'], -1);
      let contractTamatIdx = getColIdx(['kontrak tamat', 'tarikh tamat', 'tamat kontrak', 'end date', 'contract end', 'luput', 'expir'], -1);

      if (contractMulaIdx === -1 || contractTamatIdx === -1) {
        const dateCols: number[] = [];
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        const colCount = Math.max(...sampleRows.map(r => r.length), 0);
        
        for (let c = 0; c < colCount; c++) {
          const hasDates = sampleRows.some(r => parseDate(String(r[c] || '')) !== null);
          if (hasDates) {
            dateCols.push(c);
          }
        }

        if (dateCols.length >= 3) {
          if (contractMulaIdx === -1) contractMulaIdx = dateCols[0];
          if (contractTamatIdx === -1) contractTamatIdx = dateCols[dateCols.length - 1];
        } else if (dateCols.length === 2) {
          if (contractMulaIdx === -1) contractMulaIdx = dateCols[0];
          if (contractTamatIdx === -1) contractTamatIdx = dateCols[1];
        } else if (dateCols.length === 1) {
          if (contractTamatIdx === -1) contractTamatIdx = dateCols[0];
        }
      }

      if (contractMulaIdx === -1) contractMulaIdx = 1;
      if (contractTamatIdx === -1) contractTamatIdx = 2;

      // 3. Smart Contract Number Detection
      let noKontrakIdx = getColIdx(['no. kontrak', 'no kontrak', 'kontrak kkm', 'warta', 'rujukan'], -1);
      if (noKontrakIdx === -1) {
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        for (let c = 0; c < 15; c++) {
          if (sampleRows.some(r => String(r[c] || '').includes('KKM-') || String(r[c] || '').includes('/202') || String(r[c] || '').includes('/F('))) {
            noKontrakIdx = c;
            break;
          }
        }
      }
      if (noKontrakIdx === -1) noKontrakIdx = 0;

      // 4. Smart MAL Number Detection
      let malNumberIdx = getColIdx(['mal', 'mda', 'pendaftaran'], -1);
      if (malNumberIdx === -1) {
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        for (let c = 0; c < 15; c++) {
          if (sampleRows.some(r => String(r[c] || '').toUpperCase().startsWith('MAL'))) {
            malNumberIdx = c;
            break;
          }
        }
      }
      if (malNumberIdx === -1) malNumberIdx = 7;

      let hargaIdx = getColIdx(['harga', 'price', 'kadar', 'rm', 'kos', 'unit price'], -1);
      if (hargaIdx === -1) {
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        for (let c = 0; c < 20; c++) {
          const validPriceCount = sampleRows.filter(r => {
            const val = String(r[c] || '').replace(/RM/gi, '').replace(/,/g, '').trim();
            const num = parseFloat(val);
            return !isNaN(num) && num > 0 && num < 100000 && !parseDate(val) && !val.includes('/') && !val.includes('KKM');
          }).length;
          if (validPriceCount >= 3) {
            hargaIdx = c;
            break;
          }
        }
      }
      if (hargaIdx === -1) hargaIdx = 10;

      const pembekalIdx = getColIdx(['pembekal', 'supplier', 'syarikat', 'vendor'], 14);
      const jenamaIdx = getColIdx(['jenama', 'brand', 'pengilang'], 15);
      const contractStatusIdx = getColIdx(['status kontrak', 'status pool', 'status'], 6);

      const dataRows = rows.slice(headerRowIdx + 1).filter(row => {
        const nameVal = row[itemNameIdx]?.trim() || '';
        return row.length > 2 && nameVal !== '' && !nameVal.toLowerCase().includes('nama ubat') && !nameVal.toLowerCase().includes('nama barangan') && !nameVal.toLowerCase().includes('nama item');
      });

      // Find Packaging Column (Column W = Index 22 is primary for CC Sheets)
      let packagingIdx = -1;
      const colWVal = dataRows.find(r => r[22] && r[22].trim() !== '')?.[22]?.trim() || '';
      if (colWVal && !colWVal.match(/^\d{1,4}\/\d{2,4}$/) && (
        colWVal.toLowerCase().includes('box') || 
        colWVal.toLowerCase().includes('pack') || 
        colWVal.toLowerCase().includes('vial') || 
        colWVal.toLowerCase().includes('unit') || 
        colWVal.includes("'s") || 
        colWVal.toLowerCase().includes('tablet') || 
        colWVal.toLowerCase().includes('bottle')
      )) {
        packagingIdx = 22;
      }

      if (packagingIdx === -1) {
        for (let i = headers.length - 1; i >= 0; i--) {
          const h = headers[i];
          if ((h.includes('pembungkusan') || h.includes('packaging') || h.includes('packing')) && !h.includes('warta') && !h.includes('rujukan')) {
            packagingIdx = i;
            break;
          }
        }
      }

      if (packagingIdx === -1) packagingIdx = 22; // Column W default

      // Fetch existing drugs for hospital to allow smart matching by drug_name or drug_code
      const { data: existingDrugsSync } = await supabase
        .from('drugs')
        .select('id, drug_code, drug_name')
        .eq('hospital_id', hospitalId);

      const drugMapByNameSync = new Map<string, { id: string; drug_code: string }>();
      const drugMapByCodeSync = new Map<string, { id: string; drug_code: string }>();
      (existingDrugsSync || []).forEach(d => {
        if (d.drug_name) {
          const normName = d.drug_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          drugMapByNameSync.set(normName, { id: d.id, drug_code: d.drug_code });
        }
        if (d.drug_code) {
          drugMapByCodeSync.set(d.drug_code.trim().toLowerCase(), { id: d.id, drug_code: d.drug_code });
        }
      });

      // Archive ALL pre-existing CC items (regardless of sheet_source)
      await supabase
        .from('drugs')
        .update({ procurement_vote: null })
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'cc');

      const drugUpserts = dataRows.map((row, idx) => {
        let mdc = row[mdcIdx]?.trim() || '';
        const itemName = row[itemNameIdx]?.trim() || '';
        const packaging = row[packagingIdx]?.trim() || '';
        const hargaRaw = row[hargaIdx]?.trim()?.replace(/RM/gi, '')?.replace(/,/g, '')?.trim() || '';
        const priceNum = hargaRaw && !isNaN(parseFloat(hargaRaw)) ? parseFloat(hargaRaw) : null;
        const noKontrak = row[noKontrakIdx]?.trim() || '';
        const contractMula = contractMulaIdx !== -1 ? parseDate(row[contractMulaIdx]) : null;
        const contractTamat = contractTamatIdx !== -1 ? parseDate(row[contractTamatIdx]) : null;
        const pembekal = row[pembekalIdx]?.trim() || '';
        const jenama = row[jenamaIdx]?.trim() || '';
        const contractStatus = row[contractStatusIdx]?.trim() || '';
        const malNumber = row[malNumberIdx]?.trim() || '';
        const dosageForm = deriveDosageForm(itemName);

        // Clean invalid or date-like MDC codes
        if (mdc && parseDate(mdc) !== null) {
          mdc = '';
        }

        const normItemName = itemName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const matched = (mdc ? drugMapByCodeSync.get(mdc.toLowerCase()) : null) || drugMapByNameSync.get(normItemName);

        let finalDrugCode = mdc;
        let existingId: string | undefined = undefined;

        if (matched) {
          finalDrugCode = matched.drug_code;
          existingId = matched.id;
        } else if (!finalDrugCode || finalDrugCode === '-' || finalDrugCode.toLowerCase() === 'nil') {
          const nameSlug = itemName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15).toUpperCase();
          finalDrugCode = `CC-${nameSlug || idx}`;
        }

        let calculatedContractStatus = contractStatus;
        if (!calculatedContractStatus || calculatedContractStatus === '-' || calculatedContractStatus === '—') {
          if (contractMula && contractTamat) {
            const start = new Date(contractMula);
            const end = new Date(contractTamat);
            const today = new Date();
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              if (today >= start && today <= end) calculatedContractStatus = 'Aktif';
              else if (today > end) calculatedContractStatus = 'Tamat';
              else if (today < start) calculatedContractStatus = 'Belum Mula';
            }
          }
        }

        return {
          ...(existingId ? { id: existingId } : {}),
          hospital_id: hospitalId,
          drug_code: finalDrugCode,
          drug_name: itemName,
          generic_name: itemName,
          dosage_form: dosageForm,
          unit_of_measure: packaging || 'unit',
          packaging_description: packaging || null,
          status: 'active',
          procurement_vote: 'cc',
          price: priceNum,
          mal_mda_number: malNumber || null,
          brand_name: jenama || null,
          cc_contract_number: noKontrak || null,
          cc_contract_start_date: contractMula,
          cc_contract_end_date: contractTamat,
          cc_contract_status: calculatedContractStatus || null,
          cc_supplier_name: pembekal || null,
          cc_brand_name: jenama || null,
          last_synced_from_sheet: new Date().toISOString(),
          sheet_source: 'Google Sheet CC - Kontrak Aktif',
        };
      });

      // Deduplicate items by drug_code to prevent PostgreSQL ON CONFLICT error
      const uniqueMap = new Map<string, any>();
      drugUpserts.forEach((item, i) => {
        let code = item.drug_code;
        if (uniqueMap.has(code) && uniqueMap.get(code).drug_name !== item.drug_name) {
          code = `${code}-${i}`;
          item.drug_code = code;
        }
        uniqueMap.set(code, item);
      });
      const uniqueDrugUpserts = Array.from(uniqueMap.values());

      const CHUNK_SIZE = 50;
      for (let i = 0; i < uniqueDrugUpserts.length; i += CHUNK_SIZE) {
        const chunk = uniqueDrugUpserts.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
          .from('drugs')
          .upsert(chunk, { onConflict: 'hospital_id, drug_code' });
        if (error) throw error;
      }

      await supabase
        .from('cc_sync_logs')
        .insert({
          hospital_id: hospitalId,
          status: 'success',
          rows_fetched: dataRows.length,
          drugs_upserted: drugUpserts.length,
          triggered_by: 'manual',
        });

      return {
        data: {
          total_rows_processed: dataRows.length,
          drugs_upserted: drugUpserts.length,
        },
        error: null,
      };
    }

    // Local Mock Simulation
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      data: {
        total_rows_processed: 85,
        drugs_upserted: 85,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error triggering CC sync:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to trigger CC sync',
    };
  }
}

/**
 * Import CC Sync manually using raw CSV string
 */
export async function importCcSyncCsv(
  hospitalId: string,
  csvText: string
): Promise<ApiResponse<{ total_rows_processed: number; drugs_upserted: number }>> {
  try {
    if (isSupabaseConfigured()) {
      // Reuse custom CSV parser
      const parseCSV = (text: string): string[][] => {
        const result: string[][] = [];
        let row: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const next = text[i + 1];
          if (inQuotes) {
            if (char === '"') {
              if (next === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += char;
            }
          } else {
            if (char === '"') {
              inQuotes = true;
            } else if (char === ',') {
              row.push(current.trim());
              current = '';
            } else if (char === '\n' || char === '\r') {
              if (char === '\r' && next === '\n') {
                i++;
              }
              row.push(current.trim());
              result.push(row);
              row = [];
              current = '';
            } else {
              current += char;
            }
          }
        }
        if (row.length > 0 || current !== '') {
          row.push(current.trim());
          result.push(row);
        }
        return result;
      };

      const deriveDosageForm = (productName: string): string => {
        const text = productName.toLowerCase();
        if (text.includes('tablet') || text.includes('tab')) return 'tablet';
        if (text.includes('capsule') || text.includes('cap')) return 'capsule';
        if (text.includes('injection') || text.includes('inj') || text.includes('vial') || text.includes('ampoule')) return 'injection';
        if (text.includes('syrup') || text.includes('syr')) return 'syrup';
        if (text.includes('suspension') || text.includes('susp')) return 'suspension';
        if (text.includes('ointment') || text.includes('oint')) return 'ointment';
        if (text.includes('cream')) return 'cream';
        if (text.includes('drop')) return 'drops';
        if (text.includes('inhaler') || text.includes('inhalation') || text.includes('puff')) return 'inhaler';
        if (text.includes('patch')) return 'patch';
        if (text.includes('suppository') || text.includes('supp')) return 'suppository';
        if (text.includes('powder')) return 'powder';
        if (text.includes('solution') || text.includes('soln')) return 'solution';
        if (text.includes('lotion')) return 'lotion';
        if (text.includes('liquid')) return 'liquid';
        if (text.includes('granules')) return 'granules';
        if (text.includes('spray')) return 'spray';
        if (text.includes('enema')) return 'enema';
        if (text.includes('gel')) return 'gel';
        if (text.includes('aerosol')) return 'aerosol';
        return 'other';
      };

      const parseDate = (val: string): string | null => {
        if (!val) return null;
        const cleanVal = val.trim();
        if (!cleanVal || cleanVal === '-' || cleanVal === '—') return null;

        const lower = cleanVal.toLowerCase();
        if (lower.includes('kkm') || lower.includes('mal') || lower.includes('box') || lower.includes('vial') || lower.includes('pack') || lower.includes('unit') || lower.includes('tablet') || lower.includes('injection')) {
          return null;
        }

        // Match DD-MMM-YY or D-MMM-YY (e.g., 7-Oct-24, 6-Oct-27, 24-Jul-25)
        const dmyTextMatch = cleanVal.match(/^(\d{1,2})[-/]([a-zA-Z]{3})[-/](\d{2,4})$/);
        if (dmyTextMatch) {
          const day = parseInt(dmyTextMatch[1], 10);
          const monthStr = dmyTextMatch[2].toLowerCase();
          let year = parseInt(dmyTextMatch[3], 10);
          
          const months: Record<string, number> = {
            jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
            jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
          };
          
          const month = months[monthStr];
          if (day >= 1 && day <= 31 && month && !isNaN(year)) {
            if (year < 100) year += year > 50 ? 1900 : 2000;
            if (year >= 2000 && year <= 2100) {
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }

        // Match DD/MM/YYYY or YYYY-MM-DD
        const slashParts = cleanVal.split(/[\/\.-]/);
        if (slashParts.length === 3) {
          const p1 = parseInt(slashParts[0], 10);
          const p2 = parseInt(slashParts[1], 10);
          let p3 = parseInt(slashParts[2], 10);
          
          if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
            // YYYY-MM-DD
            if (p1 >= 2000 && p1 <= 2100 && p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
              return `${p1}-${String(p2).padStart(2, '0')}-${String(p3).padStart(2, '0')}`;
            }
            // DD/MM/YYYY
            if (p3 < 100) p3 += p3 > 50 ? 1900 : 2000;
            if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12 && p3 >= 2000 && p3 <= 2100) {
              return `${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
            }
          }
        }

        // Handle Excel Serial Dates (e.g. 45902, 36526 = Jan 1, 2000)
        if (!isNaN(Number(cleanVal)) && Number(cleanVal) >= 36526 && Number(cleanVal) < 80000) {
          const excelDate = new Date(Math.round((Number(cleanVal) - 25569) * 86400 * 1000));
          if (!isNaN(excelDate.getTime()) && excelDate.getFullYear() >= 2000) {
            return excelDate.toISOString().split('T')[0];
          }
        }

        return null;
      };

      const rows = parseCSV(csvText);

      // Dynamic header mapping for CC items
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const rowLower = rows[i].map(c => String(c || '').toLowerCase());
        if (rowLower.some(c => c.includes('mdc') || c.includes('nama') || c.includes('kontrak') || c.includes('pembekal') || c.includes('pembungkusan'))) {
          headerRowIdx = i;
          break;
        }
      }

      const headers = rows[headerRowIdx].map(h => String(h || '').trim().toLowerCase());

      const getColIdx = (keywords: string[], fallbackIdx: number): number => {
        const found = headers.findIndex(h => keywords.some(kw => h.includes(kw)));
        return found !== -1 ? found : fallbackIdx;
      };

      // 1. Smart Item Name Column Detection
      let itemNameIdx = getColIdx(['nama ubat', 'nama barangan', 'nama item', 'nama', 'perihalan', 'keterangan', 'description', 'item', 'ubat', 'product', 'spec'], -1);
      if (itemNameIdx === -1) {
        for (let c = 0; c < Math.min(rows[headerRowIdx + 1]?.length || 0, 15); c++) {
          const sampleCell = rows.slice(headerRowIdx + 1, headerRowIdx + 10).map(r => String(r[c] || '')).join(' ').toLowerCase();
          if (sampleCell.includes('injection') || sampleCell.includes('tablet') || sampleCell.includes('capsule') || sampleCell.includes('mg') || sampleCell.includes('solution') || sampleCell.includes('infusion')) {
            itemNameIdx = c;
            break;
          }
        }
      }
      if (itemNameIdx === -1) itemNameIdx = 8;

      // 2. Smart Date Columns Detection
      let contractMulaIdx = getColIdx(['kontrak mula', 'tarikh mula', 'tarikh bermula', 'mula kontrak', 'start date', 'contract start'], -1);
      let contractTamatIdx = getColIdx(['kontrak tamat', 'tarikh tamat', 'tamat kontrak', 'end date', 'contract end', 'luput', 'expir'], -1);

      if (contractMulaIdx === -1 || contractTamatIdx === -1) {
        const dateCols: number[] = [];
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        const colCount = Math.max(...sampleRows.map(r => r.length), 0);
        
        for (let c = 0; c < colCount; c++) {
          const hasDates = sampleRows.some(r => parseDate(String(r[c] || '')) !== null);
          if (hasDates) {
            dateCols.push(c);
          }
        }

        if (dateCols.length >= 3) {
          if (contractMulaIdx === -1) contractMulaIdx = dateCols[0];
          if (contractTamatIdx === -1) contractTamatIdx = dateCols[dateCols.length - 1];
        } else if (dateCols.length === 2) {
          if (contractMulaIdx === -1) contractMulaIdx = dateCols[0];
          if (contractTamatIdx === -1) contractTamatIdx = dateCols[1];
        } else if (dateCols.length === 1) {
          if (contractTamatIdx === -1) contractTamatIdx = dateCols[0];
        }
      }

      if (contractMulaIdx === -1) contractMulaIdx = 1;
      if (contractTamatIdx === -1) contractTamatIdx = 2;

      // 3. Smart Contract Number Detection
      let noKontrakIdx = getColIdx(['no. kontrak', 'no kontrak', 'kontrak kkm', 'warta', 'rujukan'], -1);
      if (noKontrakIdx === -1) {
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        for (let c = 0; c < 15; c++) {
          if (sampleRows.some(r => String(r[c] || '').includes('KKM-') || String(r[c] || '').includes('/202') || String(r[c] || '').includes('/F('))) {
            noKontrakIdx = c;
            break;
          }
        }
      }
      if (noKontrakIdx === -1) noKontrakIdx = 0;

      // 4. Smart MAL Number Detection
      let malNumberIdx = getColIdx(['mal', 'mda', 'pendaftaran'], -1);
      if (malNumberIdx === -1) {
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        for (let c = 0; c < 15; c++) {
          if (sampleRows.some(r => String(r[c] || '').toUpperCase().startsWith('MAL'))) {
            malNumberIdx = c;
            break;
          }
        }
      }
      if (malNumberIdx === -1) malNumberIdx = 7;

      let hargaIdx = getColIdx(['harga', 'price', 'kadar', 'rm', 'kos', 'unit price'], -1);
      if (hargaIdx === -1) {
        const sampleRows = rows.slice(headerRowIdx + 1, headerRowIdx + 10);
        for (let c = 0; c < 20; c++) {
          const validPriceCount = sampleRows.filter(r => {
            const val = String(r[c] || '').replace(/RM/gi, '').replace(/,/g, '').trim();
            const num = parseFloat(val);
            return !isNaN(num) && num > 0 && num < 100000 && !parseDate(val) && !val.includes('/') && !val.includes('KKM');
          }).length;
          if (validPriceCount >= 3) {
            hargaIdx = c;
            break;
          }
        }
      }
      if (hargaIdx === -1) hargaIdx = 10;

      const pembekalIdx = getColIdx(['pembekal', 'supplier', 'syarikat', 'vendor'], 14);
      const jenamaIdx = getColIdx(['jenama', 'brand', 'pengilang'], 15);
      const contractStatusIdx = getColIdx(['status kontrak', 'status pool', 'status'], 6);

      const dataRows = rows.slice(headerRowIdx + 1).filter(row => {
        const nameVal = row[itemNameIdx]?.trim() || '';
        return row.length > 2 && nameVal !== '' && !nameVal.toLowerCase().includes('nama ubat') && !nameVal.toLowerCase().includes('nama barangan') && !nameVal.toLowerCase().includes('nama item');
      });

      // Find Packaging Column (Column W = Index 22 is primary for CC Sheets)
      let packagingIdx = -1;
      const colWVal = dataRows.find(r => r[22] && r[22].trim() !== '')?.[22]?.trim() || '';
      if (colWVal && !colWVal.match(/^\d{1,4}\/\d{2,4}$/) && (
        colWVal.toLowerCase().includes('box') || 
        colWVal.toLowerCase().includes('pack') || 
        colWVal.toLowerCase().includes('vial') || 
        colWVal.toLowerCase().includes('unit') || 
        colWVal.includes("'s") || 
        colWVal.toLowerCase().includes('tablet') || 
        colWVal.toLowerCase().includes('bottle')
      )) {
        packagingIdx = 22;
      }

      if (packagingIdx === -1) {
        for (let i = headers.length - 1; i >= 0; i--) {
          const h = headers[i];
          if ((h.includes('pembungkusan') || h.includes('packaging') || h.includes('packing')) && !h.includes('warta') && !h.includes('rujukan')) {
            packagingIdx = i;
            break;
          }
        }
      }

      if (packagingIdx === -1) packagingIdx = 22; // Column W default

      // Fetch existing drugs for hospital to allow smart matching by drug_name, contract_number, or supplier_name
      const { data: existingDrugs } = await supabase
        .from('drugs')
        .select('id, drug_code, drug_name, cc_contract_number, cc_supplier_name')
        .eq('hospital_id', hospitalId);

      const drugMapByContract = new Map<string, { id: string; drug_code: string }>();
      const drugMapByName = new Map<string, { id: string; drug_code: string }>();
      const drugMapByCode = new Map<string, { id: string; drug_code: string }>();

      (existingDrugs || []).forEach(d => {
        const normName = (d.drug_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const normContract = (d.cc_contract_number || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const normSupplier = (d.cc_supplier_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normName && normContract) {
          drugMapByContract.set(`${normName}__${normContract}`, { id: d.id, drug_code: d.drug_code });
        }
        if (normName && normSupplier) {
          drugMapByContract.set(`${normName}__${normSupplier}`, { id: d.id, drug_code: d.drug_code });
        }
        if (normName && !drugMapByName.has(normName)) {
          drugMapByName.set(normName, { id: d.id, drug_code: d.drug_code });
        }
        if (d.drug_code) {
          drugMapByCode.set(d.drug_code.trim().toLowerCase(), { id: d.id, drug_code: d.drug_code });
        }
      });

      // Archive ALL pre-existing CC items (regardless of sheet_source)
      await supabase
        .from('drugs')
        .update({ procurement_vote: null })
        .eq('hospital_id', hospitalId)
        .eq('procurement_vote', 'cc');

      const drugUpserts = dataRows.map((row, idx) => {
        let mdc = row[mdcIdx]?.trim() || '';
        const itemName = row[itemNameIdx]?.trim() || '';
        const packaging = row[packagingIdx]?.trim() || '';
        const hargaRaw = row[hargaIdx]?.trim()?.replace(/RM/gi, '')?.replace(/,/g, '')?.trim() || '';
        const priceNum = hargaRaw && !isNaN(parseFloat(hargaRaw)) ? parseFloat(hargaRaw) : null;
        const noKontrak = row[noKontrakIdx]?.trim() || '';
        const contractMula = contractMulaIdx !== -1 ? parseDate(row[contractMulaIdx]) : null;
        const contractTamat = contractTamatIdx !== -1 ? parseDate(row[contractTamatIdx]) : null;
        const pembekal = row[pembekalIdx]?.trim() || '';
        const jenama = row[jenamaIdx]?.trim() || '';
        const contractStatus = row[contractStatusIdx]?.trim() || '';
        const malNumber = row[malNumberIdx]?.trim() || '';

        // Clean invalid or date-like MDC codes
        if (mdc && parseDate(mdc) !== null) {
          mdc = '';
        }

        const normItemName = itemName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const normContract = noKontrak.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const normSupplier = pembekal.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        const matched = (mdc ? drugMapByCode.get(mdc.toLowerCase()) : null)
          || (normContract ? drugMapByContract.get(`${normItemName}__${normContract}`) : null)
          || (normSupplier ? drugMapByContract.get(`${normItemName}__${normSupplier}`) : null)
          || drugMapByName.get(normItemName);

        let finalDrugCode = mdc;
        let existingId: string | undefined = undefined;

        if (matched) {
          finalDrugCode = matched.drug_code;
          existingId = matched.id;
        } else {
          const nameSlug = itemName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15).toUpperCase();
          finalDrugCode = `CC-${nameSlug || idx}-${idx}`;
        }

        const dosageForm = deriveDosageForm(itemName);

        return {
          ...(existingId ? { id: existingId } : {}),
          hospital_id: hospitalId,
          drug_code: finalDrugCode,
          drug_name: itemName,
          generic_name: itemName,
          dosage_form: dosageForm,
          unit_of_measure: packaging || 'unit',
          packaging_description: packaging || null,
          status: 'active',
          procurement_vote: 'cc',
          price: priceNum,
          mal_mda_number: malNumber || null,
          brand_name: jenama || null,
          cc_contract_number: noKontrak || null,
          cc_contract_start_date: contractMula,
          cc_contract_end_date: contractTamat,
          cc_contract_status: contractStatus || null,
          cc_supplier_name: pembekal || null,
          cc_brand_name: jenama || null,
          last_synced_from_sheet: new Date().toISOString(),
          sheet_source: 'Google Sheet CC - Manual Upload',
        };
      });

      // Deduplicate items by drug_code to prevent PostgreSQL ON CONFLICT error
      const uniqueMap = new Map<string, any>();
      drugUpserts.forEach((item, i) => {
        let code = item.drug_code;
        if (uniqueMap.has(code) && (
          uniqueMap.get(code).cc_contract_number !== item.cc_contract_number ||
          uniqueMap.get(code).cc_supplier_name !== item.cc_supplier_name ||
          uniqueMap.get(code).drug_name !== item.drug_name
        )) {
          code = `${code}-${i}`;
          item.drug_code = code;
          delete item.id;
        }
        uniqueMap.set(code, item);
      });
      const uniqueDrugUpserts = Array.from(uniqueMap.values());

      const CHUNK_SIZE = 50;
      for (let i = 0; i < uniqueDrugUpserts.length; i += CHUNK_SIZE) {
        const chunk = uniqueDrugUpserts.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
          .from('drugs')
          .upsert(chunk, { onConflict: 'hospital_id, drug_code' });
        if (error) throw error;
      }

      await supabase
        .from('cc_sync_logs')
        .insert({
          hospital_id: hospitalId,
          status: 'success',
          rows_fetched: dataRows.length,
          drugs_upserted: drugUpserts.length,
          triggered_by: 'manual_csv',
        });

      return {
        data: {
          total_rows_processed: dataRows.length,
          drugs_upserted: drugUpserts.length,
        },
        error: null,
      };
    }

    return {
      data: {
        total_rows_processed: 85,
        drugs_upserted: 85,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error importing CC CSV:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to import CC CSV',
    };
  }
}

/**
 * Move item from drugs table to non_drugs table
 */
export async function moveDrugToNonDrug(drugId: string, hospitalId: string): Promise<ApiResponse<{ id: string }>> {
  try {
    let drugItem: any = null
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('id', drugId)
        .single()
      if (!error && data) drugItem = data
    }

    if (!drugItem) {
      const found = mockDrugs.find((d: any) => d.id === drugId)
      if (found) drugItem = found
    }

    if (!drugItem) {
      return { data: null, error: 'Item ubat tidak dijumpai' }
    }

    const nonDrugPayload = {
      hospital_id: hospitalId,
      item_code: drugItem.drug_code,
      item_name: drugItem.drug_name,
      packaging_description: drugItem.packaging_description || null,
      unit_of_measure: drugItem.unit_of_measure || 'unit',
      price: drugItem.price || 0,
      supplier_id: drugItem.supplier_id || null,
      procurement_vote: drugItem.procurement_vote || 'cc',
      status: drugItem.status || 'active',
      sku: drugItem.sku || null,
      pku: drugItem.pku || null,
      min_stock_level: drugItem.min_stock_level || 0,
      max_stock_level: drugItem.max_stock_level || 0,
      reorder_level: drugItem.reorder_level || 0,
      cc_contract_number: drugItem.cc_contract_number || null,
      cc_contract_start_date: drugItem.cc_contract_start_date || null,
      cc_contract_end_date: drugItem.cc_contract_end_date || null,
      cc_contract_status: drugItem.cc_contract_status || null,
      cc_supplier_name: drugItem.cc_supplier_name || null,
      cc_brand_name: drugItem.cc_brand_name || null,
    }

    let newId = drugId
    if (isSupabaseConfigured()) {
      const { data: created, error: insertErr } = await supabase
        .from('non_drugs')
        .upsert([nonDrugPayload], { onConflict: 'hospital_id,item_code' })
        .select()
        .single()

      if (insertErr) throw insertErr
      newId = created.id
      await supabase.from('drugs').delete().eq('id', drugId)
    } else {
      const newObj = { ...nonDrugPayload, id: drugId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockNonDrugs.push(newObj)
      const idx = mockDrugs.findIndex((d: any) => d.id === drugId)
      if (idx !== -1) mockDrugs.splice(idx, 1)
    }

    return { data: { id: newId }, error: null }
  } catch (err: any) {
    console.error('Error moving drug to non-drug:', err)
    return { data: null, error: err?.message || 'Gagal memindahkan item ke Non-Drug' }
  }
}

/**
 * Move item from non_drugs table to drugs table
 */
export async function moveNonDrugToDrug(nonDrugId: string, hospitalId: string): Promise<ApiResponse<{ id: string }>> {
  try {
    let itemData: any = null
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('non_drugs')
        .select('*')
        .eq('id', nonDrugId)
        .single()
      if (!error && data) itemData = data
    }

    if (!itemData) {
      const found = mockNonDrugs.find((nd: any) => nd.id === nonDrugId)
      if (found) itemData = found
    }

    if (!itemData) {
      return { data: null, error: 'Item non-drug tidak dijumpai' }
    }

    const drugPayload = {
      hospital_id: hospitalId,
      drug_code: itemData.item_code,
      drug_name: itemData.item_name,
      generic_name: itemData.item_name,
      dosage_form: 'other',
      packaging_description: itemData.packaging_description || null,
      unit_of_measure: itemData.unit_of_measure || 'unit',
      price: itemData.price || 0,
      supplier_id: itemData.supplier_id || null,
      procurement_vote: itemData.procurement_vote || 'cc',
      status: itemData.status || 'active',
      sku: itemData.sku || null,
      pku: itemData.pku || null,
      min_stock_level: itemData.min_stock_level || 0,
      max_stock_level: itemData.max_stock_level || 0,
      reorder_level: itemData.reorder_level || 0,
      cc_contract_number: itemData.cc_contract_number || null,
      cc_contract_start_date: itemData.cc_contract_start_date || null,
      cc_contract_end_date: itemData.cc_contract_end_date || null,
      cc_contract_status: itemData.cc_contract_status || null,
      cc_supplier_name: itemData.cc_supplier_name || null,
      cc_brand_name: itemData.cc_brand_name || null,
    }

    let newId = nonDrugId
    if (isSupabaseConfigured()) {
      const { data: created, error: insertErr } = await supabase
        .from('drugs')
        .upsert([drugPayload], { onConflict: 'hospital_id,drug_code' })
        .select()
        .single()

      if (insertErr) throw insertErr
      newId = created.id
      await supabase.from('non_drugs').delete().eq('id', nonDrugId)
    } else {
      const newObj = { ...drugPayload, id: nonDrugId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockDrugs.push(newObj)
      const idx = mockNonDrugs.findIndex((nd: any) => nd.id === nonDrugId)
      if (idx !== -1) mockNonDrugs.splice(idx, 1)
    }

    return { data: { id: newId }, error: null }
  } catch (err: any) {
    console.error('Error moving non-drug to drug:', err)
    return { data: null, error: err?.message || 'Gagal memindahkan item ke Ubat' }
  }
}

// =====================================================
// UNIFIED DRUG & NON-DRUG CATALOG CRUD OPERATIONS
// =====================================================

function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

function sanitizeUuid(uuid: any): string | null {
  if (!uuid || typeof uuid !== 'string') return null
  return isValidUUID(uuid) ? uuid : null
}

function normalizeStatus(status: any): 'active' | 'inactive' {
  if (status === 'active' || status === 'inactive') return status
  return 'active'
}

function normalizeProcurementVote(vote: any): 'appl' | 'cc' | 'dp' | 'lp' {
  if (!vote || typeof vote !== 'string') return 'cc'
  const lower = vote.toLowerCase()
  if (lower === 'appl' || lower === 'cc' || lower === 'dp' || lower === 'lp') return lower
  return 'cc'
}

function normalizeDosageForm(form: any): string {
  const allowed = [
    'tablet', 'capsule', 'injection', 'syrup', 'suspension',
    'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository',
    'powder', 'solution', 'lotion', 'liquid', 'granules', 'spray',
    'enema', 'gel', 'aerosol', 'other'
  ]
  if (!form || typeof form !== 'string') return 'other'
  const lower = form.toLowerCase().trim()
  return allowed.includes(lower) ? lower : 'other'
}

export async function createDrug(
  hospitalId: string,
  drugData: Partial<Drug>
): Promise<ApiResponse<DrugWithRelations>> {
  try {
    const insertData: any = {
      hospital_id: hospitalId,
      drug_code: drugData.drug_code || `DRUG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      drug_name: drugData.drug_name || '',
      generic_name: drugData.generic_name || null,
      brand_name: drugData.brand_name || null,
      dosage_form: normalizeDosageForm(drugData.dosage_form),
      strength: drugData.strength || null,
      unit_of_measure: drugData.unit_of_measure || 'unit',
      category_id: sanitizeUuid(drugData.category_id),
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
      supplier_id: sanitizeUuid(drugData.supplier_id),
      procurement_vote: normalizeProcurementVote(drugData.procurement_vote),
      price: drugData.price || null,
      packaging_description: (drugData as any).packaging_description || null,
      item_sub_class: (drugData as any).item_sub_class || null,
    }

    const normalizedInputName = (drugData.drug_name || '').trim().toLowerCase()

    if (isSupabaseConfigured()) {
      if (normalizedInputName) {
        const { data: existingDrugs } = await supabase
          .from('drugs')
          .select('id, drug_name, drug_code, sku')
          .eq('hospital_id', hospitalId)
          .ilike('drug_name', (drugData.drug_name || '').trim())
        
        if (existingDrugs && existingDrugs.length > 0) {
          const matched = existingDrugs[0]
          return {
            data: null,
            error: `Item "${matched.drug_name}" (Code: ${matched.drug_code || matched.sku || 'N/A'}) already exists in the system. Creation of duplicate items is disabled to preserve stock ledger integrity. Please edit the existing item to update its SKIM / Item Code instead.`,
          }
        }
      }

      const { data, error } = await supabase
        .from('drugs')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return { data: data as DrugWithRelations, error: null }
    }

    if (normalizedInputName) {
      const matched = mockDrugs.find(
        d => (d.hospital_id === hospitalId || !d.hospital_id) && (d.drug_name || '').trim().toLowerCase() === normalizedInputName
      )
      if (matched) {
        return {
          data: null,
          error: `Item "${matched.drug_name}" (Code: ${matched.drug_code || matched.sku || 'N/A'}) already exists in the system. Creation of duplicate items is disabled to preserve stock ledger integrity. Please edit the existing item to update its SKIM / Item Code instead.`,
        }
      }
    }

    const newId = `drug-${Date.now()}`
    const newDrug: DrugWithRelations = {
      id: newId,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockDrugs.push(newDrug)
    return { data: newDrug, error: null }
  } catch (error) {
    console.error('Error creating drug in inventoryService:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create drug' }
  }
}

export async function updateDrug(
  drugId: string,
  drugData: Partial<Drug>
): Promise<ApiResponse<DrugWithRelations>> {
  try {
    const normVote = drugData.procurement_vote ? normalizeProcurementVote(drugData.procurement_vote) : undefined
    const updateData: any = {
      ...drugData,
      dosage_form: drugData.dosage_form ? normalizeDosageForm(drugData.dosage_form) : undefined,
      status: drugData.status ? normalizeStatus(drugData.status) : undefined,
      procurement_vote: normVote,
      category_id: drugData.category_id !== undefined ? sanitizeUuid(drugData.category_id) : undefined,
      supplier_id: drugData.supplier_id !== undefined ? sanitizeUuid(drugData.supplier_id) : undefined,
    }
    if (normVote) {
      if (normVote === 'appl') updateData.sheet_source = 'Lampiran B'
      else if (normVote === 'cc') updateData.sheet_source = 'Google Sheet CC'
      else if (normVote === 'lp') updateData.sheet_source = 'Google Sheet LP'
      else if (normVote === 'dp') updateData.sheet_source = 'DP'
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('drugs')
        .update(updateData)
        .eq('id', drugId)
        .select()
        .single()

      if (error) throw error
      return { data: data as DrugWithRelations, error: null }
    }

    const idx = mockDrugs.findIndex(d => d.id === drugId)
    if (idx !== -1) {
      mockDrugs[idx] = { ...mockDrugs[idx], ...updateData, updated_at: new Date().toISOString() }
      return { data: mockDrugs[idx], error: null }
    }
    return { data: null, error: 'Drug not found' }
  } catch (error) {
    console.error('Error updating drug in inventoryService:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update drug' }
  }
}

export async function deleteDrug(drugId: string): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('drugs').delete().eq('id', drugId)
      if (error) throw error
    } else {
      const idx = mockDrugs.findIndex(d => d.id === drugId)
      if (idx !== -1) mockDrugs.splice(idx, 1)
    }
    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error deleting drug in inventoryService:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete drug' }
  }
}

export async function batchUpdateDrugStatus(
  drugIds: string[],
  status: 'active' | 'inactive'
): Promise<ApiResponse<{ successCount: number }>> {
  try {
    if (!drugIds || drugIds.length === 0) return { data: { successCount: 0 }, error: null }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('drugs')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', drugIds)

      if (error) throw error
      return { data: { successCount: drugIds.length }, error: null }
    }

    let count = 0
    mockDrugs.forEach(d => {
      if (drugIds.includes(d.id)) {
        d.status = status
        count++
      }
    })
    return { data: { successCount: count }, error: null }
  } catch (error) {
    console.error('Error in batchUpdateDrugStatus:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to batch update drug status' }
  }
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
      category_id: sanitizeUuid(nonDrugData.category_id),
      unit_of_measure: nonDrugData.unit_of_measure || 'unit',
      min_stock_level: nonDrugData.min_stock_level || 0,
      max_stock_level: nonDrugData.max_stock_level || null,
      reorder_level: nonDrugData.reorder_level || null,
      status: normalizeStatus(nonDrugData.status),
      sku: nonDrugData.sku || null,
      pku: nonDrugData.pku || null,
      supplier_id: sanitizeUuid(nonDrugData.supplier_id),
      procurement_vote: normalizeProcurementVote(nonDrugData.procurement_vote),
      price: nonDrugData.price || null,
      packaging_description: (nonDrugData as any).packaging_description || null,
    }

    const normalizedInputName = (nonDrugData.item_name || '').trim().toLowerCase()

    if (isSupabaseConfigured()) {
      if (normalizedInputName) {
        const { data: existingItems } = await supabase
          .from('non_drugs')
          .select('id, item_name, item_code, sku')
          .eq('hospital_id', hospitalId)
          .ilike('item_name', (nonDrugData.item_name || '').trim())

        if (existingItems && existingItems.length > 0) {
          const matched = existingItems[0]
          return {
            data: null,
            error: `Item "${matched.item_name}" (Code: ${matched.item_code || matched.sku || 'N/A'}) already exists in the system. Creation of duplicate items is disabled to preserve stock ledger integrity. Please edit the existing item to update its SKIM / Item Code instead.`,
          }
        }
      }

      const { data, error } = await supabase
        .from('non_drugs')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return { data: data as NonDrugWithRelations, error: null }
    }

    if (normalizedInputName) {
      const matched = mockNonDrugs.find(
        nd => (nd.hospital_id === hospitalId || !nd.hospital_id) && (nd.item_name || '').trim().toLowerCase() === normalizedInputName
      )
      if (matched) {
        return {
          data: null,
          error: `Item "${matched.item_name}" (Code: ${matched.item_code || matched.sku || 'N/A'}) already exists in the system. Creation of duplicate items is disabled to preserve stock ledger integrity. Please edit the existing item to update its SKIM / Item Code instead.`,
        }
      }
    }

    const newId = `nd-${Date.now()}`
    const newNonDrug: NonDrugWithRelations = {
      id: newId,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockNonDrugs.push(newNonDrug)
    return { data: newNonDrug, error: null }
  } catch (error) {
    console.error('Error creating non-drug in inventoryService:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create non-drug' }
  }
}

export async function updateNonDrug(
  nonDrugId: string,
  nonDrugData: Partial<NonDrug>
): Promise<ApiResponse<NonDrugWithRelations>> {
  try {
    const normVote = nonDrugData.procurement_vote ? normalizeProcurementVote(nonDrugData.procurement_vote) : undefined
    const updateData: any = {
      ...nonDrugData,
      status: nonDrugData.status ? normalizeStatus(nonDrugData.status) : undefined,
      procurement_vote: normVote,
      category_id: nonDrugData.category_id !== undefined ? sanitizeUuid(nonDrugData.category_id) : undefined,
      supplier_id: nonDrugData.supplier_id !== undefined ? sanitizeUuid(nonDrugData.supplier_id) : undefined,
    }
    if (normVote) {
      if (normVote === 'appl') updateData.sheet_source = 'Lampiran B'
      else if (normVote === 'cc') updateData.sheet_source = 'Google Sheet CC'
      else if (normVote === 'lp') updateData.sheet_source = 'Google Sheet LP'
      else if (normVote === 'dp') updateData.sheet_source = 'DP'
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('non_drugs')
        .update(updateData)
        .eq('id', nonDrugId)
        .select()
        .single()

      if (error) throw error
      return { data: data as NonDrugWithRelations, error: null }
    }

    const idx = mockNonDrugs.findIndex(nd => nd.id === nonDrugId)
    if (idx !== -1) {
      mockNonDrugs[idx] = { ...mockNonDrugs[idx], ...updateData, updated_at: new Date().toISOString() }
      return { data: mockNonDrugs[idx], error: null }
    }
    return { data: null, error: 'Non-drug not found' }
  } catch (error) {
    console.error('Error updating non-drug in inventoryService:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update non-drug' }
  }
}

export async function deleteNonDrug(nonDrugId: string): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('non_drugs').delete().eq('id', nonDrugId)
      if (error) throw error
    } else {
      const idx = mockNonDrugs.findIndex(nd => nd.id === nonDrugId)
      if (idx !== -1) mockNonDrugs.splice(idx, 1)
    }
    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error deleting non-drug in inventoryService:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete non-drug' }
  }
}

export async function batchUpdateNonDrugStatus(
  nonDrugIds: string[],
  status: 'active' | 'inactive'
): Promise<ApiResponse<{ successCount: number }>> {
  try {
    if (!nonDrugIds || nonDrugIds.length === 0) return { data: { successCount: 0 }, error: null }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('non_drugs')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', nonDrugIds)

      if (error) throw error
      return { data: { successCount: nonDrugIds.length }, error: null }
    }

    let count = 0
    mockNonDrugs.forEach(nd => {
      if (nonDrugIds.includes(nd.id)) {
        nd.status = status
        count++
      }
    })
    return { data: { successCount: count }, error: null }
  } catch (error) {
    console.error('Error in batchUpdateNonDrugStatus:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to batch update non-drug status' }
  }
}

/**
 * Clear stock transaction history, batches, and reset stock balances to zero.
 * If itemId is provided, resets for that specific item only.
 * If itemId is undefined or 'all', resets for all items in the hospital inventory.
 */
export async function clearStockTransactions(
  hospitalId: string,
  itemId?: string
): Promise<ApiResponse<{ deletedTransactionsCount: number }>> {
  try {
    const isSpecificItem = itemId && itemId !== 'all'
    let deletedCount = 0

    if (isSupabaseConfigured()) {
      if (isSpecificItem) {
        // Delete transactions for specific item (try item_id first, then fallback queries)
        const { count: c1 } = await supabase
          .from('pharmacy_stock_transactions')
          .delete({ count: 'exact' })
          .eq('item_id', itemId)
        
        deletedCount = c1 || 0

        // Delete batches for specific item
        await supabase
          .from('pharmacy_stock_batches')
          .delete()
          .eq('item_id', itemId)

        // Reset current stock counts
        await supabase.from('facility_drug_inventory').update({ facility_stock: 0, updated_at: new Date().toISOString() }).eq('drug_id', itemId)
        await supabase.from('facility_non_drug_inventory').update({ facility_stock: 0, updated_at: new Date().toISOString() }).eq('nondrug_id', itemId)
      } else {
        // Delete ALL stock transactions in the database unconditionally
        const { count: cAll } = await supabase
          .from('pharmacy_stock_transactions')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000')

        deletedCount = cAll || 0

        // Delete ALL stock batches in the database unconditionally
        await supabase
          .from('pharmacy_stock_batches')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        // Reset current stock counts for all items
        await supabase.from('facility_drug_inventory').update({ facility_stock: 0, updated_at: new Date().toISOString() }).neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('facility_non_drug_inventory').update({ facility_stock: 0, updated_at: new Date().toISOString() }).neq('id', '00000000-0000-0000-0000-000000000000')
      }
    }

    // 4. Reset in-memory mock stock values & localStorage caches if any
    mockDrugs.forEach(d => {
      if (!isSpecificItem || d.id === itemId) {
        d.current_stock = 0
        d.stock_status = 'out_of_stock'
      }
    })
    mockNonDrugs.forEach(n => {
      if (!isSpecificItem || n.id === itemId) {
        n.current_stock = 0
        n.stock_status = 'out_of_stock'
      }
    })

    // Also update localStorage facility cache if present
    try {
      const drugCacheKey = `facility_drug_items_${hospitalId}`
      const rawDrug = localStorage.getItem(drugCacheKey)
      if (rawDrug) {
        const cached = JSON.parse(rawDrug)
        if (Array.isArray(cached)) {
          const updated = cached.map((c: any) => {
            if (!isSpecificItem || c.id === itemId || c.drug_id === itemId) {
              return { ...c, facility_stock: 0 }
            }
            return c
          })
          localStorage.setItem(drugCacheKey, JSON.stringify(updated))
        }
      }

      const nonDrugCacheKey = `facility_non_drug_items_${hospitalId}`
      const rawNonDrug = localStorage.getItem(nonDrugCacheKey)
      if (rawNonDrug) {
        const cached = JSON.parse(rawNonDrug)
        if (Array.isArray(cached)) {
          const updated = cached.map((c: any) => {
            if (!isSpecificItem || c.id === itemId || c.nondrug_id === itemId) {
              return { ...c, facility_stock: 0 }
            }
            return c
          })
          localStorage.setItem(nonDrugCacheKey, JSON.stringify(updated))
        }
      }
    } catch (e) {
      console.warn('Error clearing local cache:', e)
    }

    return { data: { deletedTransactionsCount: deletedCount }, error: null }
  } catch (error) {
    console.error('Error clearing stock transactions:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to clear stock transactions' }
  }
}






