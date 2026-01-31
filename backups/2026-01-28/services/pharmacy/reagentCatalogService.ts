/**
 * Reagent Catalog Service
 * Handles laboratory reagents and testing supplies catalog operations
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { NonDrug, NonDrugWithRelations, Supplier } from '@/types/pharmacy'
import { getNonDrugCategories } from './inventoryService'

// Small helper to safely handle UUID fields
const sanitizeUuid = (value: any): string | null => {
    if (!value) return null
    const str = String(value).trim()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str) ? str : null
}

export interface ReagentCatalogFilter {
    search?: string
    category_id?: string
    supplier_id?: string
    procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp'
    status?: 'active' | 'inactive'
}

export interface ReagentCatalogKPIs {
    total: number
    active: number
    inactive: number
}

/**
 * Get reagent catalog KPIs
 */
export async function getReagentCatalogKPIs(
    hospitalId: string
): Promise<ApiResponse<ReagentCatalogKPIs>> {
    try {
        const { count: total, error: totalError } = await supabase
            .from('reagents')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)

        if (totalError) throw totalError

        const { count: active, error: activeError } = await supabase
            .from('reagents')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')

        if (activeError) throw activeError

        return {
            data: {
                total: total || 0,
                active: active || 0,
                inactive: (total || 0) - (active || 0),
            },
            error: null,
        }
    } catch (error) {
        console.error('Error fetching reagent catalog KPIs:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch KPIs',
        }
    }
}

/**
 * Get reagents with search and filters
 */
export async function getReagentCatalog(
    hospitalId: string,
    filter?: ReagentCatalogFilter,
    page: number = 1,
    pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<NonDrugWithRelations>>> {
    try {
        let query = supabase
            .from('reagents')
            .select('*', { count: 'exact' })
            .eq('hospital_id', hospitalId)

        if (filter?.search) {
            const search = filter.search.trim()
            query = query.or(`item_code.ilike.%${search}%,item_name.ilike.%${search}%`)
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

        const { count } = await query

        query = query
            .order('item_name', { ascending: true })
            .order('item_code', { ascending: true })

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data: items, error } = await query

        if (error) throw error

        const reagents = (items || []) as NonDrug[]

        // Get categories and suppliers for relations
        const categoriesResult = await getNonDrugCategories()
        const categoriesList = categoriesResult.data || []

        const { data: suppliersData } = await supabase
            .from('suppliers')
            .select('*')
            .eq('hospital_id', hospitalId)
        const suppliersList = (suppliersData || []) as Supplier[]

        // Enrich with relations
        const reagentsWithRelations: NonDrugWithRelations[] = reagents.map(item => {
            const category = categoriesList.find(c => c.id === item.category_id)
            const supplier = suppliersList.find(s => s.id === item.supplier_id)

            return {
                ...item,
                category,
                supplier,
            }
        })

        return {
            data: {
                data: reagentsWithRelations,
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize),
            },
            error: null,
        }
    } catch (error) {
        console.error('Error fetching reagent catalog:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch catalog',
        }
    }
}

/**
 * Create new reagent
 */
export async function createReagent(
    hospitalId: string,
    userId: string,
    reagentData: Partial<NonDrug>
): Promise<ApiResponse<NonDrugWithRelations>> {
    try {

        const insertData: any = {
            hospital_id: hospitalId,
            item_code: reagentData.item_code || `RG-${Date.now()}`,
            item_name: reagentData.item_name || '',
            category_id: sanitizeUuid((reagentData as any).category_id),
            supplier_id: sanitizeUuid((reagentData as any).supplier_id),
            procurement_vote: reagentData.procurement_vote || null,
            price: reagentData.price || null,
            packaging_description: (reagentData as any).packaging_description || null,
            status: reagentData.status || 'active',
            notes: reagentData.notes || null,
            created_by: userId,
        }

        const { data, error } = await supabase
            .from('reagents')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return { data: data as NonDrugWithRelations, error: null }
    } catch (error) {
        console.error('Error creating reagent:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to create reagent',
        }
    }
}

/**
 * Update reagent
 */
export async function updateReagent(
    reagentId: string,
    reagentData: Partial<NonDrug>
): Promise<ApiResponse<NonDrugWithRelations>> {
    try {

        const updateData: any = {
            ...reagentData,
            category_id: sanitizeUuid((reagentData as any).category_id),
            supplier_id: sanitizeUuid((reagentData as any).supplier_id),
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('reagents')
            .update(updateData)
            .eq('id', reagentId)
            .select()
            .single()

        if (error) throw error

        return { data: data as NonDrugWithRelations, error: null }
    } catch (error) {
        console.error('Error updating reagent:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to update reagent',
        }
    }
}

/**
 * Delete reagent
 */
export async function deleteReagent(reagentId: string): Promise<ApiResponse<void>> {
    try {

        const { error } = await supabase
            .from('reagents')
            .delete()
            .eq('id', reagentId)

        if (error) throw error

        return { data: undefined, error: null }
    } catch (error) {
        console.error('Error deleting reagent:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to delete reagent',
        }
    }
}

/**
 * Batch import reagents
 */
export async function batchImportReagents(
    hospitalId: string,
    userId: string,
    reagents: any[]
): Promise<ApiResponse<{ success: number; errors: string[] }>> {
    try {

        const errors: string[] = []
        let successCount = 0

        const upsertData = reagents.map((row, index) => {
            try {
                if (!row.item_code || !row.item_name) {
                    errors.push(`Row ${index + 2}: Missing required fields`)
                    return null
                }

                return {
                    hospital_id: hospitalId,
                    item_code: String(row.item_code).trim(),
                    item_name: String(row.item_name).trim(),
                    packaging_description: row.packaging_description || null,
                    price: parseFloat(row.price) || null,
                    notes: row.notes || null,
                    status: 'active',
                    created_by: userId,
                    updated_at: new Date().toISOString()
                }
            } catch (err) {
                errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Invalid data'}`)
                return null
            }
        }).filter(item => item !== null)

        if (upsertData.length > 0) {
            const { error } = await supabase
                .from('reagents')
                .upsert(upsertData, { onConflict: 'hospital_id,item_code' })

            if (error) throw error
            successCount = upsertData.length
        }

        return { data: { success: successCount, errors }, error: null }
    } catch (error) {
        console.error('Error batch importing reagents:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to import reagents',
        }
    }
}

/**
 * Export reagent catalog to CSV
 */
export async function exportReagentCatalog(
    hospitalId: string,
    filter?: ReagentCatalogFilter
): Promise<ApiResponse<string>> {
    try {
        const result = await getReagentCatalog(hospitalId, filter, 1, 10000)

        if (!result.data) return { data: null, error: 'Failed to fetch reagents for export' }

        const headers = ['Reagent Code', 'Reagent Name', 'Packaging Description', 'Price (RM)', 'Notes', 'Status']
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
        console.error('Error exporting reagent catalog:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to export reagent catalog',
        }
    }
}
