import { supabase } from '@/services/supabase'
import { ReceivingItem, LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { louService } from './louService'

const RECEIVING_TABLE = 'pharmacy_receiving'
const RECEIVING_ITEMS_TABLE = 'pharmacy_receiving_items'
const LPO_TABLE = 'pharmacy_lpo'

export const receivingService = {
    // Get LPO details for receiving
    async getLPOForReceiving(lpoId: string): Promise<LPOWithRelations | null> {
        const { data, error } = await supabase
            .from(LPO_TABLE)
            .select(`
                *,
                purchase_order:pharmacy_purchase_orders!inner (
                    *,
                    supplier:suppliers!inner (*),
                    items:pharmacy_purchase_order_items (*)
                ),
                tracking_items:pharmacy_order_tracking (*)
            `)
            .eq('id', lpoId)
            .single()

        if (error) {
            console.error('Error fetching LPO for receiving:', error)
            return null
        }
        return data as LPOWithRelations
    },

    // Create a new receiving record
    async createReceiving(
        lpoId: string,
        items: Partial<ReceivingItem>[],
        documents: { doUrl?: string, invoiceUrl?: string },
        notes?: string
    ) {
        // 1. Calculate partial vs full
        // For simplicity, checking if any item has outstanding quantity > 0 after this receive
        // In a real app, we'd compare against ordered quantity more rigorously
        const isPartial = items.some(i => (i.outstanding_quantity || 0) > 0)

        // 2. Create Receiving Header
        const { data: receiving, error: receivingError } = await supabase
            .from(RECEIVING_TABLE)
            .insert({
                lpo_id: lpoId,
                receiving_date: new Date().toISOString(),
                receiving_type: isPartial ? 'partial' : 'full',
                status: 'pending', // Pending verification
                do_document_url: documents.doUrl,
                invoice_document_url: documents.invoiceUrl,
                notes,
                is_fully_received: !isPartial
            })
            .select()
            .single()

        if (receivingError) throw receivingError

        // 3. Create Receiving Items
        const receivingItems = items.map(item => ({
            ...item,
            receiving_id: receiving.id,
            is_fully_received: (item.outstanding_quantity || 0) <= 0
        }))

        const { error: itemsError } = await supabase
            .from(RECEIVING_ITEMS_TABLE)
            .insert(receivingItems)

        if (itemsError) throw itemsError

        // 4. Update LPO Status if fully received
        // (This might depend on verification step, but assuming auto-update for now)

        // 5. Trigger LOU Creation if fully received
        if (!isPartial) {
            try {
                await louService.createLOU(lpoId, receiving.id, 'Full Delivery Received')
            } catch (louError) {
                console.error('Failed to auto-create LOU:', louError)
                // Don't fail the receiving process, just log
            }
        }

        return receiving
    },

    // Verify a receiving record
    async verifyReceiving(receivingId: string, verifiedBy: string) {
        const { data, error } = await supabase
            .from(RECEIVING_TABLE)
            .update({
                status: 'verified',
                verified_by: verifiedBy,
                updated_at: new Date().toISOString()
            })
            .eq('id', receivingId)
            .select()
            .single()

        if (error) throw error

        // Trigger generic inventory update here (placeholder)
        // inventoryService.updateStock(...)

        return data
    },

    // Get receiving history for an LPO
    async getReceivingHistory(lpoId: string) {
        const { data, error } = await supabase
            .from(RECEIVING_TABLE)
            .select(`
                *,
                items:pharmacy_receiving_items (*)
            `)
            .eq('lpo_id', lpoId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    }
}
