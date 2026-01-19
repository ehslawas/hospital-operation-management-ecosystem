import { supabase } from '@/services/supabase'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { LPO, LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { orderTrackingService } from './orderTrackingService'

const TABLE_NAME = 'pharmacy_lpo'

export const lpoService = {
    // Create or Update LPO record (Draft)
    async upsertLPODraft(
        lpoData: Omit<LPO, 'id' | 'created_at' | 'updated_at' | 'status'> & { id?: string }
    ): Promise<LPO> {
        const payload = {
            ...lpoData,
            status: 'draft',
            updated_at: new Date().toISOString(),
        }

        // 1. Check if an LPO for this PO already exists
        const { data: existingByPo } = await supabase
            .from(TABLE_NAME)
            .select('id, lpo_number')
            .eq('po_id', lpoData.po_id)
            .maybeSingle()

        // 2. Check if an LPO with this LPO number already exists
        const { data: existingByLpoNum } = await supabase
            .from(TABLE_NAME)
            .select('id, po_id')
            .eq('lpo_number', lpoData.lpo_number)
            .maybeSingle()

        if (existingByPo) {
            // Update the existing record for this PO
            // If the lpo_number we are trying to set is already used by ANOTHER PO, we might have a conflict
            if (existingByLpoNum && existingByLpoNum.id !== existingByPo.id) {
                console.warn(`LPO number ${lpoData.lpo_number} is already used by PO ${existingByLpoNum.po_id}. Cannot reassing to PO ${lpoData.po_id}.`);
                // Return the existing record for the PO but don't change the number to the conflicting one
                return existingByPo as any;
            }

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(payload)
                .eq('id', existingByPo.id)
                .select()
                .single()
            if (error) throw error
            return data
        } else if (existingByLpoNum) {
            // This LPO number exists but for a DIFFERENT PO (since existingByPo was null)
            // This is a mapping error in matching, or the PO was deleted/recreated.
            // For safety, we update the existing LPO number record to point to the NEW PO
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(payload)
                .eq('id', existingByLpoNum.id)
                .select()
                .single()
            if (error) throw error
            return data
        } else {
            // Fresh insert
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert({
                    ...payload,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single()
            if (error) throw error
            return data
        }
    },

    // Create LPO record
    async createLPO(
        lpoData: Omit<LPO, 'id' | 'created_at' | 'updated_at' | 'status'>
    ): Promise<LPO> {
        // 1. Create LPO Record
        const { data: lpo, error } = await supabase
            .from(TABLE_NAME)
            .insert({
                ...lpoData,
                status: 'draft',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) throw error

        return lpo
    },

    // Send LPO to Supplier (Updates status and initializes tracking)
    async sendLPO(id: string): Promise<LPO> {
        // 1. Update LPO Status
        const { data: lpo, error } = await supabase
            .from(TABLE_NAME)
            .update({
                status: 'sent',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // 2. Fetch PO Details (Vote Code, Contract, Hospital ID) and Items
        const { data: poData, error: poError } = await supabase
            .from('pharmacy_purchase_orders')
            .select(`
                hospital_id,
                vote_code,
                kkm_contract_number,
                pharmacy_purchase_order_items (
                    *
                )
            `)
            .eq('id', lpo.po_id)
            .single()

        if (poError) {
            console.error('Error fetching PO details for tracking:', poError)
        } else if (poData && poData.pharmacy_purchase_order_items && poData.pharmacy_purchase_order_items.length > 0) {
            // 3. Fetch Drug/Non-Drug codes manually to avoid join cached relation issues if they occur
            // But since orderTrackingService might need them, we ensure we have the item data
            const itemsWithCodes = await Promise.all(poData.pharmacy_purchase_order_items.map(async (item: any) => {
                if (item.item_type === 'drug' && item.item_id) {
                    const { data: drug } = await supabase.from('drugs').select('code').eq('id', item.item_id).maybeSingle()
                    return { ...item, drug: drug || null }
                } else if (item.item_type === 'non_drug' && item.item_id) {
                    const { data: nonDrug } = await supabase.from('non_drugs').select('code').eq('id', item.item_id).maybeSingle()
                    return { ...item, non_drug: nonDrug || null }
                }
                return item
            }))

            // 4. Create Tracking Records
            try {
                // Check if tracking records already exist
                const { count } = await supabase
                    .from('pharmacy_order_tracking')
                    .select('*', { count: 'exact', head: true })
                    .eq('lpo_id', id)

                if (count === 0) {
                    await orderTrackingService.createTrackingRecords(
                        lpo.id,
                        itemsWithCodes,
                        new Date().toISOString(),
                        poData.vote_code,
                        poData.kkm_contract_number,
                        poData.hospital_id
                    )
                }
            } catch (trackingError) {
                console.error('Failed to create tracking records:', trackingError)
            }
        }

        return lpo
    },

    // Get LPO by ID with relations
    async getLPOById(id: string): Promise<LPOWithRelations> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
        *,
        purchase_order:pharmacy_purchase_orders(*),
        created_by_user:users(*),
        tracking_items:pharmacy_order_tracking(*),
        receiving_records:pharmacy_receiving(*),
        payment:pharmacy_payments(*),
        lou:pharmacy_lou(*)
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Get LPO by Number
    async getLPOByNumber(lpoNumber: string): Promise<LPOWithRelations> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`*`)
            .eq('lpo_number', lpoNumber)
            .single()

        if (error) throw error
        return data
    },

    // Get LPOs by Purchase Order ID
    async getLPOsByPO(poId: string): Promise<LPO[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('po_id', poId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Get All LPOs
    async getAllLPOs(hospitalId: string): Promise<LPOWithRelations[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select(`
        *,
        purchase_order:pharmacy_purchase_orders!inner(
          po_number,
          hospital_id,
          supplier:suppliers(company_name)
        )
      `)
            .eq('purchase_order.hospital_id', hospitalId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Update LPO Status or URL
    async updateLPO(id: string, updates: Partial<LPO>): Promise<LPO> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Generate LPO Document (Using jsPDF)
    // Note: Actual PDF generation logic will be in a separate utility or client-side component,
    // this service just updates the record with the generated URL.
    async recordLPOGeneration(id: string, documentUrl: string): Promise<LPO> {
        return this.updateLPO(id, {
            document_url: documentUrl,
            status: 'generated'
        })
    },

    // Upload LPO Document manually
    async uploadLPODocument(id: string, file: File): Promise<LPO> {
        // 1. Upload to storage
        const path = `lpo-documents/${id}/${file.name}`
        const { data: _uploadData, error: uploadError } = await supabase.storage
            .from('documents') // Assuming 'documents' bucket exists
            .upload(path, file, {
                upsert: true
            })

        if (uploadError) throw uploadError

        // 2. Get public URL (or signed URL if private)
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(path)

        // 3. Update LPO record
        return this.updateLPO(id, {
            document_url: publicUrl,
            status: 'uploaded'
        })
    },

    // Get Approved POs that don't have an LPO yet (paginated)
    async getPendingPOs(
        hospitalId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: PurchaseOrderWithRelations[], total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
            .from('pharmacy_purchase_orders')
            .select(`
                *,
                supplier:suppliers(company_name),
                items:pharmacy_purchase_order_items(
                    quantity_ordered,
                    unit_price,
                    item_name,
                    item_id,
                    item_type
                ),
                lpo:${TABLE_NAME}(id, lpo_number, document_date, document_url, status)
            `)
            .eq('hospital_id', hospitalId)
            .in('status', ['draft', 'approved', 'sent'])
            .order('po_number', { ascending: false })

        if (error) throw error

        // Filter out POs that already have a completed LPO
        // But KEEP them if the LPO is only a 'draft'
        const filtered = (data || []).filter(po => {
            const lpoData = (po as any).lpo
            // If no LPO at all, keep it
            if (!lpoData || (Array.isArray(lpoData) && lpoData.length === 0)) return true

            // If it's a draft LPO, keep it for editing
            // We allow 'draft', 'uploaded', and 'generated' as these are not yet 'sent'
            const lpo = Array.isArray(lpoData) ? lpoData[0] : lpoData
            if (!lpo) return true

            return ['draft', 'uploaded', 'generated'].includes(lpo.status)
        })

        const total = filtered.length
        const paginated = filtered.slice(from, to + 1)

        return {
            data: paginated as unknown as PurchaseOrderWithRelations[],
            total
        }
    }
}
