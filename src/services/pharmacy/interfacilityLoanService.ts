/**
 * Interfacility Loan Service
 * Handles borrowing and lending between different hospital/clinic facilities
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
    LoanRecord,
    LoanRecordWithRelations,
    LoanReturn
} from '@/types/pharmacy'

/**
 * Get all loan records with optional filtering
 */
export async function getLoanRecords(
    hospitalId: string,
    filter?: {
        type?: 'borrowed' | 'lent' | 'all'
        status?: string
        search?: string
    },
    page: number = 1,
    pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<LoanRecordWithRelations>>> {
    try {
        let query = supabase
            .from('pharmacy_loan_records')
            .select(`
                *,
                transfer:pharmacy_transfer_requests(*)
            `, { count: 'exact' })
            .eq('hospital_id', hospitalId)

        if (filter?.type && filter.type !== 'all') {
            query = query.eq('loan_type', filter.type)
        }

        if (filter?.status && filter.status !== 'all') {
            query = query.eq('status', filter.status)
        }

        if (filter?.search) {
            query = query.ilike('loan_number', `%${filter.search}%`)
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await query
            .order('loan_date', { ascending: false })
            .range(from, to)

        if (error) throw error

        // Manually fetch counterparty facility based on ID since it could be hospital or clinic
        const records = data as any[]
        for (const record of records) {
            if (record.counterparty_facility_id) {
                // Try hospital facilities first
                const { data: hosp } = await supabase
                    .from('hospital_facilities')
                    .select('*')
                    .eq('id', record.counterparty_facility_id)
                    .single()

                if (hosp) {
                    record.counterparty_facility = hosp
                } else {
                    // Try clinic facilities
                    const { data: clinic } = await supabase
                        .from('clinic_facilities')
                        .select('*')
                        .eq('id', record.counterparty_facility_id)
                        .single()
                    record.counterparty_facility = clinic
                }
            }
        }

        return {
            data: {
                data: records as LoanRecordWithRelations[],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            },
            error: null
        }
    } catch (error) {
        console.error('Error fetching loan records:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Get a single loan record with brief counterparty info
 */
export async function getLoanRecordDetail(
    loanId: string
): Promise<ApiResponse<LoanRecordWithRelations>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_loan_records')
            .select(`
                *,
                created_by_user:users(email, full_name)
            `)
            .eq('id', loanId)
            .single()

        if (error) throw error

        const record = data as any

        // Fetch counterparty
        if (record.counterparty_facility_id) {
            const { data: hosp } = await supabase
                .from('hospital_facilities')
                .select('*')
                .eq('id', record.counterparty_facility_id)
                .single()

            if (hosp) {
                record.counterparty_facility = hosp
            } else {
                const { data: clinic } = await supabase
                    .from('clinic_facilities')
                    .select('*')
                    .eq('id', record.counterparty_facility_id)
                    .single()
                record.counterparty_facility = clinic
            }
        }

        return { data: record as LoanRecordWithRelations, error: null }
    } catch (error) {
        console.error('Error fetching loan record detail:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Get items for a loan record with catalog details
 */
export async function getLoanItems(
    loanId: string
): Promise<ApiResponse<any[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_loan_items')
            .select(`
                *,
                catalog_item:pharmacy_unit_catalog_items(*)
            `)
            .eq('loan_id', loanId)

        if (error) throw error

        // Enhance catalog items with drug/non-drug details
        const items = data as any[]
        for (const item of items) {
            // Strategy 1: Try to get details via joined Unit Catalog Item (preferred)
            if (item.catalog_item) {
                const catalogItem = item.catalog_item
                const { data: details } = await supabase
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
                    .eq('id', catalogItem.id)
                    .maybeSingle()

                if (details && (details.drug || details.non_drug)) {
                    item.catalog_item_details = details;
                    continue;
                }
            }

            // Strategy 2: Fallback to direct item_id lookup in master lists (drugs/non_drugs)
            if (item.item_id && item.item_type) {
                if (item.item_type === 'drug') {
                    const { data: drug } = await supabase
                        .from('drugs')
                        .select('id, drug_code, drug_name, unit_of_measure')
                        .eq('id', item.item_id)
                        .maybeSingle()

                    if (drug) {
                        item.catalog_item_details = {
                            id: item.unit_catalog_item_id || 'fallback',
                            item_type: 'drug',
                            drug_id: item.item_id,
                            drug: drug
                        };
                        continue;
                    }
                } else if (item.item_type === 'non_drug') {
                    const { data: nonDrug } = await supabase
                        .from('non_drugs')
                        .select('id, item_code, item_name, unit_of_measure')
                        .eq('id', item.item_id)
                        .maybeSingle()

                    if (nonDrug) {
                        item.catalog_item_details = {
                            id: item.unit_catalog_item_id || 'fallback',
                            item_type: 'non_drug',
                            non_drug_id: item.item_id,
                            non_drug: nonDrug
                        };
                        continue;
                    }
                }
            }

            // Strategy 3: "Desperation Mode" - Check if item_id is accidentally a pharmacy_unit_catalog_items ID
            if (item.item_id) {
                const { data: details } = await supabase
                    .from('pharmacy_unit_catalog_items')
                    .select(`
                        *,
                        drug:drugs(id, drug_code, drug_name, unit_of_measure),
                        non_drug:non_drugs(id, item_code, item_name, unit_of_measure),
                        contract:contracts(id, item_code, item_name),
                        appl_drug:appl_drugs(id, item_code, item_name),
                        appl_non_drug:appl_non_drugs(id, item_code, item_name),
                        lp_drug:lp_drugs(id, item_code, item_name),
                        lp_non_drug:lp_non_drugs(id, item_code, item_name)
                    `)
                    .eq('id', item.item_id)
                    .maybeSingle()

                if (details && (details.drug || details.non_drug || details.appl_drug || details.lp_drug || details.contract)) {
                    item.catalog_item_details = details;
                }
            }
        }

        return { data: items, error: null }
    } catch (error) {
        console.error('Error fetching loan items:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Create a new loan record
 */
export async function createLoanRecord(
    hospitalId: string,
    userId: string,
    data: Partial<LoanRecord> & { items: any[] }
): Promise<ApiResponse<LoanRecord>> {
    try {
        const now = new Date()
        const loanNumber = `LN-${data.loan_type === 'borrowed' ? 'BR' : 'LD'}-${now.getFullYear()}-${String(Date.now()).slice(-6)}`

        const loanData = {
            hospital_id: hospitalId,
            loan_number: loanNumber,
            loan_type: data.loan_type,
            counterparty_facility_id: data.counterparty_facility_id,
            counterparty_name: data.counterparty_name,
            loan_date: data.loan_date || now.toISOString(),
            expected_return_date: data.expected_return_date,
            status: 'active',
            notes: data.notes,
            created_by: userId,
            transfer_id: data.transfer_id
        }

        const { data: inserted, error } = await supabase
            .from('pharmacy_loan_records')
            .insert(loanData)
            .select('*')
            .single()

        if (error) throw error

        // Create loan items if provided
        if (data.items && data.items.length > 0) {
            const items = data.items.map(item => ({
                loan_id: inserted.id,
                item_id: item.item_id,
                item_type: item.item_type,
                unit_catalog_item_id: item.unit_catalog_item_id,
                quantity_loaned: item.quantity,
                quantity_returned: 0,
                notes: item.remarks
            }))

            const { error: itemsError } = await supabase
                .from('pharmacy_loan_items')
                .insert(items)

            if (itemsError) throw itemsError
        }

        return { data: inserted as LoanRecord, error: null }
    } catch (error) {
        console.error('Error creating loan record:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Record a loan return and handle inventory adjustments
 */
export async function recordLoanReturn(
    hospitalId: string,
    userId: string,
    loanId: string,
    items: Array<{ loan_item_id: string; quantity: number; notes?: string }>
): Promise<ApiResponse<LoanReturn>> {
    try {
        const now = new Date()
        const returnNumber = `RTN-${now.getFullYear()}-${String(Date.now()).slice(-6)}`

        // 1. Create Return Record
        const { data: returnRecord, error: returnError } = await supabase
            .from('pharmacy_loan_returns')
            .insert({
                loan_id: loanId,
                return_number: returnNumber,
                return_date: now.toISOString(),
                created_by: userId,
                notes: items.map(i => i.notes).filter(Boolean).join('; ')
            })
            .select('*')
            .single()

        if (returnError) throw returnError

        // 2. Create Return Items and Update Loan Items
        for (const item of items) {
            // Insert return item
            const { error: itemInsertError } = await supabase
                .from('pharmacy_loan_return_items')
                .insert({
                    return_id: returnRecord.id,
                    loan_item_id: item.loan_item_id,
                    quantity_returned: item.quantity
                })

            if (itemInsertError) throw itemInsertError

            // Fetch loan item to get current stats and item info
            const { data: loanItem, error: fetchErr } = await supabase
                .from('pharmacy_loan_items')
                .select('quantity_loaned, quantity_returned, unit_catalog_item_id, item_type, item_id')
                .eq('id', item.loan_item_id)
                .single()

            if (fetchErr) throw fetchErr

            // Update loan item's quantity_returned
            const newReturned = (loanItem.quantity_returned || 0) + item.quantity
            const { error: updateErr } = await supabase
                .from('pharmacy_loan_items')
                .update({ quantity_returned: newReturned })
                .eq('id', item.loan_item_id)

            if (updateErr) throw updateErr

            // 3. Inventory Adjustment
            const { data: loanRec } = await supabase
                .from('pharmacy_loan_records')
                .select('loan_type')
                .eq('id', loanId)
                .single()

            if (!loanRec) continue;

            const isLent = loanRec.loan_type === 'lent'
            const change = isLent ? item.quantity : -item.quantity

            // Record Stock Transaction
            await supabase
                .from('pharmacy_stock_transactions')
                .insert({
                    hospital_id: hospitalId,
                    item_id: loanItem.item_id,
                    item_type: loanItem.item_type,
                    transaction_type: isLent ? 'loan_return' : 'return_to_borrower',
                    quantity: change,
                    reference_id: returnRecord.id,
                    user_id: userId,
                    transaction_date: now.toISOString(),
                    notes: `Return for loan ${loanId}`
                })

            // Update Stock Batches
            if (isLent) {
                // They returned items to us -> INCREASE stock
                const { data: existingBatch } = await supabase
                    .from('pharmacy_stock_batches')
                    .select('*')
                    .eq('hospital_id', hospitalId)
                    .eq('item_id', loanItem.item_id)
                    .eq('item_type', loanItem.item_type)
                    .limit(1)
                    .maybeSingle()

                if (existingBatch) {
                    await supabase
                        .from('pharmacy_stock_batches')
                        .update({
                            quantity_on_hand: (existingBatch.quantity_on_hand || 0) + item.quantity
                        })
                        .eq('id', existingBatch.id)
                } else {
                    await supabase
                        .from('pharmacy_stock_batches')
                        .insert({
                            hospital_id: hospitalId,
                            item_id: loanItem.item_id,
                            item_type: loanItem.item_type,
                            batch_number: 'RETURN-' + loanId.slice(0, 4).toUpperCase(),
                            quantity_received: item.quantity,
                            quantity_on_hand: item.quantity,
                            status: 'active'
                        })
                }
            } else {
                // We returned items back to them -> DECREASE stock
                const { data: activeBatches } = await supabase
                    .from('pharmacy_stock_batches')
                    .select('*')
                    .eq('hospital_id', hospitalId)
                    .eq('item_id', loanItem.item_id)
                    .eq('item_type', loanItem.item_type)
                    .gt('quantity_on_hand', 0)
                    .order('expiry_date', { ascending: true })

                let remainingToSubtract = item.quantity
                if (activeBatches) {
                    for (const batch of activeBatches) {
                        if (remainingToSubtract <= 0) break
                        const subtractAmount = Math.min(batch.quantity_on_hand, remainingToSubtract)
                        await supabase
                            .from('pharmacy_stock_batches')
                            .update({
                                quantity_on_hand: batch.quantity_on_hand - subtractAmount
                            })
                            .eq('id', batch.id)
                        remainingToSubtract -= subtractAmount
                    }
                }
            }
        }

        // 4. Update Loan Record Status
        const { data: remainingItems } = await supabase
            .from('pharmacy_loan_items')
            .select('quantity_loaned, quantity_returned')
            .eq('loan_id', loanId)

        const isFullyReturned = remainingItems?.every(i => (i.quantity_returned || 0) >= i.quantity_loaned)
        const isPartial = remainingItems?.some(i => (i.quantity_returned || 0) > 0)

        await supabase
            .from('pharmacy_loan_records')
            .update({
                status: isFullyReturned ? 'fully_returned' : (isPartial ? 'partial_return' : 'active'),
                updated_at: now.toISOString()
            })
            .eq('id', loanId)

        return { data: returnRecord as LoanReturn, error: null }
    } catch (error) {
        console.error('Error recording loan return:', error)
        return { data: null, error: (error as Error).message }
    }
}
/**
 * Get returns for a specific loan
 */
export async function getLoanReturns(
    loanId: string
): Promise<ApiResponse<any[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_loan_returns')
            .select(`
                *,
                created_by_user:users(email, full_name),
                return_items:pharmacy_loan_return_items(
                    *,
                    loan_item:pharmacy_loan_items(*)
                )
            `)
            .eq('loan_id', loanId)
            .order('return_date', { ascending: false })

        if (error) throw error
        return { data: data || [], error: null }
    } catch (error) {
        console.error('Error fetching loan returns:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Get return items for a specific return record
 */
export async function getReturnItems(
    returnId: string
): Promise<ApiResponse<any[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_loan_return_items')
            .select(`
                *,
                loan_item:pharmacy_loan_items(*)
            `)
            .eq('return_id', returnId)

        if (error) throw error
        return { data: data || [], error: null }
    } catch (error) {
        console.error('Error fetching return items:', error)
        return { data: null, error: (error as Error).message }
    }
}
/**
 * Get statistics for loan records
 */
export async function getLoanStats(
    hospitalId: string
): Promise<ApiResponse<{
    total: number
    active: number
    borrowed: number
    lent: number
}>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_loan_records')
            .select('loan_type, status')
            .eq('hospital_id', hospitalId)

        if (error) throw error

        const stats = {
            total: data.length,
            active: data.filter(r => ['active', 'partial_return'].includes(r.status)).length,
            borrowed: data.filter(r => r.loan_type === 'borrowed').length,
            lent: data.filter(r => r.loan_type === 'lent').length
        }

        return { data: stats, error: null }
    } catch (error) {
        console.error('Error fetching loan stats:', error)
        return { data: null, error: (error as Error).message }
    }
}
