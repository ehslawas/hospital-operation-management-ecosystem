import { supabase } from '@/services/supabase'
import { Penalty, OrderTracking } from '@/types/pharmacy/procurementNew'

const TABLE_NAME = 'pharmacy_penalties'

export const penaltyService = {
    // Calculate and create/update penalty for an overdue item
    async calculateAndCreatePenalty(trackingId: string, ratePerDay: number = 50) {
        try {
            // 1. Get tracking item with LPO details
            const { data: tracking, error: trackingError } = await supabase
                .from('pharmacy_order_tracking')
                .select(`
                    *,
                    lpo:pharmacy_lpo (
                        lpo_number,
                        purchase_order:pharmacy_purchase_orders (
                        vote_code
                        )
                    )
                `)
                .eq('id', trackingId)
                .single()

            if (trackingError) throw trackingError
            if (!tracking.is_overdue) return null

            // Determine Penalty Type based on Vote Code
            const voteCode = tracking.lpo?.purchase_order?.vote_code
            const isCC = voteCode?.startsWith('080702')

            let penaltyAmount = 0
            if (isCC) {
                // Initial CC Penalty RM 200 or calculated?
                penaltyAmount = 200.00
            } else {
                penaltyAmount = tracking.days_overdue * ratePerDay
            }

            // Check if penalty exists
            const { data: existing } = await supabase
                .from(TABLE_NAME)
                .select('id')
                .eq('order_tracking_id', trackingId)
                .single()

            const payload = {
                order_tracking_id: trackingId,
                lpo_id: tracking.lpo_id,
                days_overdue: tracking.days_overdue,
                penalty_amount: penaltyAmount,
                status: 'issued',
            }

            if (existing) {
                const { data } = await supabase
                    .from(TABLE_NAME)
                    .update(payload)
                    .eq('id', existing.id)
                    .select()
                    .single()
                return data
            } else {
                const { data } = await supabase
                    .from(TABLE_NAME)
                    .insert(payload)
                    .select()
                    .single()
                return data
            }
        } catch (error) {
            console.error('Error calculating penalty:', error)
            return null
        }
    },

    // Calculate CC Penalty Values
    calculateCCPenalty(unitPrice: number, quantity: number, daysLate: number) {
        // Formula: Price * Qty * (Days/30) * 10%
        const part1 = unitPrice * quantity
        const part2 = daysLate / 30
        const calculated = part1 * part2 * 0.10
        return {
            calculated: Number(calculated.toFixed(2)),
            minimum: 200.00
        }
    },

    // Get all penalties
    async getPenalties(): Promise<Penalty[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
                *,
                lpo:pharmacy_lpo!inner(
                    lpo_number,
                    purchase_order:pharmacy_purchase_orders (
                        vote_code
                    )
                ),
                order_tracking:pharmacy_order_tracking(item_id, item_type)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Penalty[]
    },

    // Acknowledge/Pay Penalty
    async updatePenaltyStatus(id: string, status: 'issued' | 'paid' | 'waived' | 'verified' | 'approved', paymentDetails?: any) {
        const updates: any = { status, updated_at: new Date().toISOString() }

        if (status === 'paid' && paymentDetails) {
            updates.penalty_paid = true
            updates.payment_method = paymentDetails.method
            updates.payment_reference = paymentDetails.reference
            updates.payment_date = new Date().toISOString().split('T')[0]
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
        const noticeUrl = `https://placeholder-pdf-gen.com/penalty/${id}.pdf`

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({ penalty_notice_url: noticeUrl })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get all penalties with full relations for Penalties Page
    async getAllPenaltiesWithRelations(filters?: {
        status?: string
        from_date?: string
        to_date?: string
    }): Promise<any[]> {
        let query = supabase
            .from(TABLE_NAME)
            .select(`
                *,
                lpo:pharmacy_lpo (
                    id,
                    lpo_number,
                    expected_delivery_date,
                    document_date,
                    purchase_order:pharmacy_purchase_orders (
                        id,
                        po_number,
                        order_date,
                        vote_code,
                        vote_activity,
                        category,
                        department,
                        supplier:suppliers (id, company_name),
                        manual_supplier_name
                    ),
                    receiving_records:pharmacy_receiving (
                        *,
                        documents:pharmacy_receiving_documents (*)
                    )
                ),
                order_tracking:pharmacy_order_tracking (
                    id,
                    actual_delivery_date,
                    item_code
                )
            `)
            .order('created_at', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }
        if (filters?.from_date) {
            query = query.gte('created_at', filters.from_date)
        }
        if (filters?.to_date) {
            query = query.lte('created_at', filters.to_date)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    },

    // Get penalty summary for dashboard
    async getPenaltySummary(): Promise<{
        total_pending: number
        total_approved: number
        total_waived: number
        total_paid: number
        count_pending: number
        count_approved: number
        count_waived: number
        count_paid: number
    }> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('status, penalty_amount')

        if (error) throw error

        const summary = {
            total_pending: 0,
            total_approved: 0,
            total_waived: 0,
            total_paid: 0,
            count_pending: 0,
            count_approved: 0,
            count_waived: 0,
            count_paid: 0
        }

        for (const record of data || []) {
            const amount = parseFloat(record.penalty_amount) || 0
            switch (record.status) {
                case 'pending':
                    summary.total_pending += amount
                    summary.count_pending++
                    break
                case 'approved':
                case 'issued':
                    summary.total_approved += amount
                    summary.count_approved++
                    break
                case 'waived':
                    summary.total_waived += amount
                    summary.count_waived++
                    break
                case 'paid':
                    summary.total_paid += amount
                    summary.count_paid++
                    break
            }
        }

        return summary
    },

    async bulkApprove(ids: string[], approvedBy?: string): Promise<void> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .update({
                status: 'approved',
                approved_by: approvedBy,
                approved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .in('id', ids)

        if (error) throw error
    },

    async waivePenalty(id: string, reason: string): Promise<any> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                status: 'waived',
                waiver_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get all items for an LPO to allow adding them to penalty
    async getLPOItems(lpoId: string): Promise<OrderTracking[]> {
        const { data, error } = await supabase
            .from('pharmacy_order_tracking')
            .select('*')
            .eq('lpo_id', lpoId)

        if (error) throw error
        return data as OrderTracking[]
    }
}
