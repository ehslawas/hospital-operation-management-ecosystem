/**
 * Pharmacy Inventory Service
 * Handles drug and non-drug inventory management
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {

  DrugCategory,
  NonDrugWithRelations,
  NonDrugCategory,
  StockBatchWithRelations,
  StockTransaction,
  InventoryFilter,
  StockLocation,
  StockLocationItem,
  StockLocationItemWithRelations,
  ExpiryItem,
  SlowMovingItem,
  StockLevelSummary,
  InventoryStats,
} from '@/types/pharmacy'

// =====================================================
// DRUG MANAGEMENT
// =====================================================

/**
 * Get inventory statistics
 */
export async function getInventoryStats(hospitalId: string, itemType: 'drug' | 'non_drug' = 'drug'): Promise<ApiResponse<InventoryStats>> {
  try {
    // 1. Get all active catalog items (just IDs to count and check stock)
    const { data: items, error: itemError } = await supabase
      .from('pharmacy_unit_catalog_items')
      .select('id, item_type')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .eq('item_type', itemType)

    if (itemError) throw itemError
    if (!items) return { data: { totalItems: 0, outOfStock: 0, expiringSoon: 0, totalValue: 0 }, error: null }

    const totalItems = items.length

    // 2. Get all batches to calculate value and check stock/expiry
    // We fetch ALL batches for this hospital and item type.
    const { data: batches, error: batchError } = await supabase
      .from('pharmacy_stock_batches')
      .select('item_id, quantity_on_hand, unit_cost, expiry_date')
      .eq('hospital_id', hospitalId)
      .eq('item_type', itemType)
      .gt('quantity_on_hand', 0) // Only count value of active stock

    if (batchError) throw batchError

    // Calculate Stats
    let totalValue = 0
    let expiringSoon = 0
    const now = new Date()
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

    // Map to track which items have stock
    const itemStockMap = new Set<string>()

    batches?.forEach(batch => {
      // Value
      const qty = batch.quantity_on_hand || 0
      const price = batch.unit_cost || 0
      totalValue += (qty * price)

      // Expiry
      if (batch.expiry_date) {
        const expDate = new Date(batch.expiry_date)
        if (expDate <= ninetyDaysFromNow && expDate >= now) {
          expiringSoon++
        }
      }

      // Stock tracking
      if (batch.item_id) {
        itemStockMap.add(batch.item_id)
      }
    })

    // For "Out of Stock", we need to check which active catalog items have NO matching batches in the set.
    const selectFields = itemType === 'drug'
      ? 'drug_id, appl_drug_id, lp_drug_id, contract_id'
      : 'non_drug_id, appl_non_drug_id, lp_non_drug_id, contract_id'

    const { data: itemsWithIds } = await supabase
      .from('pharmacy_unit_catalog_items')
      .select(selectFields)
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .eq('item_type', itemType)

    let outOfStock = 0
    itemsWithIds?.forEach(item => {
      const sourceId = itemType === 'drug'
        ? (item.drug_id || item.appl_drug_id || item.lp_drug_id || item.contract_id)
        : (item.non_drug_id || item.appl_non_drug_id || item.lp_non_drug_id || item.contract_id)

      if (sourceId && !itemStockMap.has(sourceId)) {
        outOfStock++
      }
    })

    return {
      data: {
        totalItems,
        outOfStock,
        expiringSoon,
        totalValue
      },
      error: null
    }

  } catch (error) {
    console.error('Error fetching inventory stats:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed stats'
    }
  }
}




/**
 * Get single drug by ID
 */


/**
 * Get drug categories
 */
