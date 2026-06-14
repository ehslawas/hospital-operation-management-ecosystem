/**
 * Contract Non-Drug Catalog Service
 * Handles CRUD operations and batch import for Non-Drug Contract Catalog
 */

import { supabase } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type { Contract, ContractWithRelations, ContractCatalogKPIs, ContractCatalogFilter } from '@/types/pharmacy'

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all non-drug contracts for a hospital with optional filters
 */
export async function getContractNonDrugs(
    hospitalId: string,
    filter?: ContractCatalogFilter
): Promise<ApiResponse<ContractWithRelations[]>> {
    try {
        // Build Supabase query
        let query = supabase
            .from('contract_non_drugs')
            .select('*')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false })

        // Apply filters
        if (filter?.search) {
            query = query.or(
                `item_name.ilike.%${filter.search}%,contract_number.ilike.%${filter.search}%,supplier_name.ilike.%${filter.search}%`
            )
        }

        // Handle status filter
        if (filter?.status && filter.status !== 'all') {
            if (filter.status === 'expiring_soon') {
                const now = new Date()
                const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
                query = query
                    .eq('status', 'active')
                    .gte('end_date', now.toISOString().split('T')[0])
                    .lte('end_date', sixtyDaysFromNow.toISOString().split('T')[0])
            } else {
                query = query.eq('status', filter.status)
            }
        }

        if (filter?.supplier_id) {
            query = query.eq('supplier_id', filter.supplier_id)
        }

        if (filter?.date_from) {
            query = query.gte('start_date', filter.date_from)
        }

        if (filter?.date_to) {
            query = query.lte('end_date', filter.date_to)
        }

        if (filter?.min_price) {
            query = query.gte('unit_price', filter.min_price)
        }

        if (filter?.max_price) {
            query = query.lte('unit_price', filter.max_price)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching non-drug contracts:', error)
            return { data: null, error: error.message }
        }

        return { data: data as ContractWithRelations[], error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch non-drug contracts'
        console.error('Exception in getContractNonDrugs:', error)
        return { data: null, error: message }
    }
}

/**
 * Get a single non-drug contract by ID
 */
