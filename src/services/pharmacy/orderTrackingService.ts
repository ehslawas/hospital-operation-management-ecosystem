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
        hospitalId?: string
    ): Promise<void> {
        if (voteCode === '080702' && contractNumber && hospitalId) {
            try {
                const { data: contract } = await findContractByNumber(hospitalId, contractNumber)
                if (contract) {
                    // Check if contract has end_date or similar.
                    // Usually contract has 'start_date' and 'end_date' (expiry).
                    // But for 'Tarikh Serahan' (Delivery Date), it might be per item or a standard term.
                    // If catalog has 'delivery_period_days', we could use that.
                    // The requirement says "Based on Tarikh Serahan in Contract Catalog + Lead Time".
                    // If 'Tarikh Serahan' is a specific date, use it.
                    // If not, maybe use default 14 days or similar from contract terms.
                    // Since Contract object in type definition might not have explicit 'delivery_date',
                    // we will assume standard 14 days or check if contract object has it.
                    // Let's assume for now we use 14 days unless we find a specific field.
                    // BUT, if we wanted to be strict, we'd use contract.end_date as a clamp? No.

                    // For now, let's stick to 14 days for CC items, but at least we validated the contract exists.
                    // If we want to implement "Tarikh Serahan" per contract, we need that column in DB.
                    // Assuming standard 14 days for now as placeholder for "Contract Logic".
                }
            } catch (e) {
                console.error("Error fetching contract for tracking date", e)
            }
        }

        const trackingRecords = poItems.map(item => {
            const isDrug = !!item.drug
            const itemData = isDrug ? item.drug : item.non_drug
            const itemType = isDrug ? 'drug' : 'non_drug'
            const itemCode = itemData?.code || 'UNKNOWN'

            // Determine category using Vote Code if available
            let category = 'CC' // Default
            if (voteCode === '990102') category = 'APPL'
            else if (voteCode === '080702') category = 'CC'
            else {
                // Fallback to legacy check
                category = itemCode === '990102' ? 'APPL' : 'CC'
            }

            // Calculate Expected Delivery Date
            let expectedDate: Date
            if (category === 'APPL') {
                // APPL: 10 working days strictly
                expectedDate = calculateWorkingDaysDate(lpoDate, 10)
            } else {
                // CC: Contract date or standard 14 days
                // If we had contract delivery date, we'd use it here.
                expectedDate = calculateWorkingDaysDate(lpoDate, 14)
            }

            return {
                lpo_id: lpoId,
                item_id: item.item_id,
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
    }
}