export async function getDrugCategories(hospitalId?: string): Promise<ApiResponse<DrugCategory[]>> {
  try {
    let query = supabase
      .from('drug_categories')
      .select('*')
      .order('category_name', { ascending: true })

    if (hospitalId) {
      query = query.or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
    }

    const { data, error } = await query

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

    const { data: batches, error } = await query.order('expiry_date', { ascending: true })

    if (error) throw error

    // Manually fetch related items because of polymorphic "item_id" without FK
    if (!batches || batches.length === 0) {
      return { data: [], error: null }
    }

    const drugIds = batches
      .filter((b) => b.item_type === 'drug')
      .map((b) => b.item_id)
      .filter((id): id is string => !!id)

    const nonDrugIds = batches
      .filter((b) => b.item_type === 'non_drug')
      .map((b) => b.item_id)
      .filter((id): id is string => !!id)

    // Fetch Drugs
    let drugsMap: Record<string, any> = {}
    if (drugIds.length > 0) {
      const { data: drugs } = await supabase
        .from('drugs')
        .select('*')
        .in('id', drugIds)

      if (drugs) {
        drugsMap = drugs.reduce((acc, drug) => {
          acc[drug.id] = drug
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Fetch Non-Drugs
    let nonDrugsMap: Record<string, any> = {}
    if (nonDrugIds.length > 0) {
      const { data: nonDrugs } = await supabase
        .from('non_drugs')
        .select('*')
        .in('id', nonDrugIds)

      if (nonDrugs) {
        nonDrugsMap = nonDrugs.reduce((acc, item) => {
          acc[item.id] = item
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Attach relations
    const populatedBatches = batches.map((batch) => ({
      ...batch,
      drug: batch.item_type === 'drug' ? drugsMap[batch.item_id] : undefined,
      non_drug: batch.item_type === 'non_drug' ? nonDrugsMap[batch.item_id] : undefined,
    }))

    return { data: populatedBatches as StockBatchWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching batches:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch batches',
    }
  }
}

/**
 * Get inventory with Unit Catalog as the backbone.
 * Lists ALL Active items from the catalog.
 * If stock exists, shows batch details.
 * If no stock, shows placeholder with 0 quantity.
 */
export async function getInventoryWithCatalogBackbone(
  hospitalId: string,
  filter?: {
    search?: string
    item_type?: 'drug' | 'non_drug' | 'all'
    status?: string // 'active', 'out_of_stock'
    location_id?: string
    page?: number
    pageSize?: number
  }
): Promise<ApiResponse<StockBatchWithRelations[]>> {
  try {
    // 1. Get Active Catalogs for this Hospital
    // We assume we want items from all active catalogs, or we could restrict to a specific module if needed.
    const { data: catalogs, error: catalogError } = await supabase
      .from('pharmacy_unit_catalog')
      .select('id')
      .eq('hospital_id', hospitalId)
      .eq('status', 'active')

    if (catalogError) throw catalogError

    if (!catalogs || catalogs.length === 0) {
      return { data: [], error: null }
    }

    const catalogIds = catalogs.map((c) => c.id)

    // 2. Fetch Active Catalog Items
    let itemQuery = supabase
      .from('pharmacy_unit_catalog_items')
      .select(`
        *,
        drug:drugs(*, category:drug_categories!category_id(*), therapeutic_class:drug_categories!therapeutic_class_id(*)),
        non_drug:non_drugs(*),
        appl_drug:appl_drugs(*),
        lp_drug:lp_drugs(*),
        appl_non_drug:appl_non_drugs(*),
        lp_non_drug:lp_non_drugs(*),
        contract:contracts(*),
        unit_category:drug_categories!category_id(*),
        unit_therapeutic_class:drug_categories!therapeutic_class_id(*)
      `, { count: 'exact' })
      .in('catalog_id', catalogIds)
      .eq('is_active', true) // Only active items

    if (filter?.item_type && filter.item_type !== 'all') {
      itemQuery = itemQuery.eq('item_type', filter.item_type)
    }

    // SERVER-SIDE SEARCH
    if (filter?.search) {
      const term = `%${filter.search}%`

      // We need to find IDs from multiple tables that match the search term
      // and then filter catalog items where drug_id IN (...) OR appl_drug_id IN (...) etc.
      // For performance/simplicity in this complex mapping, we'll use a broad .or filter
      // Note: mapping joins into a single .or in Supabase is limited.
      // A more robust way is to fetch the matched IDs first if there are many tables.

      const searchTasks = [
        supabase.from('drugs').select('id').or(`drug_name.ilike.${term},drug_code.ilike.${term}`),
        supabase.from('appl_drugs').select('id').or(`item_name.ilike.${term},item_code.ilike.${term}`),
        supabase.from('lp_drugs').select('id').or(`item_name.ilike.${term},item_code.ilike.${term}`),
        supabase.from('contracts').select('id').or(`item_name.ilike.${term},item_code.ilike.${term}`)
      ]

      const searchResults = await Promise.all(searchTasks)
      const matchedDrugIds = searchResults[0].data?.map(i => i.id) || []
      const matchedApplIds = searchResults[1].data?.map(i => i.id) || []
      const matchedLpIds = searchResults[2].data?.map(i => i.id) || []
      const matchedContractIds = searchResults[3].data?.map(i => i.id) || []

      // If no matches found in any table, we still need to apply the filter so it returns empty
      const orFilter = [
        matchedDrugIds.length > 0 ? `drug_id.in.(${matchedDrugIds.join(',')})` : 'drug_id.is.null',
        matchedApplIds.length > 0 ? `appl_drug_id.in.(${matchedApplIds.join(',')})` : 'appl_drug_id.is.null',
        matchedLpIds.length > 0 ? `lp_drug_id.in.(${matchedLpIds.join(',')})` : 'lp_drug_id.is.null',
        matchedContractIds.length > 0 ? `contract_id.in.(${matchedContractIds.join(',')})` : 'contract_id.is.null'
      ].join(',')

      itemQuery = itemQuery.or(orFilter)
    }

    // Pagination
    if (filter?.page !== undefined && filter?.pageSize !== undefined) {
      const from = (filter.page - 1) * filter.pageSize
      const to = from + filter.pageSize - 1
      itemQuery = itemQuery.range(from, to)
    }

    const { data: catalogItems, error: itemError, count } = await itemQuery

    if (itemError) throw itemError

    if (!catalogItems || catalogItems.length === 0) {
      return { data: [], error: null, count: 0 }
    }



    // 3. Fetch Stock Batches
    // We fetch ALL batches for this hospital to ensure we match correctly
    let batchQuery = supabase
      .from('pharmacy_stock_batches')
      .select(`
        *,
        location:pharmacy_stock_locations (*)
      `)
      .eq('hospital_id', hospitalId)
    // We process status filtering in memory for complex cases (like 'out_of_stock' which is virtual)
    // but if user asks for specific batch status, we could filter here, BUT we need to be careful not to exclude the "ghost" items if they are "out of stock"

    if (filter?.location_id) {
      batchQuery = batchQuery.eq('location_id', filter.location_id)
    }

    const { data: batches, error: batchError } = await batchQuery.order('expiry_date', { ascending: true })

    if (batchError) throw batchError

    // 4. Merge Logic
    // Map: ItemID -> Batches[]
    const batchesMap: Record<string, typeof batches> = {}
    batches?.forEach((b) => {
      const key = `${b.item_type}_${b.item_id}`
      if (!batchesMap[key]) batchesMap[key] = []
      batchesMap[key].push(b)
    })

    const result: StockBatchWithRelations[] = []

    const normalizeJoin = (val: any) => Array.isArray(val) ? val[0] : val

    catalogItems.forEach((item) => {
      const drug = normalizeJoin(item.drug)
      const non_drug = normalizeJoin(item.non_drug)
      const appl_drug = normalizeJoin(item.appl_drug)
      const lp_drug = normalizeJoin(item.lp_drug)
      const appl_non_drug = normalizeJoin(item.appl_non_drug)
      const lp_non_drug = normalizeJoin(item.lp_non_drug)
      const contract = normalizeJoin(item.contract)

      // Exhaustive resolution: check every possible relationship
      const sourceData = drug || appl_drug || lp_drug || contract || non_drug || appl_non_drug || lp_non_drug

      const itemId = item.item_type === 'drug'
        ? (item.drug_id || item.appl_drug_id || item.lp_drug_id || item.contract_id)
        : (item.non_drug_id || item.appl_non_drug_id || item.lp_non_drug_id)

      const key = `${item.item_type}_${itemId}`
      const itemBatches = batchesMap[key] || []
      const currentStock = itemBatches.reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0)

      // Minimal Normalization: Just ensure Name and Code are present for the UI
      const resolvedItem = {
        ...(drug || non_drug || sourceData || {}),
        drug_name: drug?.drug_name || sourceData?.item_name || 'Unknown Item',
        drug_code: drug?.drug_code || sourceData?.item_code || '-',
        generic_name: drug?.generic_name || (sourceData as any)?.generic_name || '',
        packaging_description: drug?.packaging_description || (sourceData as any)?.packaging_description || (sourceData as any)?.unit || '-',
        category: drug?.category || normalizeJoin(item.unit_category) || (sourceData as any)?.category || null,
        therapeutic_class: drug?.therapeutic_class || normalizeJoin(item.unit_therapeutic_class) || (sourceData as any)?.therapeutic_class || null,
        min_stock_level: item.min_limit || 0,
        max_stock_level: item.max_limit || 0,
        current_stock: currentStock,
      } as any

      // Name filtering (naive client-side optimization)
      if (filter?.search) {
        const search = filter.search.toLowerCase()
        const name = item.item_type === 'drug' ? drug?.drug_name : non_drug?.item_name
        const code = item.item_type === 'drug' ? drug?.drug_code : non_drug?.item_code
        if (!name?.toLowerCase().includes(search) && !code?.toLowerCase().includes(search)) {
          return // Skip this item
        }
      }


      if (itemBatches.length > 0) {
        // Add all batches
        itemBatches.forEach((batch) => {
          result.push({
            ...batch,
            drug: item.item_type === 'drug' ? resolvedItem : null,
            non_drug: item.item_type === 'non_drug' ? resolvedItem : null,
            unit_catalog_item: item,
          } as StockBatchWithRelations)
        })
      } else {
        // NO STOCK -> Create Placeholder
        const shouldShowZeroStock = !filter?.status || filter.status === 'out_of_stock' || filter.status === 'all'

        if (shouldShowZeroStock) {
          result.push({
            id: `virtual_${item.id}`,
            hospital_id: hospitalId,
            item_id: itemId,
            item_type: item.item_type,
            batch_number: '-',
            expiry_date: null,
            quantity_received: 0,
            quantity_on_hand: 0,
            quantity_reserved: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            drug: item.item_type === 'drug' ? resolvedItem : null,
            non_drug: item.item_type === 'non_drug' ? resolvedItem : null,
            unit_catalog_item: item,
            location: undefined,
          } as unknown as StockBatchWithRelations)
        }
      }
    })

    return { data: result, error: null, count: count ?? result.length }
  } catch (error) {
    console.error('Error in catalog backbone inventory:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory',
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
  _hospitalId: string,
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
  _hospitalId: string
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
  _hospitalId: string,
  _daysSinceMovement: number = 90
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
  _hospitalId: string,
  _filter?: InventoryFilter
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

export async function createStockLocation(
  location: Omit<StockLocation, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<StockLocation>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_locations')
      .insert(location)
      .select()
      .single()

    if (error) throw error

    return { data: data as StockLocation, error: null }
  } catch (error) {
    console.error('Error creating stock location:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create stock location',
    }
  }
}

export async function updateStockLocation(
  id: string,
  updates: Partial<Omit<StockLocation, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<StockLocation>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data: data as StockLocation, error: null }
  } catch (error) {
    console.error('Error updating stock location:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update stock location',
    }
  }
}

export async function getStockLocation(
  id: string
): Promise<ApiResponse<StockLocation>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_locations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data: data as StockLocation, error: null }
  } catch (error) {
    console.error('Error fetching stock location:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stock location',
    }
  }
}

// =====================================================
// STOCK LOCATION ITEMS
// =====================================================

export async function getLocationItems(
  locationId: string
): Promise<ApiResponse<StockLocationItemWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_location_items')
      .select(`
        *,
        unit_catalog_item:pharmacy_unit_catalog_items (
          *,
          drug:drugs (*),
          non_drug:non_drugs (*),
          appl_drug:appl_drugs (*),
          lp_drug:lp_drugs (*),
          contract:contracts (*),
          category:drug_categories!category_id(*),
          therapeutic_class:drug_categories!therapeutic_class_id(*)
        )
      `)
      .eq('location_id', locationId)

    if (error) throw error

    const normalizeJoin = (val: any) => Array.isArray(val) ? val[0] : val
    const normalizedData = (data as any[]).map(row => ({
      ...row,
      unit_catalog_item: {
        ...normalizeJoin(row.unit_catalog_item),
        drug: normalizeJoin(row.unit_catalog_item?.drug),
        non_drug: normalizeJoin(row.unit_catalog_item?.non_drug),
        appl_drug: normalizeJoin(row.unit_catalog_item?.appl_drug),
        lp_drug: normalizeJoin(row.unit_catalog_item?.lp_drug),
        contract: normalizeJoin(row.unit_catalog_item?.contract),
        category: normalizeJoin(row.unit_catalog_item?.category),
        therapeutic_class: normalizeJoin(row.unit_catalog_item?.therapeutic_class)
      }
    }))

    return { data: normalizedData as StockLocationItemWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching location items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch location items',
    }
  }
}

export async function addItemsToLocation(
  locationId: string,
  catalogItemIds: string[]
): Promise<ApiResponse<StockLocationItem[]>> {
  try {
    const items = catalogItemIds.map((itemId) => ({
      location_id: locationId,
      unit_catalog_item_id: itemId,
      min_stock: 0,
      max_stock: 0,
    }))

    const { data, error } = await supabase
      .from('pharmacy_location_items')
      .insert(items)
      .select()

    if (error) throw error

    return { data: data as StockLocationItem[], error: null }
  } catch (error) {
    console.error('Error adding items to location:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add items to location',
    }
  }
}

export async function removeLocationItem(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.from('pharmacy_location_items').delete().eq('id', id)

    if (error) throw error

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error removing location item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to remove location item',
    }
  }
}