export async function getContractNonDrugById(
    contractId: string
): Promise<ApiResponse<ContractWithRelations>> {
    try {
        const { data, error } = await supabase
            .from('contract_non_drugs')
            .select('*')
            .eq('id', contractId)
            .single()

        if (error) {
            console.error('Error fetching non-drug contract:', error)
            return { data: null, error: error.message }
        }

        return { data: data as ContractWithRelations, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch non-drug contract'
        console.error('Exception in getContractNonDrugById:', error)
        return { data: null, error: message }
    }
}

/**
 * Create a new non-drug contract
 */
export async function createContractNonDrug(
    hospitalId: string,
    contractData: Partial<Contract>
): Promise<ApiResponse<Contract>> {
    try {
        const newContract: Partial<Contract> = {
            ...contractData,
            hospital_id: hospitalId,
            status: contractData.status || 'active',
            currency: contractData.currency || 'MYR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('contract_non_drugs')
            .insert(newContract)
            .select()
            .single()

        if (error) {
            console.error('Error creating non-drug contract:', error)
            return { data: null, error: error.message }
        }

        return { data: data as Contract, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create non-drug contract'
        console.error('Exception in createContractNonDrug:', error)
        return { data: null, error: message }
    }
}

/**
 * Update an existing non-drug contract
 */
export async function updateContractNonDrug(
    contractId: string,
    contractData: Partial<Contract>
): Promise<ApiResponse<Contract>> {
    try {
        const updates = {
            ...contractData,
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('contract_non_drugs')
            .update(updates)
            .eq('id', contractId)
            .select()
            .single()

        if (error) {
            console.error('Error updating non-drug contract:', error)
            return { data: null, error: error.message }
        }

        return { data: data as Contract, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update non-drug contract'
        console.error('Exception in updateContractNonDrug:', error)
        return { data: null, error: message }
    }
}

/**
 * Delete a non-drug contract
 */
export async function deleteContractNonDrug(contractId: string): Promise<ApiResponse<void>> {
    try {
        const { error } = await supabase.from('contract_non_drugs').delete().eq('id', contractId)

        if (error) {
            console.error('Error deleting non-drug contract:', error)
            return { data: null, error: error.message }
        }

        return { data: null, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete non-drug contract'
        console.error('Exception in deleteContractNonDrug:', error)
        return { data: null, error: message }
    }
}

/**
 * Delete all non-drug contracts for a hospital
 */
export async function deleteAllContractNonDrugs(hospitalId: string): Promise<ApiResponse<{ deleted: number }>> {
    try {
        const { data: existing, error: countError } = await supabase
            .from('contract_non_drugs')
            .select('id', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)

        if (countError) {
            console.error('Error counting non-drug contracts:', countError)
            return { data: null, error: countError.message }
        }

        const { error } = await supabase
            .from('contract_non_drugs')
            .delete()
            .eq('hospital_id', hospitalId)

        if (error) {
            console.error('Error deleting all non-drug contracts:', error)
            return { data: null, error: error.message }
        }

        return { data: { deleted: existing?.length || 0 }, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete all non-drug contracts'
        console.error('Exception in deleteAllContractNonDrugs:', error)
        return { data: null, error: message }
    }
}

/**
 * Get non-drug contract catalog KPIs
 */
export async function getContractNonDrugKPIs(
    hospitalId: string
): Promise<ApiResponse<ContractCatalogKPIs>> {
    try {
        const { data: contracts, error } = await getContractNonDrugs(hospitalId)

        if (error || !contracts) {
            return {
                data: {
                    total: 0,
                    active: 0,
                    expired: 0,
                    expiring_soon: 0,
                    pending: 0,
                    total_value: 0,
                    contracts_by_supplier: [],
                },
                error: error,
            }
        }

        const now = new Date()
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

        const kpis: ContractCatalogKPIs = {
            total: contracts.length,
            active: contracts.filter(c => c.status === 'active').length,
            expired: contracts.filter(c => c.status === 'expired').length,
            expiring_soon: contracts.filter(c => {
                if (!c.end_date) return false
                const endDate = new Date(c.end_date)
                return endDate >= now && endDate <= sixtyDaysFromNow
            }).length,
            pending: contracts.filter(c => c.status === 'pending').length,
            total_value: contracts.reduce((sum, c) => sum + (c.unit_price || 0), 0),
            contracts_by_supplier: [],
        }

        const supplierMap = new Map<string, number>()
        contracts.forEach(contract => {
            const supplier = contract.supplier_name || 'Unknown'
            supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + 1)
        })

        kpis.contracts_by_supplier = Array.from(supplierMap.entries())
            .map(([supplier_name, count]) => ({ supplier_name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        return { data: kpis, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to calculate non-drug KPIs'
        console.error('Exception in getContractNonDrugKPIs:', error)
        return { data: null, error: message }
    }
}

/**
 * Find a non-drug contract by item name (fuzzy match)
 */
export async function findContractByItemName(
    hospitalId: string,
    itemName: string
): Promise<ApiResponse<ContractWithRelations | null>> {
    try {
        if (!itemName) return { data: null, error: null }

        const tokens = itemName.split(/[\s\-\(\)\.]+/).filter(t => t.length > 2)
        const broadSearchTerm = tokens.length > 0 ? tokens[0] : itemName.split(' ')[0]

        if (!broadSearchTerm) return { data: null, error: null }

        const { data, error } = await supabase
            .from('contract_non_drugs')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')
            .ilike('item_name', `%${broadSearchTerm}%`)
            .limit(20)

        if (error) throw error
        if (!data || data.length === 0) return { data: null, error: null }

        let bestMatch: ContractWithRelations | null = null
        let bestScore = 0

        for (const contract of data as ContractWithRelations[]) {
            const score = calculateMatchScore(itemName, contract.item_name)
            if (score > bestScore && score > 0.4) {
                bestScore = score
                bestMatch = contract
            }
        }

        return { data: bestMatch, error: null }
    } catch (error) {
        console.error('Error finding non-drug contract by name:', error)
        return { data: null, error: null }
    }
}

/**
 * Batch import non-drug contracts from Excel data
 */
export async function batchImportContractNonDrugs(
    hospitalId: string,
    contracts: Partial<Contract>[],
    onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void,
    replaceExisting: boolean = false
): Promise<ApiResponse<{ success: number; errors: string[]; replaced: boolean }>> {
    try {
        if (replaceExisting) {
            const deleteResult = await deleteAllContractNonDrugs(hospitalId)
            if (deleteResult.error) {
                return { data: null, error: `Failed to clear existing non-drug contracts: ${deleteResult.error}` }
            }
        }

        const errors: string[] = []
        let successCount = 0

        const validContracts = contracts.filter(
            item => item != null && typeof item === 'object' && Object.keys(item).length > 0
        )

        const totalItems = validContracts.length
        if (onProgress) {
            onProgress({ processed: 0, total: totalItems, success: 0, failed: 0 })
        }

        let existingByCompositeKey: Map<string, { id: string }> | null = null
        if (totalItems > 0) {
            const { data: existing } = await supabase
                .from('contract_non_drugs')
                .select('id, contract_number, item_name')
                .eq('hospital_id', hospitalId)

            if (existing) {
                existingByCompositeKey = new Map(
                    existing.map(c => {
                        const compositeKey = `${c.contract_number?.trim().toUpperCase()}|${c.item_name?.trim().toLowerCase()}`
                        return [compositeKey, { id: c.id }]
                    })
                )
            }
        }

        const processedInBatch = new Set<string>()

        for (let i = 0; i < validContracts.length; i++) {
            const contractData = validContracts[i]

            if (!contractData.item_name || !contractData.contract_number) {
                errors.push(`Row ${i + 2}: Missing required fields (Item Name or Contract Number)`)
                continue
            }

            const contractNumber = String(contractData.contract_number).trim().toUpperCase()
            const itemName = String(contractData.item_name).trim().toLowerCase()
            const compositeKey = `${contractNumber}|${itemName}`

            if (processedInBatch.has(compositeKey)) continue
            processedInBatch.add(compositeKey)

            const startDate = parseContractDate(contractData.start_date)
            const endDate = parseContractDate(contractData.end_date)

            let status: any = 'active'
            if (endDate) {
                const now = new Date()
                const end = new Date(endDate)
                if (end < now) status = 'expired'
            }

            const newContract: Partial<Contract> = {
                hospital_id: hospitalId,
                item_name: contractData.item_name,
                item_code: contractData.item_code,
                contract_number: contractNumber,
                contract_type: contractData.contract_type,
                supplier_id: contractData.supplier_id,
                supplier_name: contractData.supplier_name,
                start_date: startDate,
                end_date: endDate,
                unit: contractData.unit,
                unit_price: contractData.unit_price ? parseFloat(String(contractData.unit_price).replace(/[^0-9.]/g, '')) : undefined,
                currency: contractData.currency || 'MYR',
                delivery_period: contractData.delivery_period,
                sst_rate: contractData.sst_rate,
                status,
                metadata: contractData.metadata || {},
                uploaded_file_id: contractData.uploaded_file_id,
            }

            try {
                const { data: existingData } = await supabase
                    .from('contract_non_drugs')
                    .select('id')
                    .eq('hospital_id', hospitalId)
                    .eq('contract_number', contractNumber)
                    .eq('item_name', contractData.item_name)
                    .maybeSingle()

                const contractToSave = {
                    ...newContract,
                    updated_at: new Date().toISOString(),
                    ...(existingData ? {} : { created_at: new Date().toISOString() })
                }

                if (existingData) {
                    await supabase.from('contract_non_drugs').update(contractToSave).eq('id', existingData.id)
                    successCount++
                } else {
                    const { error: insertError } = await supabase.from('contract_non_drugs').insert(contractToSave)
                    if (insertError) {
                        errors.push(`Row ${i + 2}: ${insertError.message}`)
                    } else {
                        successCount++
                    }
                }
            } catch (err) {
                errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }

            if (onProgress) {
                onProgress({ processed: i + 1, total: totalItems, success: successCount, failed: errors.length })
            }
        }

        return { data: { success: successCount, errors, replaced: replaceExisting }, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Import failed' }
    }
}

/**
 * Export non-drug contracts to CSV
 */
export async function exportContractNonDrugCatalog(
    hospitalId: string,
    filter?: ContractCatalogFilter
): Promise<ApiResponse<string>> {
    try {
        const { data: contracts, error } = await getContractNonDrugs(hospitalId, filter)

        if (error || !contracts) {
            return { data: null, error: error || 'No contracts to export' }
        }

        const headers = ['Item Name', 'No Kontrak', 'Kontrak Mula', 'Kontrak Tamat', 'Pembekal', 'Unit', 'Harga (RM)', 'Tempoh Serahan', 'SST', 'Status']
        const rows = contracts.map(c => [
            c.item_name || '', c.contract_number || '', c.start_date || '', c.end_date || '',
            c.supplier_name || '', c.unit || '', c.unit_price?.toFixed(2) || '', c.delivery_period || '',
            c.sst_rate || '', c.status || ''
        ])

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `contract-non-drug-catalog-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)

        return { data: 'Export successful', error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Export failed' }
    }
}

// Internal helper for date parsing
function parseContractDate(dateValue: any): string | null {
    if (!dateValue) return null
    const dateStr = String(dateValue).trim()

    if (!isNaN(Number(dateStr)) && Number(dateStr) > 25569) {
        const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000)
        return excelDate.toISOString().split('T')[0]
    }

    try {
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
    } catch { }

    return null
}

// Internal helper for fuzzy matching score
function normalizeForMatch(str: string): string {
    if (!str) return ''
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function calculateMatchScore(str1: string, str2: string): number {
    const norm1 = normalizeForMatch(str1)
    const norm2 = normalizeForMatch(str2)
    if (norm1 === norm2) return 1
    const tokens1 = new Set(norm1.split(' '))
    const tokens2 = new Set(norm2.split(' '))
    let matchCount = 0
    tokens1.forEach(t => { if (tokens2.has(t)) matchCount++ })
    return (2 * matchCount) / (tokens1.size + tokens2.size)
}
