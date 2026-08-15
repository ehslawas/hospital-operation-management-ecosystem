// @ts-nocheck
/**
 * Drug Catalog Service (Unified Wrapper around MyInventory inventoryService)
 * All drug catalog operations query and manipulate the MyInventory single source of truth.
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { mockDrugs } from '@/services/pharmacy/mockData'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { Drug, DrugWithRelations } from '@/types/pharmacy'
import {
  getDrugs as getDrugCatalog,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug,
  batchUpdateDrugStatus,
  getDrugCategories,
} from '@/services/pharmacy/inventoryService'

export {
  getDrugCatalog,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug,
  batchUpdateDrugStatus,
  getDrugCategories,
}

export type { DrugCatalogFilter, DrugCatalogKPIs } from '@/types/pharmacy'

export async function getDrugCatalogKPIs(hospitalId: string) {
  const result = await getDrugCatalog(hospitalId, undefined, 1, 1000)
  if (result.error || !result.data) {
    return { data: { total: 0, active: 0, inactive: 0 }, error: result.error }
  }
  const items = result.data.data || []
  const active = items.filter((d: any) => d.status === 'active').length
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
 * Search drugs with autocomplete suggestions
 */
export async function searchDrugs(
  hospitalId: string,
  query: string,
  limit: number = 10
): Promise<ApiResponse<DrugWithRelations[]>> {
  if (!query || query.length < 2) {
    return { data: [], error: null }
  }
  const result = await getDrugCatalog(hospitalId, { search: query } as any, 1, limit)
  return {
    data: result.data?.data || [],
    error: result.error,
  }
}

/**
 * Export drug catalog to CSV
 */
export async function exportDrugCatalog(
  hospitalId: string,
  filter?: any
): Promise<ApiResponse<string>> {
  try {
    const result = await getDrugCatalog(hospitalId, filter, 1, 10000)
    
    if (!result.data) {
      return { data: null, error: 'Failed to fetch drugs for export' }
    }

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

    const rows = (result.data.data || []).map((drug: any) => [
      drug.drug_code || '',
      drug.drug_name || '',
      drug.sku || '',
      drug.pku || '',
      drug.category?.category_name || '',
      drug.supplier?.supplier_name || '',
      drug.procurement_vote?.toUpperCase() || '',
      drug.status || 'active',
      typeof drug.price === 'number' ? drug.price.toFixed(2) : '0.00',
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
 */
export async function batchImportDrugs(
  hospitalId: string,
  drugs: Partial<Drug>[],
  onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; errors: string[] }>> {
  try {
    const supabaseConfigured = isSupabaseConfigured()
    const errors: string[] = []
    let successCount = 0

    const validDrugs = drugs.filter(
      (item) => item != null && typeof item === 'object' && Object.keys(item).length > 0
    )

    const seenDrugCodes = new Set<string>()
    const totalItems = validDrugs.length
    if (onProgress) {
      onProgress({ processed: 0, total: totalItems, success: 0, failed: 0 })
    }

    const invalidDrugCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']
    const invalidNamePatterns = ['each', 'pack of', 'contract', 'drug name', 'item name']

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
            errors.push(`Failed to check existing items for some codes: ${error.message}`)
            break
          }

          ;(data || []).forEach((row: any) => {
            if (!row || !row.drug_code || !row.id) return
            const code = String(row.drug_code).trim().toUpperCase()
            existingByCode!.set(code, { id: row.id })
          })
        }
      } catch (preloadError) {
        console.error('[batchImportDrugs] Exception while preloading existing drugs:', preloadError)
      }
    }
    
    for (let i = 0; i < validDrugs.length; i++) {
      const drugData = validDrugs[i]
      
      if (!drugData || typeof drugData !== 'object') {
        errors.push(`Row ${i + 2}: Invalid data entry`)
        continue
      }
      
      if (!drugData.drug_code || !drugData.drug_name) {
        errors.push(`Row ${i + 2}: Missing required fields (Item Code or Drug Name)`)
        continue
      }
      
      const drugCode = String(drugData.drug_code).trim().toUpperCase()
      const drugName = String(drugData.drug_name).trim().toLowerCase()
      
      if (invalidDrugCodes.includes(drugCode)) {
        errors.push(`Row ${i + 2}: Invalid drug code "${drugData.drug_code}"`)
        continue
      }

      if (seenDrugCodes.has(drugCode)) {
        errors.push(`Row ${i + 2}: Duplicate item code "${drugData.drug_code}" in upload.`)
        continue
      }
      seenDrugCodes.add(drugCode)
      
      let isInvalidName = false
      for (const pattern of invalidNamePatterns) {
        if (drugName === pattern || drugName.startsWith(pattern + ' ')) {
          isInvalidName = true
          break
        }
      }
      
      if (isInvalidName) {
        errors.push(`Row ${i + 2}: Invalid drug name "${drugData.drug_name}"`)
        continue
      }
      
      if (drugCode.length < 3) {
        errors.push(`Row ${i + 2}: Drug code "${drugData.drug_code}" is too short`)
        continue
      }
      
      if (drugName.length < 5) {
        errors.push(`Row ${i + 2}: Drug name "${drugData.drug_name}" is too short`)
        continue
      }
      
      if (/^\d+$/.test(drugName)) {
        errors.push(`Row ${i + 2}: Drug name "${drugData.drug_name}" cannot be just a number`)
        continue
      }

      let existing: { id: string } | null = null
      if (supabaseConfigured) {
        if (existingByCode) {
          existing = existingByCode.get(drugCode) || null
        }
      } else {
        const found = mockDrugs.find(
          d => d.drug_code === drugCode && d.hospital_id === hospitalId
        )
        existing = found ? { id: found.id } : null
      }

      if (existing) {
        try {
          const updateResult = await updateDrug(existing.id, {
            ...drugData,
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
          const createResult = await createDrug(hospitalId, {
            ...drugData,
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
    console.error('Error batch importing drugs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to batch import drugs',
    }
  }
}

