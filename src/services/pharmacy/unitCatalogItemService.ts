/**
 * Unit Catalog Items Service
 * Handles management of individual drugs and non-drugs that each unit can indent
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  UnitCatalogItem,
  UnitCatalogItemWithRelations,
  UnitCatalogItemFormData,
  CatalogItemType,
} from '@/types/pharmacy'

/**
 * Extract item name from a catalog item with relations
 */
function getItemName(item: UnitCatalogItemWithRelations): string | null {
  if (item.item_type === 'drug') {
    return (
      item.drug?.drug_name ||
      item.appl_drug?.item_name ||
      item.lp_drug?.item_name ||
      item.contract?.item_name ||
      null
    )
  }
  return (
    item.non_drug?.item_name ||
    item.appl_non_drug?.item_name ||
    item.lp_non_drug?.item_name ||
    item.contract?.item_name ||
    null
  )
}

/**
 * Get catalog items for a specific catalog
 */
export async function getCatalogItems(
  catalogId: string,
  itemType?: CatalogItemType,
  page: number = 1,
  pageSize: number = 50,
  categoryId?: string,
  therapeuticClassId?: string
): Promise<ApiResponse<PaginatedResponse<UnitCatalogItemWithRelations>>> {
  try {
    // If filtering by category, we force inner join on drugs to filter by category_id
    // This effectively filters out non-drugs and drugs not in the category
    const drugJoinType = (categoryId || therapeuticClassId) ? '!inner' : ''

    let query = supabase
      .from('pharmacy_unit_catalog_items')
      .select(
        `
        *,
        unit_category:drug_categories!category_id(*),
        unit_therapeutic_class:drug_categories!therapeutic_class_id(*),
        drug:drugs${drugJoinType}(id, drug_code, drug_name, generic_name, brand_name, unit_of_measure, status, packaging_description, sku, pku, procurement_vote, category:drug_categories!category_id(*), therapeutic_class:drug_categories!therapeutic_class_id(*)),
        non_drug:non_drugs(id, item_code, item_name, unit_of_measure, status, packaging_description, sku, pku, procurement_vote),
        contract:contracts(id, contract_number, item_code, item_name, supplier_name, packaging_description, unit),
        appl_drug:appl_drugs(id, item_code, item_name, packaging_description, price),
        appl_non_drug:appl_non_drugs(id, item_code, item_name, packaging_description, price),
        lp_drug:lp_drugs(id, item_code, item_name, packaging_description, price),
        lp_non_drug:lp_non_drugs(id, item_code, item_name, packaging_description, price),
        last_updated_by_user:users!pharmacy_unit_catalog_items_last_updated_by_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('catalog_id', catalogId)

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    if (categoryId) {
      query = query.eq('drug.category_id', categoryId)
    }

    if (therapeuticClassId) {
      query = query.eq('drug.therapeutic_class_id', therapeuticClassId)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const items = (data || []) as UnitCatalogItemWithRelations[]

    return {
      data: {
        data: items,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching catalog items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch catalog items',
    }
  }
}

/**
 * Get a single catalog item by ID
 */
export async function getCatalogItem(
  itemId: string
): Promise<ApiResponse<UnitCatalogItemWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_unit_catalog_items')
      .select(
        `
        *,
        unit_category:drug_categories!category_id(*),
        unit_therapeutic_class:drug_categories!therapeutic_class_id(*),
        drug:drugs(id, drug_code, drug_name, generic_name, brand_name, unit_of_measure, status, packaging_description, sku, pku, procurement_vote, category_id, therapeutic_class_id, category:drug_categories!category_id(*), therapeutic_class:drug_categories!therapeutic_class_id(*)),
        non_drug:non_drugs(id, item_code, item_name, unit_of_measure, status, packaging_description, sku, pku, procurement_vote, category_id),
        contract:contracts(id, contract_number, item_code, item_name, supplier_name, packaging_description, unit),
        appl_drug:appl_drugs(id, item_code, item_name, packaging_description, price),
        appl_non_drug:appl_non_drugs(id, item_code, item_name, packaging_description, price),
        lp_drug:lp_drugs(id, item_code, item_name, packaging_description, price),
        lp_non_drug:lp_non_drugs(id, item_code, item_name, packaging_description, price),
        last_updated_by_user:users!pharmacy_unit_catalog_items_last_updated_by_fkey(id, full_name, email),
        catalog:pharmacy_unit_catalog(id, department_id, hospital_id)
      `
      )
      .eq('id', itemId)
      .single()

    if (error) throw error

    return {
      data: data as UnitCatalogItemWithRelations,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching catalog item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch catalog item',
    }
  }
}

/**
 * Add a single catalog item
 */
export async function addCatalogItem(
  catalogId: string,
  hospitalId: string,
  userId: string,
  itemData: UnitCatalogItemFormData
): Promise<ApiResponse<UnitCatalogItem>> {
  try {
    const insertData: any = {
      catalog_id: catalogId,
      hospital_id: hospitalId,
      item_type: itemData.item_type,
      is_active: itemData.is_active,
      min_limit: itemData.min_limit,
      max_limit: itemData.max_limit || null,
      reorder_level: itemData.reorder_level || 1,
      last_updated_by: userId,
      last_updated_at: new Date().toISOString(),
      contract_id: itemData.contract_id || null,
      contract_number: itemData.contract_number || null,
      appl_drug_id: itemData.appl_drug_id || null,
      appl_non_drug_id: itemData.appl_non_drug_id || null,
      lp_drug_id: itemData.lp_drug_id || null,
      lp_non_drug_id: itemData.lp_non_drug_id || null,
      procurement_vote: itemData.procurement_vote || null,
      category_id: itemData.category_id || null,
      therapeutic_class_id: itemData.therapeutic_class_id || null,
    }

    if (itemData.item_type === 'drug') {
      // Relax validation: Drug ID is optional if we have an external source ID
      if (!itemData.drug_id && !itemData.appl_drug_id && !itemData.lp_drug_id && !itemData.contract_id) {
        throw new Error('Drug ID or valid Source ID is required for drug items')
      }
      insertData.drug_id = itemData.drug_id || null
      insertData.non_drug_id = null
    } else {
      // Relax validation here too if needed, though usually non_drugs are simpler
      if (!itemData.non_drug_id && !itemData.appl_non_drug_id && !itemData.lp_non_drug_id) {
        throw new Error('Non-drug ID or valid Source ID is required for non-drug items')
      }
      insertData.non_drug_id = itemData.non_drug_id || null
      insertData.drug_id = null
    }

    const { data, error } = await supabase
      .from('pharmacy_unit_catalog_items')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Log change
    await logCatalogItemChange(
      catalogId,
      hospitalId,
      userId,
      'created',
      null,
      data,
      data.id,
      itemData.item_name,
      'Item added to catalog'
    )

    return {
      data: data as UnitCatalogItem,
      error: null,
    }
  } catch (error) {
    console.error('Error adding catalog item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add catalog item',
    }
  }
}

/**
 * Add multiple catalog items (bulk operation)
 */
export async function addCatalogItems(
  catalogId: string,
  hospitalId: string,
  userId: string,
  items: UnitCatalogItemFormData[]
): Promise<ApiResponse<UnitCatalogItem[]>> {
  try {
    const insertData = items.map((itemData) => {
      const baseData: any = {
        catalog_id: catalogId,
        hospital_id: hospitalId,
        item_type: itemData.item_type,
        is_active: itemData.is_active,
        min_limit: itemData.min_limit,
        max_limit: itemData.max_limit || null,
        reorder_level: itemData.reorder_level || 1,
        last_updated_by: userId,
        last_updated_at: new Date().toISOString(),
        contract_id: itemData.contract_id || null,
        contract_number: itemData.contract_number || null,
        appl_drug_id: itemData.appl_drug_id || null,
        appl_non_drug_id: itemData.appl_non_drug_id || null,
        lp_drug_id: itemData.lp_drug_id || null,
        lp_non_drug_id: itemData.lp_non_drug_id || null,
        procurement_vote: itemData.procurement_vote || null,
        category_id: itemData.category_id || null,
        therapeutic_class_id: itemData.therapeutic_class_id || null,
      }

      if (itemData.item_type === 'drug') {
        if (!itemData.drug_id && !itemData.appl_drug_id && !itemData.lp_drug_id && !itemData.contract_id) {
          throw new Error('Drug ID or valid Source ID is required for drug items')
        }
        baseData.drug_id = itemData.drug_id || null
        baseData.non_drug_id = null
      } else {
        if (!itemData.non_drug_id && !itemData.appl_non_drug_id && !itemData.lp_non_drug_id) {
          throw new Error('Non-drug ID or valid Source ID is required for non-drug items')
        }
        baseData.non_drug_id = itemData.non_drug_id || null
        baseData.drug_id = null
      }

      return baseData
    })

    const { data, error } = await supabase
      .from('pharmacy_unit_catalog_items')
      .insert(insertData)
      .select()

    if (error) throw error

    // Log changes for each item
    for (let i = 0; i < (data || []).length; i++) {
      const item = data![i]
      const originalItem = items[i]
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'created',
        null,
        item,
        item.id,
        originalItem.item_name,
        'Bulk item addition'
      )
    }

    return {
      data: (data || []) as UnitCatalogItem[],
      error: null,
    }
  } catch (error) {
    console.error('Error adding catalog items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add catalog items',
    }
  }
}

/**
 * Update a catalog item
 */
export async function updateCatalogItem(
  itemId: string,
  catalogId: string,
  hospitalId: string,
  userId: string,
  updates: Partial<UnitCatalogItemFormData>
): Promise<ApiResponse<UnitCatalogItem>> {
  try {
    // Get old values for change log
    const oldItemResult = await getCatalogItem(itemId)
    if (oldItemResult.error || !oldItemResult.data) {
      throw new Error(oldItemResult.error || 'Failed to fetch old item data')
    }
    const oldItem = oldItemResult.data
    const itemName = getItemName(oldItem)

    const updateData: any = {
      last_updated_by: userId,
      last_updated_at: new Date().toISOString(),
    }

    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active
    }
    if (updates.min_limit !== undefined) {
      updateData.min_limit = updates.min_limit
    }
    if (updates.max_limit !== undefined) {
      updateData.max_limit = updates.max_limit || null
    }
    if (updates.reorder_level !== undefined) {
      updateData.reorder_level = updates.reorder_level
    }

    if (updates.category_id !== undefined) {
      updateData.category_id = updates.category_id || null
    }
    if (updates.therapeutic_class_id !== undefined) {
      updateData.therapeutic_class_id = updates.therapeutic_class_id || null
    }
    if (updates.procurement_vote !== undefined) {
      updateData.procurement_vote = updates.procurement_vote || null
    }

    const { data, error } = await supabase
      .from('pharmacy_unit_catalog_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error

    // Log changes
    const changedFields: string[] = []
    if (updates.is_active !== undefined && updates.is_active !== oldItem.is_active) {
      changedFields.push('is_active')
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'is_active',
        oldItem.is_active,
        updates.is_active,
        itemId,
        itemName,
        'Item status updated'
      )
    }
    if (updates.min_limit !== undefined && updates.min_limit !== oldItem.min_limit) {
      changedFields.push('min_limit')
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'min_limit',
        oldItem.min_limit,
        updates.min_limit,
        itemId,
        itemName,
        'Minimum limit updated'
      )
    }
    if (updates.max_limit !== undefined && updates.max_limit !== oldItem.max_limit) {
      changedFields.push('max_limit')
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'max_limit',
        oldItem.max_limit,
        updates.max_limit,
        itemId,
        itemName,
        'Maximum limit updated'
      )
    }
    if (updates.reorder_level !== undefined && updates.reorder_level !== oldItem.reorder_level) {
      changedFields.push('reorder_level')
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'reorder_level',
        oldItem.reorder_level,
        updates.reorder_level,
        itemId,
        itemName,
        'Buffer quantity updated'
      )
    }

    // Log classification changes
    if (updates.category_id !== undefined && updates.category_id !== oldItem.category_id) {
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'category_id',
        oldItem.category_id,
        updates.category_id,
        itemId,
        itemName,
        'Category updated'
      )
    }
    if (updates.therapeutic_class_id !== undefined && updates.therapeutic_class_id !== oldItem.therapeutic_class_id) {
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'therapeutic_class_id',
        oldItem.therapeutic_class_id,
        updates.therapeutic_class_id,
        itemId,
        itemName,
        'Therapeutic class updated'
      )
    }

    // Log procurement vote changes
    const oldVote = oldItem.item_type === 'drug' ? oldItem.drug?.procurement_vote : oldItem.non_drug?.procurement_vote
    if (updates.procurement_vote !== undefined && updates.procurement_vote !== oldVote) {
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'procurement_vote',
        oldVote,
        updates.procurement_vote,
        itemId,
        itemName,
        'Procurement source updated'
      )
    }

    return {
      data: data as UnitCatalogItem,
      error: null,
    }
  } catch (error) {
    console.error('Error updating catalog item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update catalog item',
    }
  }
}

/**
 * Toggle catalog item active status
 */
export async function toggleCatalogItem(
  itemId: string,
  catalogId: string,
  hospitalId: string,
  userId: string,
  isActive: boolean
): Promise<ApiResponse<UnitCatalogItem>> {
  return updateCatalogItem(itemId, catalogId, hospitalId, userId, { is_active: isActive })
}

/**
 * Delete a catalog item
 */
export async function deleteCatalogItem(
  itemId: string,
  catalogId: string,
  hospitalId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    // Get item data for change log
    const itemResult = await getCatalogItem(itemId)
    if (!itemResult.error && itemResult.data) {
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'deleted',
        itemResult.data,
        null,
        itemId,
        getItemName(itemResult.data),
        'Item removed from catalog'
      )

      const { error } = await supabase
        .from('pharmacy_unit_catalog_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      return {
        data: undefined,
        error: null,
      }
    }
    throw new Error(itemResult.error || 'Item not found')
  } catch (error) {
    console.error('Error deleting catalog item:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete catalog item',
    }
  }
}

/**
 * Get item counts for a catalog
 */
export async function getCatalogItemCounts(
  catalogId: string
): Promise<ApiResponse<{
  drug_items_count: number
  non_drug_items_count: number
  active_drug_items_count: number
  active_non_drug_items_count: number
}>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_unit_catalog_items')
      .select('item_type, is_active')
      .eq('catalog_id', catalogId)

    if (error) throw error

    const counts = {
      drug_items_count: 0,
      non_drug_items_count: 0,
      active_drug_items_count: 0,
      active_non_drug_items_count: 0,
    }

      ; (data || []).forEach((item: any) => {
        if (item.item_type === 'drug') {
          counts.drug_items_count++
          if (item.is_active) {
            counts.active_drug_items_count++
          }
        } else {
          counts.non_drug_items_count++
          if (item.is_active) {
            counts.active_non_drug_items_count++
          }
        }
      })

    return {
      data: counts,
      error: null,
    }
  } catch (error) {
    console.error('Error getting catalog item counts:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get catalog item counts',
    }
  }
}

/**
 * Helper function to log catalog item changes
 */
async function logCatalogItemChange(
  catalogId: string,
  hospitalId: string,
  userId: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  itemId?: string | null,
  itemName?: string | null,
  reason?: string
): Promise<void> {
  try {
    await supabase.from('pharmacy_unit_catalog_changes').insert({
      catalog_id: catalogId,
      hospital_id: hospitalId,
      changed_by: userId,
      changed_at: new Date().toISOString(),
      field_name: fieldName,
      old_value: oldValue !== null && oldValue !== undefined ? oldValue : null,
      new_value: newValue !== null && newValue !== undefined ? newValue : null,
      change_reason: reason || null,
      item_id: itemId || null,
      item_name: itemName || null,
    })
  } catch (error) {
    console.error('Error logging catalog item change:', error)
    // Don't throw - change logging failure shouldn't break the main operation
  }
}

/**
 * Search all active catalog items for a hospital
 */
/**
 * Search all active catalog items for a hospital
 */
export async function searchCatalogItems(
  hospitalId: string,
  searchQuery: string,
  itemType?: CatalogItemType,
  catalogId?: string
): Promise<ApiResponse<UnitCatalogItemWithRelations[]>> {
  try {
    let query = supabase
      .from('pharmacy_unit_catalog_items')
      .select(`
        *,
        drug:drugs(*, category:drug_categories!category_id(*), therapeutic_class:drug_categories!therapeutic_class_id(*)),
        non_drug:non_drugs(*),
        contract:contracts(*),
        appl_drug:appl_drugs(*),
        appl_non_drug:appl_non_drugs(*),
        lp_drug:lp_drugs(*),
        lp_non_drug:lp_non_drugs(*)
      `)
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    if (catalogId) {
      query = query.eq('catalog_id', catalogId)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

    let items = (data || []) as UnitCatalogItemWithRelations[]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(item => {
        // Resolve name
        const name =
          item.drug?.drug_name ||
          item.non_drug?.item_name ||
          item.contract?.item_name ||
          item.appl_drug?.item_name ||
          item.appl_non_drug?.item_name ||
          item.lp_drug?.item_name ||
          item.lp_non_drug?.item_name ||
          ''

        // Resolve code
        const code =
          item.drug?.drug_code ||
          item.non_drug?.item_code ||
          item.contract?.item_code ||
          item.appl_drug?.item_code ||
          item.appl_non_drug?.item_code ||
          item.lp_drug?.item_code ||
          item.lp_non_drug?.item_code ||
          ''

        return name.toLowerCase().includes(q) || code.toLowerCase().includes(q)
      })
    }

    return { data: items, error: null }
  } catch (error) {
    console.error('Error searching catalog items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to search catalog items',
    }
  }
}
