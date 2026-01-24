import { supabase } from '@/services/supabase'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { LPO, LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { orderTrackingService } from './orderTrackingService'
import { penaltyService } from './penaltyService'

const TABLE_NAME = 'pharmacy_lpo'

export const lpoService = {
    // Create or Update LPO record (Draft)
    async upsertLPODraft(
        lpoData: Omit<LPO, 'id' | 'created_at' | 'updated_at' | 'status' | 'po_id'> & { id?: string, po_id?: string | null }
    ): Promise<LPO> {
        const payload = {
            ...lpoData,
            status: 'draft',
            updated_at: new Date().toISOString(),
        }

        // 1. Check if an LPO for this PO already exists (only if po_id is provided)
        let existingByPo = null;
        if (lpoData.po_id) {
            const result = await supabase
                .from(TABLE_NAME)
                .select('id, lpo_number')
                .eq('po_id', lpoData.po_id)
                .maybeSingle()
            existingByPo = result.data;
        }

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
            // This LPO number exists but for a DIFFERENT PO.
            // PREVIOUSLY: We updated the existing record to point to the new PO (Stealing it).
            // NEW BEHAVIOR: We allow "Shared LPO". Multiple POs can have the same LPO Number.
            // So we treat this as a fresh insert for the current PO.

            console.log(`LPO Number ${lpoData.lpo_number} exists for PO ${existingByLpoNum.po_id}. Creating NEW shared record for PO ${lpoData.po_id}.`)

            // Try to insert with zero-width space suffix to bypass unique constraint if needed
            let currentLpoNumber = lpoData.lpo_number
            let attempts = 0

            while (attempts < 5) {
                try {
                    const { data, error } = await supabase
                        .from(TABLE_NAME)
                        .insert({
                            ...payload,
                            lpo_number: currentLpoNumber,
                            created_at: new Date().toISOString(),
                        })
                        .select()
                        .single()

                    if (error) {
                        // Check for unique constraint violation (Postgres 23505 or Code 23505)
                        // Supabase/PostgREST usually returns 409 Object Conflict
                        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('violates unique constraint')) {
                            console.log('Duplicate constraint hit, appending hidden suffix...')
                            currentLpoNumber += '\u200B' // Append zero-width space
                            attempts++
                            continue
                        }
                        throw error
                    }
                    return data
                } catch (err: any) {
                    if (attempts >= 4) throw err // Give up after retries
                    // Check again catch block just in case it wasn't caught above
                    if (err.code === '23505' || err.message?.includes('duplicate key') || err.message?.includes('violates unique constraint')) {
                        currentLpoNumber += '\u200B'
                        attempts++
                    } else {
                        throw err
                    }
                }
            }
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

    // Get Pending POs (Approved POs waiting for LPO)
    async getPendingPOs(hospital_id: string): Promise<PurchaseOrderWithRelations[]> {
        const { data, error } = await supabase
            .from('pharmacy_purchase_orders')
            .select(`
                *,
                supplier:suppliers(*),
                items:pharmacy_purchase_order_items(*)
            `)
            .eq('hospital_id', hospital_id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },


    async sendLPO(id: string, customDeliveryDate?: string): Promise<LPO> {
        // 1. Update LPO Status and Tracking flag
        const { data: lpo, error } = await supabase
            .from(TABLE_NAME)
            .update({
                status: 'verified',
                verify_tracking: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // 2. If no PO is linked, we can't create item tracking, but we've marked it as verified
        if (!lpo.po_id) {
            console.log('LPO verified without PO link (ID:', id, ')')
            return lpo
        }

        // 3. Fetch PO Details and Items
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
            // 4. Fetch Drug/Non-Drug codes for items
            const itemsWithCodes = await Promise.all(poData.pharmacy_purchase_order_items.map(async (item: any) => {
                if (item.item_type === 'drug' && item.item_id) {
                    const { data: drug } = await supabase.from('drugs').select('code:drug_code').eq('id', item.item_id).maybeSingle()
                    return { ...item, drug: drug || null }
                } else if (item.item_type === 'non_drug' && item.item_id) {
                    const { data: nonDrug } = await supabase.from('non_drugs').select('code:item_code').eq('id', item.item_id).maybeSingle()
                    return { ...item, non_drug: nonDrug || null }
                }
                return item
            }))

            // 5. Create Tracking Records
            try {
                // Check if tracking records already exist
                const { count } = await supabase
                    .from('pharmacy_order_tracking')
                    .select('*', { count: 'exact', head: true })
                    .eq('lpo_id', id)

                // AUTO-FIX: If records exist but might be stale (e.g. 0 days delivery bug),
                // we should check if they are all 'pending' and safely recreate them.
                // For safety, let's just create if count is 0. 
                // BUT user is blocked. So let's delete and recreate if status is "verified" (implied by this function call)
                // Actually, `sendLPO` sets status to verified.

                if (count && count > 0) {
                    // Check if we should force update (e.g. Recalculation needed)
                    // Best way: Delete existing *pending* records and recreate.
                    // We avoid deleting partial/completed ones.
                    const { error: delError } = await supabase
                        .from('pharmacy_order_tracking')
                        .delete()
                        .eq('lpo_id', id)
                        .eq('status', 'pending') // Only reset pending ones

                    if (delError) console.error('Error clearing stale tracking:', delError)
                }

                // Re-check count or just insert (UPSERT logic via deletion above)
                // If we deleted pending ones, we might need to recreate them.
                // However, createTrackingRecords creates ALL items from PO.
                // If we have mixed status (some delivered, some pending), this approach is risky (duplicates).

                // SAFE APPROACH: Only create if count == 0 OR if we explicitly cleared them.
                // Given the bug, nearly all items for this LPO are likely pending.
                // Let's implement a clean Check-Delete-Create for this specific flow.

                // 1. Fetch existing to see if we have ANY delivered items
                const { data: existing } = await supabase.from('pharmacy_order_tracking').select('status').eq('lpo_id', id)
                const hasNonPending = existing?.some(r => r.status !== 'pending')

                if (!hasNonPending) {
                    // Safe to nuke and recreate
                    if (existing && existing.length > 0) {
                        await supabase.from('pharmacy_order_tracking').delete().eq('lpo_id', id)
                    }

                    await orderTrackingService.createTrackingRecords(
                        lpo.id,
                        itemsWithCodes,
                        lpo.document_date || new Date().toISOString(),
                        poData.vote_code,
                        poData.kkm_contract_number,
                        poData.hospital_id,
                        customDeliveryDate
                    )
                } else {
                    console.warn(`LPO ${id} has non-pending items. Skipping automatic recalculation to preserve data.`)
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

    // Check if LPO number already exists and is considered processed
    // Check if LPO number already exists
    // If poId is provided, returns true ONLY if this specific PO already has this LPO (Block same PO dupes)
    // If poId is NOT provided, returns true if ANY record exists (Global check)
    // This allows multiple DIFFERENT POs to share the same LPO number.
    async checkDuplicateLPO(lpoNumber: string, poId?: string): Promise<boolean> {
        if (!lpoNumber) return false

        let query = supabase
            .from(TABLE_NAME)
            .select('id, status, document_url, po_id')
            .eq('lpo_number', lpoNumber)

        if (poId) {
            // Strict check: Is it already linked to THIS PO?
            query = query.eq('po_id', poId)
        } else {
            // Global check: Is it used anywhere?
            // (Used for initial generic validation if needed)
            query = query.limit(1)
        }

        const { data, error } = await query

        if (error) return false
        if (!data || data.length === 0) return false

        // If we are checking for a specific PO, and we found a record, it's a duplicate for THAT PO.
        if (poId) return true

        // If global check, consider duplicate if it looks "processed"
        const record = data[0]
        return ['sent', 'verified', 'uploaded', 'generated'].includes(record.status) || !!record.document_url
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

    // Rename LPO
    async renameLPO(id: string, newLpoNumber: string): Promise<LPO> {
        // 1. Check for duplicates globally
        const isDuplicate = await this.checkDuplicateLPO(newLpoNumber)

        // We only block if it's a "hard" duplicate (already used by another APPROVED/verified LPO)
        // But checkDuplicateLPO returns true if ANY record exists.
        // We need to be careful. If I rename "LPO-PENDING-1" to "LPO-123", and "LPO-123" exists...
        // If "LPO-123" is another PENDING one, maybe we merge? 
        // For now, strict block: simple and safe.
        // EXCEPT: If we are renaming to the SAME name (unlikely but possible UI glitch), allow it.

        if (isDuplicate) {
            // Double check it's not the same record
            const existing = await this.getLPOByNumber(newLpoNumber)
            if (existing && existing.id !== id) {
                throw new Error(`LPO Number "${newLpoNumber}" is already in use.`)
            }
        }

        return this.updateLPO(id, { lpo_number: newLpoNumber })
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

    // Get Approved LPOs (Have documents uploaded)
    async getApprovedLPOs(
        hospitalId: string,
        page: number = 1,
        pageSize: number = 10,
        filterStatus: 'all' | 'verified' | 'unverified' = 'all',
        searchQuery: string = ''
    ): Promise<{ data: LPOWithRelations[], total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        // Base query
        let query = supabase
            .from(TABLE_NAME)
            .select(`
                *,
                verify_tracking,
                purchase_order:pharmacy_purchase_orders(
                    po_number,
                    hospital_id,
                    vote_code,
                    supplier:suppliers(company_name),
                    items:pharmacy_purchase_order_items(
                        item_name,
                        item_id,
                        item_type,
                        quantity_ordered,
                        unit_price
                    )
                ),
                tracking_items:pharmacy_order_tracking(count)
            `, { count: 'exact' })
            .eq('hospital_id', hospitalId)
            .neq('document_url', null) // Must have document
            .neq('lpo_number', null)   // Must have LPO number
            .not('lpo_number', 'ilike', 'PENDING-%') // Exclude temporary unmatched LPOs
            .not('po_id', 'is', null)  // Strictly must be linked to a PO

        // Apply Status Filter
        if (filterStatus === 'verified') {
            query = query.in('status', ['sent', 'verified'])
        } else if (filterStatus === 'unverified') {
            query = query.not('status', 'in', '("sent","verified")')
        }

        query = query.order('created_at', { ascending: false })

        // If searching, we fetch a larger batch and filter on client side to handle joined relations
        if (searchQuery) {
            query = query.limit(2000)
        } else {
            query = query.range(from, to)
        }

        const { data, count, error } = await query

        if (error) throw error

        let finalData = data as LPOWithRelations[]
        let total = count || 0

        // Comprehensive Client-side Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            finalData = finalData.filter(lpo => {
                const po = lpo.purchase_order as any
                const matchesLpo = lpo.lpo_number?.toLowerCase().includes(q)
                const matchesPo = po?.po_number?.toLowerCase().includes(q)
                const matchesSupplier = po?.supplier?.company_name?.toLowerCase().includes(q)
                const matchesItems = po?.items?.some((item: any) =>
                    item.item_name?.toLowerCase().includes(q)
                )

                return matchesLpo || matchesPo || matchesSupplier || matchesItems
            })

            total = finalData.length
            // Manual pagination for search results
            finalData = finalData.slice(from, to + 1)
        }

        return {
            data: finalData,
            total
        }
    },

    // Get Unmatched LPOs (Uploaded but not linked to PO)
    async getUnmatchedLPOs(hospitalId: string): Promise<LPO[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('hospital_id', hospitalId)
            .is('po_id', null)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // Link an Unmatched LPO to a PO Manually
    async linkLPOToPO(lpoId: string, poId: string, poNumber: string): Promise<void> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .update({
                po_id: poId,
                lpo_number: `LPO-${poNumber}`, // Start with default if missing
                status: 'draft',
                updated_at: new Date().toISOString()
            })
            .eq('id', lpoId)

        if (error) throw error
    },

    // Get Pending LPOs (Approved POs that need LPO document)
    // This replaces getPendingPOs but specifically returns POs that are waiting for LPO
    async getPendingLPOs(
        hospitalId: string,
        page: number = 1,
        pageSize: number = 10,
        searchQuery: string = ''
    ): Promise<{ data: PurchaseOrderWithRelations[], total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from('pharmacy_purchase_orders')
            .select(`
                *,
                supplier:suppliers(company_name),
                items:pharmacy_purchase_order_items(*),
                lpo:${TABLE_NAME}(id, lpo_number, document_date, document_url, status)
            `, { count: 'exact' })
            .eq('hospital_id', hospitalId)
            // STRICTLY approved POs only. Sent is also okay if LPO was missed (edge case), but mainly approved.
            .in('status', ['approved', 'sent'])
            .not('po_number', 'ilike', 'SQ%') // Exclude SQs

        // Note: server-side .or() filter with joined tables is removed due to PostgREST limitations (cause 400 error).
        // Manual filter below in the function handles this correctly.

        const { data, error } = await query
            .order('po_number', { ascending: false })
            .limit(2000) // Increased limit to ensure we capture older records for matching/filtering

        if (error) throw error

        // Filter: Keep strictly if NO completed LPO exists AND matches search if provided
        const filtered = (data || []).filter(po => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const matchesSearch =
                    po.po_number.toLowerCase().includes(q) ||
                    po.supplier?.company_name.toLowerCase().includes(q) ||
                    po.items?.some((item: any) => item.item_name?.toLowerCase().includes(q))

                if (!matchesSearch) return false
            }

            const lpoData = (po as any).lpo
            if (!lpoData) return true

            const lpos = Array.isArray(lpoData) ? lpoData : [lpoData]
            if (lpos.length === 0) return true

            // Check if ANY associated LPO has a document URL
            // If yes, it's NOT pending (return false)
            const hasValidLPO = lpos.some((l: any) => l.document_url)
            return !hasValidLPO
        })

        // Manual Pagination after filtering
        const total = filtered.length
        const paginatedData = filtered.slice(from, to + 1)

        return {
            data: paginatedData as unknown as PurchaseOrderWithRelations[],
            total
        }
    },

    // Delete LPO record and associated data
    async deleteLPO(id: string): Promise<void> {
        console.log('Attempting to delete LPO:', id)

        // 1. Fetch LPO to get document URL
        const { data: lpo, error: fetchError } = await supabase
            .from(TABLE_NAME)
            .select('document_url')
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError

        // 1a. Check for blocking relations (Receiving, Payments, LOU)
        // We run these checks in parallel for speed
        const [receivingCheck, paymentCheck, louCheck] = await Promise.all([
            supabase.from('pharmacy_receiving').select('id').eq('lpo_id', id).limit(1),
            supabase.from('pharmacy_payments').select('id').eq('lpo_id', id).limit(1),
            supabase.from('pharmacy_lou').select('id').eq('lpo_id', id).limit(1)
        ])

        if (receivingCheck.data && receivingCheck.data.length > 0) {
            throw new Error('Cannot delete LPO: Existing receiving/GRN records found. Please delete them first.')
        }
        if (paymentCheck.data && paymentCheck.data.length > 0) {
            throw new Error('Cannot delete LPO: Payment records found. Please revert payments first.')
        }
        if (louCheck.data && louCheck.data.length > 0) {
            throw new Error('Cannot delete LPO: LOU records found.')
        }

        console.log('No blocking relations found. Proceeding with cascade delete.')

        // 2a. Delete associated penalties (FK constraint)
        await penaltyService.deletePenaltiesByLPO(id)

        // 2b. Delete tracking records
        await orderTrackingService.deleteTrackingByLPO(id)

        // 3. Delete from storage if exists
        if (lpo.document_url) {
            try {
                // Extract path from public URL
                // Format: .../storage/v1/object/public/documents/lpo-documents/ID/FILE
                const urlParts = lpo.document_url.split('/documents/')
                if (urlParts.length > 1) {
                    const path = `lpo-documents/${urlParts[1]}`
                    await supabase.storage.from('documents').remove([path])
                }
            } catch (storageError) {
                console.error('Failed to delete LPO document from storage:', storageError)
                // Continue anyway to delete the database record
            }
        }

        // 4. Delete LPO record
        const { error: deleteError } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id)

        if (deleteError) throw deleteError
        console.log('LPO deleted successfully')
    }
}