export async function updateLocationItem(
  id: string,
  updates: Partial<Omit<StockLocationItem, 'id' | 'location_id' | 'unit_catalog_item_id'>>
): Promise<ApiResponse<StockLocationItem>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_location_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data: data as StockLocationItem, error: null }
  } catch (error) {
    console.error('Error updating location item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update location item',
    }
  }
}

/**
 * Get assigned locations for a specific unit catalog item
 */
export async function getItemAssignedLocations(
  catalogItemId: string
): Promise<ApiResponse<StockLocationItemWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_location_items')
      .select(`
        *,
        location:pharmacy_stock_locations (*)
      `)
      .eq('unit_catalog_item_id', catalogItemId)

    if (error) throw error
    return { data: data as StockLocationItemWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching item assigned locations:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch assigned locations',
    }
  }
}

// =====================================================
// ITEM DETAILS & HISTORY
// =====================================================

/**
 * Get stock transactions for an item over a period of time
 */
export async function getItemTransactions(
  ids: string[],
  itemType: 'drug' | 'non_drug',
  months: number = 6
): Promise<ApiResponse<StockTransaction[]>> {
  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Filter out empty/null IDs
    const validIds = ids.filter(Boolean)

    if (validIds.length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('pharmacy_stock_transactions')
      .select('*')
      .in('item_id', validIds)
      .eq('item_type', itemType)
      .gte('transaction_date', startDate.toISOString())
      .order('transaction_date', { ascending: true })

    if (error) throw error
    return { data: (data || []) as StockTransaction[], error: null }
  } catch (error) {
    console.error('Error fetching item transactions:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    }
  }
}

/**
 * Get active stock locations and quantities for an item
 */
export async function getItemStockLocations(
  ids: string[],
  itemType: 'drug' | 'non_drug'
): Promise<ApiResponse<StockBatchWithRelations[]>> {
  try {
    // Filter out empty/null IDs
    const validIds = ids.filter(Boolean)

    if (validIds.length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('pharmacy_stock_batches')
      .select(`
        *,
        location:pharmacy_stock_locations (*)
      `)
      .in('item_id', validIds)
      .eq('item_type', itemType)
      .gt('quantity_on_hand', 0)
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return { data: (data || []) as StockBatchWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching item locations:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch locations',
    }
  }
}
