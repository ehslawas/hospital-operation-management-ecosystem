/**
 * APPL Non-Drug Catalog Service
 * Handles APPL non-drug catalog operations with AI-powered Excel import
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { ApplNonDrug, ApplNonDrugWithRelations } from '@/types/pharmacy'

// Import shared utilities from applDrugCatalogService
import {
    type ApplDrugCatalogFilter as ApplNonDrugCatalogFilter,
    type ApplDrugCatalogKPIs as ApplNonDrugCatalogKPIs,
} from './applDrugCatalogService'

export type { ApplNonDrugCatalogFilter, ApplNonDrugCatalogKPIs }

// =====================================================
// CRUD OPERATIONS
// =====================================================

export async function getApplNonDrugCatalogKPIs(hospitalId: string): Promise<ApiResponse<ApplNonDrugCatalogKPIs>> {
    try {
        const { count: total, error: totalError } = await supabase
            .from('appl_non_drugs')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)

        if (totalError) throw totalError

        const { count: active, error: activeError } = await supabase
            .from('appl_non_drugs')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')

        if (activeError) throw activeError

        return { data: { total: total || 0, active: active || 0, inactive: (total || 0) - (active || 0) }, error: null }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch KPIs',
        }
    }
}

export async function getApplNonDrugCatalog(
    hospitalId: string,
    filter?: ApplNonDrugCatalogFilter,
    page: number = 1,
    pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<ApplNonDrugWithRelations>>> {
    try {
        let query = supabase
            .from('appl_non_drugs')
            .select('*', { count: 'exact' })
            .eq('hospital_id', hospitalId)

        if (filter?.search) {
            query = query.or(`item_code.ilike.%${filter.search}%,item_name.ilike.%${filter.search}%`)
        }

        if (filter?.status) {
            query = query.eq('status', filter.status)
        }

        const { count } = await query

        query = query.order('item_name', { ascending: true }).order('item_code', { ascending: true })

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data: items, error } = await query

        if (error) throw error

        return {
            data: {
                data: items || [],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize),
            },
            error: null,
        }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch catalog',
        }
    }
}

export async function searchApplNonDrugs(hospitalId: string, query: string, limit: number = 10): Promise<ApiResponse<ApplNonDrugWithRelations[]>> {
    try {
        if (!query || query.length < 2) return { data: [], error: null }

        const { data: items, error } = await supabase
            .from('appl_non_drugs')
            .select('*')
            .eq('hospital_id', hospitalId)
            .or(`item_code.ilike.%${query}%,item_name.ilike.%${query}%`)
            .limit(limit)

        if (error) throw error
        return { data: items || [], error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to search' }
    }
}

export async function createApplNonDrug(
    hospitalId: string,
    userId: string,
    itemData: Partial<ApplNonDrug>
): Promise<ApiResponse<ApplNonDrugWithRelations>> {
    try {
        const insertData: any = {
            hospital_id: hospitalId,
            item_code: itemData.item_code || `APPL-ND-${Date.now()}`,
            item_name: itemData.item_name || '',
            packaging_description: itemData.packaging_description || null,
            price: itemData.price || null,
            notes: itemData.notes || null,
            status: itemData.status || 'active',
            created_by: userId,
        }

        const { data, error } = await supabase.from('appl_non_drugs').insert(insertData).select().single()

        if (error) return { data: null, error: `Failed to create item: ${error.message}` }
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to create item' }
    }
}

export async function updateApplNonDrug(itemId: string, itemData: Partial<ApplNonDrug>): Promise<ApiResponse<ApplNonDrugWithRelations>> {
    try {
        const { data, error } = await supabase.from('appl_non_drugs').update(itemData).eq('id', itemId).select().single()

        if (error) throw error
        if (!data) return { data: null, error: 'Item not found' }
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to update item' }
    }
}

export async function deleteApplNonDrug(itemId: string): Promise<ApiResponse<void>> {
    try {
        const { error } = await supabase.from('appl_non_drugs').delete().eq('id', itemId)

        if (error) throw error
        return { data: undefined, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to delete item' }
    }
}

export async function exportApplNonDrugCatalog(
    hospitalId: string,
    filter?: ApplNonDrugCatalogFilter
): Promise<ApiResponse<string>> {
    try {
        const result = await getApplNonDrugCatalog(hospitalId, filter, 1, 10000)

        if (!result.data) return { data: null, error: 'Failed to fetch items for export' }

        const headers = ['Item Code', 'Item Name', 'Packaging Description', 'Price (RM)', 'Notes', 'Status']

        const rows = result.data.data.map(item => [
            item.item_code,
            item.item_name,
            item.packaging_description || '',
            item.price?.toFixed(2) || '0.00',
            item.notes || '',
            item.status,
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n')

        return { data: csvContent, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to export' }
    }
}

export async function batchImportApplNonDrugs(
    hospitalId: string,
    userId: string,
    rawData: any[],
    onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
): Promise<ApiResponse<{ success: number; errors: string[] }>> {
    try {
        console.log('[batchImportApplNonDrugs] Starting import:', rawData.length, 'rows')

        if (!rawData || rawData.length === 0) return { data: { success: 0, errors: ['No data provided'] }, error: null }

        // Data is already mapped by ExcelImport component, so we can access fields directly
        console.log('[batchImportApplNonDrugs] Data already mapped by ExcelImport, accessing fields directly')

        const errors: string[] = []
        let successCount = 0
        const total = rawData.length

        // Process in chunks of 50 to avoid request size limits and for better failure isolation
        const chunkSize = 50
        for (let i = 0; i < rawData.length; i += chunkSize) {
            const chunk = rawData.slice(i, i + chunkSize)
            const upsertData: any[] = []

            for (let j = 0; j < chunk.length; j++) {
                const row = chunk[j]
                const rowIndex = i + j

                try {
                    // Access mapped fields directly - ExcelImport already mapped columns to field keys
                    const itemCode = row.item_code?.toString().trim()
                    const itemName = row.item_name?.toString().trim()

                    if (!itemCode || !itemName) {
                        errors.push(`Row ${rowIndex + 2}: Missing required fields`)
                        continue
                    }

                    const packagingDescription = row.packaging_description?.toString().trim() || null

                    // Robust price parsing
                    let price = null
                    if (row.price !== undefined && row.price !== null && row.price !== '') {
                        if (typeof row.price === 'number') {
                            price = row.price
                        } else {
                            const priceStr = String(row.price).trim().replace(/^RM\s*/i, '').replace(/,/g, '').replace(/\s+/g, '')
                            const parsedPrice = parseFloat(priceStr)
                            price = isNaN(parsedPrice) ? null : parsedPrice
                        }
                    }

                    const notes = row.notes?.toString().trim() || null

                    upsertData.push({
                        hospital_id: hospitalId,
                        item_code: itemCode,
                        item_name: itemName,
                        packaging_description: packagingDescription,
                        price,
                        notes,
                        status: 'active',
                        created_by: userId,
                        updated_at: new Date().toISOString()
                    })
                } catch (rowError) {
                    errors.push(`Row ${rowIndex + 2}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`)
                }
            }

            if (upsertData.length > 0) {
                // Deduplicate by item_code within this chunk (keep last occurrence)
                // This prevents "ON CONFLICT DO UPDATE command cannot affect row a second time" error
                const deduped = new Map<string, any>()
                upsertData.forEach(item => {
                    const key = `${item.hospital_id}-${item.item_code}`
                    deduped.set(key, item) // Later occurrences overwrite earlier ones
                })
                const uniqueData = Array.from(deduped.values())

                if (uniqueData.length < upsertData.length) {
                    console.log(`[batchImportApplNonDrugs] Deduped ${upsertData.length} items to ${uniqueData.length} unique items`)
                }

                // Perform batch upsert
                // We use onConflict: 'hospital_id,item_code' to ensure we update existing records
                const { error: upsertError } = await supabase
                    .from('appl_non_drugs')
                    .upsert(uniqueData, {
                        onConflict: 'hospital_id,item_code',
                        ignoreDuplicates: false
                    })

                if (upsertError) {
                    console.error('[batchImportApplNonDrugs] Upsert error:', upsertError)
                    errors.push(`Chunk starting at row ${i + 2}: Bulk upload failed - ${upsertError.message}`)
                } else {
                    successCount += uniqueData.length
                }
            }

            if (onProgress) {
                onProgress({ processed: Math.min(i + chunkSize, total), total, success: successCount, failed: errors.length })
            }
        }

        console.log('[batchImportApplNonDrugs] Complete. Success:', successCount, 'Errors:', errors.length)

        return { data: { success: successCount, errors }, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to import' }
    }
}
