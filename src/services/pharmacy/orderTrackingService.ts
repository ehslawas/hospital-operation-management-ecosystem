import { supabase } from '@/services/supabase'
import { OrderTracking, OrderTrackingWithRelations } from '@/types/pharmacy/procurementNew'
import { calculateWorkingDaysDate } from '@/utils/deliveryCalculations'
import { findContractByNumber } from './contractCatalogService'
import { penaltyService } from './penaltyService'

const TABLE_NAME = 'pharmacy_order_tracking'

export const orderTrackingService = {
    // Initialize tracking for all items in an LPO
    async createTrackingRecords(
        lpoId: string,
        poItems: any[],
        lpoDate: string,
        voteCode?: string,
        contractNumber?: string,
        hospitalId?: string,
        customDeliveryDate?: string
    ): Promise<void> {
        // Normalize inputs
        const cleanVoteCode = voteCode?.trim()
        const cleanContract = contractNumber?.trim()

        if (cleanVoteCode === '080702' && cleanContract && hospitalId) {
            try {
                const { data: contract } = await findContractByNumber(hospitalId, cleanContract)
                if (contract) {
                    // Contract validation exists
                }
            } catch (e) {
                console.error("Error fetching contract for tracking date", e)
            }
        }

        const trackingRecords = poItems
            .filter(item => item.item_id || item.id) // Filter items - fallback to PO item id if item_id (catalog link) is missing
            .map(item => {
                const isDrug = item.item_type === 'drug' || !!item.drug
                const itemData = isDrug ? item.drug : item.non_drug
                const itemType = isDrug ? 'drug' : 'non_drug'
                const itemCode = item.item_code || itemData?.code || 'UNKNOWN'

                // Determine category
                let category = 'CC' // Default
                if (cleanVoteCode === '990102') category = 'APPL'
                else if (cleanVoteCode === '080702') category = 'CC'
                else {
                    // Fallback to legacy check
                    category = itemCode === '990102' ? 'APPL' : 'CC'
                }

                // Calculate Expected Delivery Date
                let expectedDate: Date
                if (customDeliveryDate) {
                    expectedDate = new Date(customDeliveryDate)
                } else if (category === 'APPL') {
                    // APPL: 10 working days strictly
                    expectedDate = calculateWorkingDaysDate(lpoDate, 10)
                } else if (category === 'CC') {
                    // CC: Check for KKM contract number
                    if (cleanContract) {
                        // Has KKM contract: 30 working days
                        expectedDate = calculateWorkingDaysDate(lpoDate, 30)
                    } else {
                        // No KKM contract: 16 weeks (approx 80 working days)
                        expectedDate = calculateWorkingDaysDate(lpoDate, 80)
                    }
                } else {
                    // Fallback for other vote codes: 30 days
                    expectedDate = calculateWorkingDaysDate(lpoDate, 30)
                }

                return {
                    lpo_id: lpoId,
                    item_id: item.item_id || item.id, // Fallback to PO item ID for manual/unlinked items
                    item_type: itemType,
                    item_code: itemCode,
                    item_category: category,
                    expected_delivery_date: expectedDate.toISOString(),
                    order_placed_date: lpoDate,
                    status: 'pending',
                    is_overdue: false,
                    days_overdue: 0,
                    reminder_count: 0
                }
            })

        if (trackingRecords.length > 0) {
            // Use Upsert to allow correcting existing records if they exist but we want to refresh?
            // BUT: ID is auto-generated. We don't have IDs here.
            // So we can only INSERT. Rely on service to clear old ones if needed or check duplicates.
            const { error } = await supabase
                .from(TABLE_NAME)
                .insert(trackingRecords)

            if (error) {
                console.error('Error creating tracking records:', error)
                throw error
            }
        }
    },

    // Get tracking records for an LPO
    async getTrackingByLPO(lpoId: string): Promise<OrderTrackingWithRelations[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
                *,
                lpo:pharmacy_lpo!inner(lpo_number)
            `)
            .eq('lpo_id', lpoId)

        if (error) throw error
        return data || []
    },

    // Get all active tracking records (pending/in_transit)
    async getActiveTracking(): Promise<OrderTrackingWithRelations[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
                *,
                lpo:pharmacy_lpo!inner(
                    lpo_number, 
                    purchase_order:pharmacy_purchase_orders(
                        supplier:suppliers(company_name, email)
                    )
                )
            `)
            .in('status', ['pending', 'in_transit', 'overdue'])
            .order('expected_delivery_date', { ascending: true })

        if (error) throw error
        return data || []
    },

    // Get active LPOs for tracking (aggregated view)
    async getActiveLPOsForTracking(): Promise<any[]> {
        // We fetch distinct LPOs that have at least one active tracking item
        // Note: Accessing nested relations for status check is tricky in one go
        // So we fetch all active tracking items, then group by LPO client-side or
        // we fetch LPOs and filter those with active tracking items.
        // Let's use the LPO table as base since we want LPO-level rows.

        const { data, error } = await supabase
            .from('pharmacy_lpo')
            .select(`
                 *,
                 purchase_order:pharmacy_purchase_orders(
                     manual_supplier_name,
                     supplier:suppliers(company_name, email)
                 ),
                 tracking_items:pharmacy_order_tracking(*)
             `)
            .in('status', ['generated', 'uploaded', 'sent'])

        if (error) throw error

        if (!data) return []

        // Return LPOs that have active items
        return data.filter(lpo =>
            lpo.tracking_items &&
            lpo.tracking_items.length > 0 &&
            lpo.tracking_items.some((item: any) => ['pending', 'in_transit', 'overdue'].includes(item.status))
        )
    },

    // Get active LPOs for tracking (aggregated view) by vote code
    async getActiveLPOsByVoteCode(voteCode: string): Promise<any[]> {
        let query = supabase
            .from('pharmacy_lpo')
            .select(`
                 *,
                 purchase_order:pharmacy_purchase_orders(
                     vote_code,
                     hospital_id,
                     po_number,
                     manual_supplier_name,
                     supplier:suppliers(company_name, email)
                 ),
                 tracking_items:pharmacy_order_tracking(*)
             `)
            // We remove the strict status filter and rely on tracking items below
            .not('status', 'eq', 'cancelled')

        if (voteCode === 'other') {
            // Filter where vote_code is null or not in the main two
            // We use a left join check: either purchase_order is null, or it has a non-standard vote code
            const { data, error } = await query
            if (error) throw error
            return (data || []).filter(lpo => {
                const vc = lpo.purchase_order?.vote_code
                const isStandard = vc === '990102' || vc === '080702'
                const hasActiveItems = lpo.tracking_items?.some((item: any) => ['pending', 'in_transit', 'overdue'].includes(item.status))
                return !isStandard && hasActiveItems
            })
        } else {
            query = query.eq('purchase_order.vote_code', voteCode)
            const { data, error } = await query
            if (error) throw error
            return (data || []).filter(lpo =>
                lpo.tracking_items?.some((item: any) => ['pending', 'in_transit', 'overdue'].includes(item.status))
            )
        }
    },

    // Get a summary across all active LPOs for KPIs
    async getActiveLPOsSummary(): Promise<{ total: number, overdue: number, partial: number, pendingToReceive: number, allData: any[] }> {
        const { data, error } = await supabase
            .from('pharmacy_lpo')
            .select(`
                 *,
                 purchase_order:pharmacy_purchase_orders(
                     vote_code,
                     hospital_id,
                     po_number,
                     manual_supplier_name,
                     kkm_contract_number,
                     supplier:suppliers(company_name, email)
                 ),
                 tracking_items:pharmacy_order_tracking(*)
             `)
            .not('status', 'eq', 'cancelled')

        if (error) throw error
        if (!data) return { total: 0, overdue: 0, partial: 0, pendingToReceive: 0, allData: [] }

        // Filter for LPOs with active tracking items OR verified status (even if no items)
        const activeLPOs = data.filter(lpo => {
            const hasActiveItems = lpo.tracking_items &&
                lpo.tracking_items.length > 0 &&
                lpo.tracking_items.some((item: any) => ['pending', 'in_transit', 'overdue'].includes(item.status))

            const isVerifiedOrphan = lpo.status === 'verified'

            return hasActiveItems || isVerifiedOrphan
        })

        // Real-time calculations
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Compare dates correctly

        const overdue = activeLPOs.filter(l =>
            l.tracking_items?.some((i: any) =>
                (i.status === 'pending' || i.status === 'in_transit' || i.status === 'overdue') &&
                new Date(i.expected_delivery_date) < today
            )
        ).length

        const partial = activeLPOs.filter(l =>
            l.tracking_items?.some((i: any) => i.status === 'delivered') &&
            !l.tracking_items?.every((i: any) => i.status === 'delivered')
        ).length

        // Count LPOs where 0 items have been received yet (Purely Pending)
        const pendingToReceive = activeLPOs.filter(l =>
            l.tracking_items?.length > 0 &&
            l.tracking_items?.every((i: any) => i.status !== 'delivered')
        ).length

        return {
            total: activeLPOs.length,
            overdue,
            partial,
            pendingToReceive,
            allData: activeLPOs
        }
    },

    // Update status (e.g., when item is received)
    async updateTrackingStatus(id: string, status: string, actualDate?: string): Promise<OrderTracking> {
        const updates: any = { status }
        if (actualDate) {
            updates.actual_delivery_date = actualDate

            // Calculate duration
            // We need to fetch order_placed_date first or do it in two steps
            // distinct query for simplicity
        }

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Check and update overdue status
    async checkOverdueItems(): Promise<void> {
        // This should run periodically. 
        // 1. Fetch all pending/in_transit items where expected_date < today
        // 2. Update their status to 'overdue', is_overdue = true, calculate days_overdue

        const today = new Date().toISOString().split('T')[0]

        const { data: overdueItems, error: fetchError } = await supabase
            .from(TABLE_NAME)
            .select('id, expected_delivery_date')
            .lt('expected_delivery_date', today)
            .in('status', ['pending', 'in_transit'])

        if (fetchError) throw fetchError

        if (overdueItems && overdueItems.length > 0) {
            // Bulk update not directly supported with different values, so loop or logical SQL func needed
            // For now, simplistic loop (not efficient for thousands, but ok for hundreds)
            for (const item of overdueItems) {
                const expected = new Date(item.expected_delivery_date)
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - expected.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                await supabase
                    .from(TABLE_NAME)
                    .update({
                        status: 'overdue',
                        days_overdue: diffDays
                    })
                    .eq('id', item.id)

                // Trigger Penalty Creation
                if (diffDays > 0) {
                    try {
                        await penaltyService.calculateAndCreatePenalty(item.id)
                    } catch (penaltyError) {
                        console.error('Failed to auto-create penalty:', penaltyError)
                    }
                }
            }
        }
    },

    // Record that a reminder was sent
    async markReminderSent(id: string): Promise<void> {
        const { data: current } = await supabase
            .from(TABLE_NAME)
            .select('reminder_count')
            .eq('id', id)
            .single()

        const count = (current?.reminder_count || 0) + 1

        await supabase
            .from(TABLE_NAME)
            .update({
                last_reminder_sent: new Date().toISOString(),
                reminder_count: count,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
    },

    // Delete all tracking records for an LPO
    async deleteTrackingByLPO(lpoId: string): Promise<void> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('lpo_id', lpoId)

        if (error) throw error
    },

    // Update Expected Delivery Date for all items in an LPO
    async updateDeliveryDate(lpoId: string, newDate: string): Promise<void> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .update({
                expected_delivery_date: newDate,
                updated_at: new Date().toISOString()
            })
            .eq('lpo_id', lpoId)

        if (error) throw error
    },

    // Self-healing: Audit and fix dates (specifically for the APPL 0-day bug)
    // Returns the number of records fixed
    async auditAndFixTrackingDates(lpos: any[]): Promise<number> {
        let fixedCount = 0

        for (const lpo of lpos) {
            const items = lpo.tracking_items || []

            // Repair Orphaned LPOs (Verified but 0 tracking items)
            if (items.length === 0) {
                if (lpo.status === 'verified') {
                    console.log(`[Audit] Found orphaned LPO ${lpo.lpo_number}. ID: ${lpo.id}, PO_ID: ${lpo.po_id}`)

                    if (!lpo.po_id) {
                        console.error(`[Audit] LPO ${lpo.lpo_number} is missing po_id. Cannot repair.`)
                        continue
                    }

                    // Fetch PO items without invalid drug/non_drug joins
                    const { data: poItems, error: poError } = await supabase
                        .from('pharmacy_purchase_order_items')
                        .select('*')
                        .eq('po_id', lpo.po_id)

                    if (poError || !poItems || poItems.length === 0) {
                        console.error(`[Audit] Failed to repair LPO ${lpo.lpo_number}: No items found in pharmacy_purchase_order_items`, poError)
                        continue
                    }

                    console.log(`[Audit] Found ${poItems.length} items for PO ${lpo.po_id}. Regenerating tracking...`)

                    // Handle purchase_order as object or array
                    const poRaw = lpo.purchase_order
                    const po = Array.isArray(poRaw) ? poRaw[0] : (poRaw || {})

                    try {
                        await this.createTrackingRecords(
                            lpo.id,
                            poItems,
                            lpo.document_date || lpo.created_at || new Date().toISOString(),
                            po.vote_code,
                            po.kkm_contract_number,
                            po.hospital_id
                        )

                        fixedCount++
                        console.log(`[Audit] SUCCESS: Repaired orphan LPO ${lpo.lpo_number}.`)
                    } catch (err) {
                        console.error(`[Audit] ERROR: Failed to create tracking for LPO ${lpo.lpo_number}:`, err)
                    }
                }
                continue
            }

            // Use LPO document date as the robust source of truth
            const sourceDate = lpo.document_date
            if (!sourceDate) continue // Can't fix without a reliable LPO date

            for (const item of items) {
                // Target items that are Pending OR Overdue (often false positives)
                if (item.status === 'pending' || item.status === 'overdue') {

                    let workingDays = 0
                    let shouldFix = false

                    if (item.item_category === 'APPL') {
                        workingDays = 10
                        shouldFix = true
                    } else if (item.item_category === 'CC') {
                        // Check contract
                        const contractNum = lpo.purchase_order?.kkm_contract_number
                        if (contractNum && contractNum.trim().length > 0) {
                            workingDays = 30
                        } else {
                            workingDays = 80
                        }
                        shouldFix = true
                    }

                    if (shouldFix && workingDays > 0) {
                        // Recalculate correct date
                        const correctDate = calculateWorkingDaysDate(sourceDate, workingDays)
                        const currentDate = new Date(item.expected_delivery_date)

                        // If dates differ significantly (more than 2 days)
                        // It fixes BOTH the 0-day bug (diff ~10+ days) AND incorrect calc bugs
                        const diffTime = Math.abs(correctDate.getTime() - currentDate.getTime())
                        const diffDays = diffTime / (1000 * 60 * 60 * 24)

                        if (diffDays > 2) {
                            console.log(`Auto-fixing date for item ${item.id} (${item.item_category}) LPO ${lpo.lpo_number}. Current: ${currentDate.toISOString()}, Correct: ${correctDate.toISOString()}`)

                            await supabase
                                .from(TABLE_NAME)
                                .update({
                                    expected_delivery_date: correctDate.toISOString(),
                                    // Reset overdue status if it was false-positive
                                    status: 'pending',
                                    is_overdue: false,
                                    days_overdue: 0
                                })
                                .eq('id', item.id)

                            fixedCount++
                        }
                    }
                }
            }
        }

        if (fixedCount > 0) {
            console.log(`Fixed ${fixedCount} tracking records.`)
        }

        return fixedCount
    }
}
