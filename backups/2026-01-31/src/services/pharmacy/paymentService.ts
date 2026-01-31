import { supabase } from '@/services/supabase'
import { Payment, LPOWithRelations } from '@/types/pharmacy/procurementNew'

const PAYMENT_TABLE = 'pharmacy_payments'
const LPO_TABLE = 'pharmacy_lpo'

export const paymentService = {
    // Get all pending payments (LPOs with receiving completed but no or partial payment)
    async getPendingPayments(): Promise<LPOWithRelations[]> {
        // This query requires joining LPO -> Receiving -> Payment to filter potentially
        // For simplicity, we fetch LPOs that are 'uploaded' or have receiving records,
        // and do not have a completed payment record.
        const { data, error } = await supabase
            .from(LPO_TABLE)
            .select(`
                *,
                purchase_order:pharmacy_purchase_orders!inner(
                    *,
                    supplier:suppliers!inner(*)
                ),
                receiving_records:pharmacy_receiving(*),
                payment:pharmacy_payments(*)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Filter in memory for now
        // We want LPOs that have been explicitly SENT FOR PAYMENT
        return (data as LPOWithRelations[]).filter(lpo => {
            // Check if LPO status is 'sent_for_payment'
            // This flag is set by receivingService.sendForPayment()
            const isSentForPayment = lpo.payment_status === 'sent_for_payment'
            const isPaid = lpo.payment?.status === 'completed'

            return isSentForPayment && !isPaid
        })
    },

    // Get specific LPO with payment details
    async getLPOPaymentDetails(lpoId: string): Promise<LPOWithRelations | null> {
        const { data, error } = await supabase
            .from(LPO_TABLE)
            .select(`
                *,
                purchase_order:pharmacy_purchase_orders (
                    *,
                    supplier:suppliers (*)
                ),
                payment:pharmacy_payments(*)
            `)
            .eq('id', lpoId)
            .single()

        if (error) {
            console.error('Error fetching LPO payment details:', error)
            return null
        }
        return data as LPOWithRelations
    },

    // Create or Update Payment Record
    async updatePayment(payment: Partial<Payment>) {
        if (!payment.lpo_id) throw new Error('LPO ID is required')

        // Check if payment exists
        const { data: existing } = await supabase
            .from(PAYMENT_TABLE)
            .select('id')
            .eq('lpo_id', payment.lpo_id)
            .single()

        let result
        if (existing) {
            const { data, error } = await supabase
                .from(PAYMENT_TABLE)
                .update({
                    ...payment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error
            result = data
        } else {
            const { data, error } = await supabase
                .from(PAYMENT_TABLE)
                .insert({
                    ...payment,
                    status: payment.status || 'pending'
                })
                .select()
                .single()

            if (error) throw error
            result = data
        }

        // 3. Update LPO payment status if completed
        if (result.status === 'completed' || result.status === 'issued') {
            await supabase
                .from(LPO_TABLE)
                .update({ payment_status: 'paid' })
                .eq('id', payment.lpo_id)

            await this.recordBudgetExpense(result)
        }

        return result
    },

    // Record expense in APPL or CC tables
    async recordBudgetExpense(payment: Payment) {
        try {
            // 1. Get LPO details to find PO and Vote Code
            const { data: lpo, error: lpoError } = await supabase
                .from(LPO_TABLE)
                .select(`
                    id, 
                    lpo_number,
                    po_id,
                    purchase_order:pharmacy_purchase_orders (
                        id,
                        po_number,
                        po_type,
                        vote_code, 
                        category,
                        department,
                        hospital_id,
                        total_amount
                    )
                `)
                .eq('id', payment.lpo_id)
                .single()

            if (lpoError || !lpo || !lpo.purchase_order) {
                console.error('Error fetching LPO details for expense recording:', lpoError)
                return
            }

            // Handle potential array return from Supabase relation
            const poData = lpo.purchase_order
            const po = Array.isArray(poData) ? poData[0] : poData

            if (!po) {
                console.error('PO details missing')
                return
            }

            // Determine budget type based on vote code or fallback logic
            // 080702 = CC (Contract), 990102 = APPL
            const isCC = po.vote_code === '080702'
            // const isAPPL = po.vote_code === '990102' // Unused

            // Default specific categorization logic if vote_code missing
            // This logic matches typical Ministry of Health mappings roughly
            const table = isCC ? 'pharmacy_cc_expenses' : 'pharmacy_appl_expenses'

            // Check if expense already exists for this PO to avoid duplicates
            // We use PO ID as a unique reference usually
            const { data: existingExpense } = await supabase
                .from(table)
                .select('id')
                .eq('po_id', po.id)
                .single()

            const expenseData = {
                hospital_id: po.hospital_id,
                fiscal_year: new Date().getFullYear(),
                po_id: po.id,
                po_number: po.po_number,
                lpo_number: lpo.lpo_number,
                po_type: po.po_type || 'regular',
                expense_date: payment.payment_issued_date || new Date().toISOString(),
                amount: payment.payment_amount,
                status: 'completed',
                category: po.category || 'drug',
                department: po.department || 'pharmacy'
            }

            if (existingExpense) {
                await supabase
                    .from(table)
                    .update({
                        ...expenseData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingExpense.id)
            } else {
                await supabase
                    .from(table)
                    .insert(expenseData)
            }

        } catch (error) {
            console.error('Error recording budget expense:', error)
        }
    },

    // Get Payment statistics
    async getPaymentStats() {
        const { data: payments, error } = await supabase
            .from(PAYMENT_TABLE)
            .select('*')

        if (error) throw error

        const totalPaid = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.payment_amount || 0), 0)

        const pendingCount = payments.filter(p => p.status === 'pending').length

        return {
            totalPaid,
            pendingCount
        }
    }
}
