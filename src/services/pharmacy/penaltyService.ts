import { supabase } from '@/services/supabase'
import { Penalty } from '@/types/pharmacy/procurementNew'

const TABLE_NAME = 'pharmacy_penalties'

export const penaltyService = {
    // Calculate and create/update penalty for an overdue item
    async calculateAndCreatePenalty(trackingId: string, ratePerDay: number = 50): Promise<Penalty | null> {
        // 1. Fetch Tracking Info
        const { data: tracking, error: trackingError } = await supabase
            .from('pharmacy_order_tracking')
            .select(`
                *,
                lpo:pharmacy_lpo!inner(id, lpo_number)
            `)
            .eq('id', trackingId)
            .single()

        if (trackingError || !tracking) {
            console.error('Error fetching tracking for penalty:', trackingError)
            return null
        }

        if (!tracking.is_overdue || tracking.days_overdue <= 0) {
            console.warn('Item is not overdue, cannot calculate penalty')
            return null
        }

        // 2. Calculate Amount
        // default rate is RM50/day or whatever provided (LAD - Liquidated Ascertained Damages)
        // ideally fetched from contract
        const penaltyAmount = tracking.days_overdue * ratePerDay

        // 3. Check existing penalty
        const { data: existing } = await supabase
            .from(TABLE_NAME)
            .select('id')
            .eq('order_tracking_id', trackingId)
            .single()

        const penaltyData = {
            lpo_id: tracking.lpo_id,
            order_tracking_id: trackingId,
            days_overdue: tracking.days_overdue,
            penalty_rate: ratePerDay,
            penalty_amount: penaltyAmount,
            status: 'pending' as const
        }

        let result
        if (existing) {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update({ ...penaltyData, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert(penaltyData)
                .select()
                .single()
            if (error) throw error
            result = data
        }

        return result
    },

    // Get all penalties
    async getPenalties(): Promise<Penalty[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
                *,
                lpo:pharmacy_lpo!inner(lpo_number),
                order_tracking:pharmacy_order_tracking(item_id, item_type)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Penalty[]
    },

    // Acknowledge/Pay Penalty
    async updatePenaltyStatus(id: string, status: 'issued' | 'paid' | 'waived', paymentDetails?: any) {
        const updates: any = { status, updated_at: new Date().toISOString() }

        if (status === 'paid' && paymentDetails) {
            updates.penalty_paid = true
            updates.payment_method = paymentDetails.method
            updates.payment_reference = paymentDetails.reference
            updates.payment_date = new Date().toISOString()
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

    // Generate Penalty Notice (Mock PDF URL for now)
    async generatePenaltyNotice(id: string) {
        // In real impl, use jsPDF or backend function
        const noticeUrl = `https://placeholder-pdf-gen.com/penalty/${id}.pdf`

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({ penalty_notice_url: noticeUrl })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
        if (error) throw error
        return data
    },

    // Delete penalties by LPO ID
    async deletePenaltiesByLPO(lpoId: string): Promise<void> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('lpo_id', lpoId)

        if (error) throw error
    }
}
