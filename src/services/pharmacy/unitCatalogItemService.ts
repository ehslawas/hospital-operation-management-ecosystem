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
 * Get catalog items for a specific catalog
 */
export async function getCatalogItems(
  catalogId: string,
  itemType?: CatalogItemType,
  page: number = 1,
  pageSize: number = 50
): Promise<ApiResponse<PaginatedResponse<UnitCatalogItemWithRelations>>> {
  try {
    let query = supabase
      .from('pharmacy_unit_catalog_items')
      .select(
        `
        *,
        drug:drugs(id, drug_code, drug_name, generic_name, brand_name, unit_of_measure, status),
        non_drug:non_drugs(id, item_code, item_name, unit_of_measure, status),
        last_updated_by_user:users!pharmacy_unit_catalog_items_last_updated_by_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('catalog_id', catalogId)

    if (itemType) {
      query = query.eq('item_type', itemType)
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
        drug:drugs(id, drug_code, drug_name, generic_name, brand_name, unit_of_measure, status),
        non_drug:non_drugs(id, item_code, item_name, unit_of_measure, status),
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
      last_updated_by: userId,
      last_updated_at: new Date().toISOString(),
    }

    if (itemData.item_type === 'drug') {
      if (!itemData.drug_id) {
        throw new Error('Drug ID is required for drug items')
      }
      insertData.drug_id = itemData.drug_id
      insertData.non_drug_id = null
    } else {
      if (!itemData.non_drug_id) {
        throw new Error('Non-drug ID is required for non-drug items')
      }
      insertData.non_drug_id = itemData.non_drug_id
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
        last_updated_by: userId,
        last_updated_at: new Date().toISOString(),
      }

      if (itemData.item_type === 'drug') {
        if (!itemData.drug_id) {
          throw new Error('Drug ID is required for drug items')
        }
        baseData.drug_id = itemData.drug_id
        baseData.non_drug_id = null
      } else {
        if (!itemData.non_drug_id) {
          throw new Error('Non-drug ID is required for non-drug items')
        }
        baseData.non_drug_id = itemData.non_drug_id
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
    for (const item of data || []) {
      await logCatalogItemChange(
        catalogId,
        hospitalId,
        userId,
        'created',
        null,
        item,
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
        'Maximum limit updated'
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
        'Item removed from catalog'
      )
    }

    const { error } = await supabase
      .from('pharmacy_unit_catalog_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    return {
      data: undefined,
      error: null,
    }
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
    })
  } catch (error) {
    console.error('Error logging catalog item change:', error)
    // Don't throw - change logging failure shouldn't break the main operation
  }
}

