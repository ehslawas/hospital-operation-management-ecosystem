import { supabase } from '@/services/supabase'
import { LOU } from '@/types/pharmacy/procurementNew'

const TABLE_NAME = 'pharmacy_lou'

export const louService = {
    // Create new LOU requirement
    async createLOU(
        lpoId: string,
        receivingId: string,
        reason: string
    ): Promise<LOU> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert({
                lpo_id: lpoId,
                receiving_id: receivingId,
                requires_lou: true,
                lou_reason: reason,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get all LOUs
    async getAllLOUs(): Promise<LOU[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
                *,
                lpo:pharmacy_lpo!inner(
                    lpo_number,
                    purchase_order:pharmacy_purchase_orders(
                        supplier:suppliers(company_name)
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as LOU[]
    },

    // Generate LOU Letter
    async generateLOULetter(id: string): Promise<LOU> {
        // Implementation would normally generate PDF here
        const pdfUrl = ''

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                lou_letter_url: pdfUrl,
                status: 'generated',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Merge Documents
    async mergeLOUDocuments(id: string): Promise<LOU> {
        // Implementation would merge LOU + LPO + DO/Invoice
        const mergedUrl = ''

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                merged_pdf_url: mergedUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Send LOU Email
    async sendLOUEmail(id: string, emailData: { to: string; subject: string; body: string }) {
        // Log that email was "sent"
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                status: 'sent',
                email_sent_to: emailData.to,
                email_sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}
