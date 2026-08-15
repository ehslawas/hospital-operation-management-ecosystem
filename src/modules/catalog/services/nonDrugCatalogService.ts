// @ts-nocheck
/**
 * Non-Drug Catalog Service (Unified Wrapper around MyInventory inventoryService)
 * All non-drug catalog operations query and manipulate the MyInventory single source of truth.
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { mockNonDrugs } from '@/services/pharmacy/mockData'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { NonDrug, NonDrugWithRelations } from '@/types/pharmacy'
import {
  getNonDrugs as getNonDrugCatalog,
  getNonDrugById,
  createNonDrug,
  updateNonDrug,
  deleteNonDrug,
  batchUpdateNonDrugStatus,
  getNonDrugCategories,
} from '@/services/pharmacy/inventoryService'

export {
  getNonDrugCatalog,
  getNonDrugById,
  createNonDrug,
  updateNonDrug,
  deleteNonDrug,
  batchUpdateNonDrugStatus,
  getNonDrugCategories,
}

export type { NonDrugCatalogFilter, NonDrugCatalogKPIs } from '@/types/pharmacy'

export async function getNonDrugCatalogKPIs(hospitalId: string) {
  const result = await getNonDrugCatalog(hospitalId, undefined, 1, 1000)
  if (result.error || !result.data) {
    return { data: { total: 0, active: 0, inactive: 0 }, error: result.error }
  }
  const items = result.data.data || []
  const active = items.filter((nd: any) => nd.status === 'active').length
  return {
    data: {
      total: items.length,
      active,
      inactive: items.length - active,
    },
    error: null,
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
  if (!query || query.length < 2) {
    return { data: [], error: null }
  }
  const result = await getNonDrugCatalog(hospitalId, { search: query } as any, 1, limit)
  return {
    data: result.data?.data || [],
    error: result.error,
  }
}

/**
 * Export non-drug catalog to CSV
 */
export async function exportNonDrugCatalog(
  hospitalId: string,
  filter?: any
): Promise<ApiResponse<string>> {
  try {
    const result = await getNonDrugCatalog(hospitalId, filter, 1, 10000)
    
    if (!result.data) {
      return { data: null, error: 'Failed to fetch non-drugs for export' }
    }

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

    const rows = (result.data.data || []).map((item: any) => [
      item.item_code || '',
      item.item_name || '',
      item.sku || '',
      item.pku || '',
      item.category?.category_name || '',
      item.supplier?.company_name || item.supplier?.supplier_name || '',
      item.procurement_vote?.toUpperCase() || '',
      item.status || 'active',
      typeof item.price === 'number' ? item.price.toFixed(2) : '0.00',
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
 */
export async function batchImportNonDrugs(
  hospitalId: string,
  nonDrugs: Partial<NonDrug>[],
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; errors: string[] }>> {
  try {
    const supabaseConfigured = isSupabaseConfigured()
    const errors: string[] = []
    let successCount = 0

    const validNonDrugs = nonDrugs.filter(
      (item) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )

    const totalItems = validNonDrugs.length
    const seenItemCodes = new Set<string>()

    if (onProgress) {
      onProgress({ processed: 0, total: totalItems, success: 0, failed: 0 })
    }

    const invalidItemCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'NON-DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']
    const invalidNamePatterns = ['each', 'pack of', 'contract', 'non-drug name', 'item name', 'drug name']

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
            errors.push(`Failed to check existing non-drug items for some codes: ${error.message}`)
            break
          }

          ;(data || []).forEach((row: any) => {
            if (!row || !row.item_code || !row.id) return
            const code = String(row.item_code).trim().toUpperCase()
            existingByCode!.set(code, { id: row.id })
          })
        }
      } catch (preloadError) {
        console.error('[batchImportNonDrugs] Exception while preloading existing items:', preloadError)
      }
    }
    
    for (let i = 0; i < validNonDrugs.length; i++) {
      const nonDrugData = validNonDrugs[i]
      
      if (!nonDrugData || typeof nonDrugData !== 'object') {
        errors.push(`Row ${i + 2}: Invalid data entry`)
        continue
      }
      
      if (!nonDrugData.item_code || !nonDrugData.item_name) {
        errors.push(`Row ${i + 2}: Missing required fields (Item Code or Non-Drug Name)`)
        continue
      }
      
      const itemCode = String(nonDrugData.item_code).trim().toUpperCase()
      const itemName = String(nonDrugData.item_name).trim().toLowerCase()
      
      if (invalidItemCodes.includes(itemCode)) {
        errors.push(`Row ${i + 2}: Invalid item code "${nonDrugData.item_code}"`)
        continue
      }

      if (seenItemCodes.has(itemCode)) {
        errors.push(`Row ${i + 2}: Duplicate item code "${nonDrugData.item_code}" in upload.`)
        continue
      }
      seenItemCodes.add(itemCode)
      
      let isInvalidName = false
      for (const pattern of invalidNamePatterns) {
        if (itemName === pattern || itemName.startsWith(pattern + ' ')) {
          isInvalidName = true
          break
        }
      }
      
      if (isInvalidName) {
        errors.push(`Row ${i + 2}: Invalid item name "${nonDrugData.item_name}"`)
        continue
      }
      
      if (itemCode.length < 3) {
        errors.push(`Row ${i + 2}: Item code "${nonDrugData.item_code}" is too short`)
        continue
      }
      
      if (itemName.length < 5) {
        errors.push(`Row ${i + 2}: Item name "${nonDrugData.item_name}" is too short`)
        continue
      }
      
      if (/^\d+$/.test(itemName)) {
        errors.push(`Row ${i + 2}: Item name "${nonDrugData.item_name}" cannot be just a number`)
        continue
      }

      let existing: { id: string } | null = null
      if (supabaseConfigured) {
        if (existingByCode) {
          existing = existingByCode.get(itemCode) || null
        }
      } else {
        const found = mockNonDrugs.find(
          d => d.item_code === itemCode && d.hospital_id === hospitalId
        )
        existing = found ? { id: found.id } : null
      }

      if (existing) {
        try {
          const updateResult = await updateNonDrug(existing.id, {
            ...nonDrugData,
            hospital_id: hospitalId,
          } as any)
          if (updateResult.error) {
            errors.push(`Row ${i + 2}: ${updateResult.error}`)
          } else {
            successCount++
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to update - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        try {
          const createResult = await createNonDrug(hospitalId, {
            ...nonDrugData,
          } as any)
          if (createResult.error) {
            errors.push(`Row ${i + 2}: ${createResult.error}`)
          } else {
            successCount++
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to create - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (onProgress) {
        onProgress({
          processed: i + 1,
          total: totalItems,
          success: successCount,
          failed: errors.length,
        })
      }
    }
    
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

