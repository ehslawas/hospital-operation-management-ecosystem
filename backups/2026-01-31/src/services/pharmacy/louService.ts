import { supabase } from '@/services/supabase'
import { LOU, ReceivingItem, LPOWithRelations } from '@/types/pharmacy/procurementNew'

const TABLE_NAME = 'pharmacy_lou'
const ITEMS_TABLE = 'pharmacy_lou_items'

export const louService = {
    // Create new LOU requirement (Legacy - kept for backward compatibility but modified to use new logic if items provided)
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

    // New: Create LOU with full item details
    async createLOUFromReceiving(params: {
        lpoId: string
        receivingId: string
        lpo: LPOWithRelations
        items: ReceivingItem[]
        doEntries: { doNumber: string }[]
    }): Promise<LOU> {
        const { lpoId, receivingId, lpo, items, doEntries } = params

        // 1. Create LOU Header
        const { data: lou, error: louError } = await supabase
            .from(TABLE_NAME)
            .insert({
                lpo_id: lpoId,
                receiving_id: receivingId,
                po_number: lpo.purchase_order?.po_number,
                lpo_number: lpo.lpo_number,
                do_numbers: doEntries.map(d => d.doNumber).filter(Boolean),
                supplier_name: lpo.purchase_order?.supplier?.company_name,
                items_count: items.length,
                requires_lou: true,
                lou_reason: 'Items flagged for LOU during receiving',
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (louError) throw louError

        // 2. Create LOU Items
        const louItemsToInsert = items.map(item => ({
            lou_id: lou.id,
            receiving_item_id: item.id,
            item_id: item.item_id,
            item_name: params.lpo.purchase_order?.items?.find((i: any) => i.item_id === item.item_id)?.item_name || 'Unknown Item',
            item_code: params.lpo.purchase_order?.items?.find((i: any) => i.item_id === item.item_id)?.item_code || '',
            item_type: item.item_type,
            po_number: lpo.purchase_order?.po_number,
            lpo_number: lpo.lpo_number,
            do_number: doEntries[0]?.doNumber || null, // Associate with first DO for now
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            manufactured_date: item.manufactured_date,
            quantity_received: item.received_quantity,
            status: 'pending'
        }))

        const { error: itemsError } = await supabase
            .from(ITEMS_TABLE)
            .insert(louItemsToInsert)

        if (itemsError) {
            console.error('Failed to create LOU items:', itemsError)
            // Should we delete header? For now just log
        }

        return lou
    },

    // Get all LOUs with items
    async getAllLOUs(search?: string, status?: string): Promise<LOU[]> {
        let query = supabase
            .from(TABLE_NAME)
            .select(`
                *,
                items:pharmacy_lou_items(*),
                lpo:pharmacy_lpo!inner(
                    lpo_number,
                    purchase_order:pharmacy_purchase_orders(
                        supplier:suppliers(company_name, address, phone)
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (status && status !== 'All') {
            query = query.eq('status', status.toLowerCase())
        }

        if (search) {
            query = query.or(`lpo_number.ilike.%${search}%,po_number.ilike.%${search}%,supplier_name.ilike.%${search}%`)
        }

        const { data, error } = await query

        if (error) throw error
        return data as LOU[]
    },

    // Get KPI Stats
    async getLOUStats() {
        // We can do this with a single query using 'select(status, count)' and group by,
        // but supabase JS grouping is limited. We'll fetch all or use separate counters.
        // For efficiency in large datasets, use RPC. For now, separate counts or filtered counts.

        const { count: total, error: e1 } = await supabase.from(TABLE_NAME).select('id', { count: 'exact', head: true })
        const { count: pending, error: e2 } = await supabase.from(TABLE_NAME).select('id', { count: 'exact', head: true }).eq('status', 'pending')
        const { count: generated, error: e3 } = await supabase.from(TABLE_NAME).select('id', { count: 'exact', head: true }).eq('status', 'generated')
        const { count: sent, error: e4 } = await supabase.from(TABLE_NAME).select('id', { count: 'exact', head: true }).eq('status', 'sent')

        if (e1 || e2 || e3 || e4) console.error('Error fetching LOU stats')

        return {
            total: total || 0,
            pending: pending || 0,
            generated: generated || 0,
            sent: sent || 0
        }
    },

    // Generate LOU Letter
    async generateLOULetter(id: string): Promise<LOU> {
        // Implementation would normally generate PDF here
        const pdfUrl = 'https://example.com/mock-lou-letter.pdf' // Mock

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
        const mergedUrl = 'https://example.com/mock-merged-package.pdf' // Mock

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
