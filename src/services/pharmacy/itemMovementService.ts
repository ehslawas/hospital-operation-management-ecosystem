/**
 * Item Movement Service
 * 
 * Records and queries physical item movements for dual-tracking (system + physical).
 * Supports receiving, issuing, returns, transfers, and reconciliation.
 */

import { supabase } from '../supabase'
import type { ApiResponse } from '@/types'
import type { RegisteredItem } from './itemRegistryService'

// =====================================================
// TYPES
// =====================================================

export interface ItemMovement {
    id: string
    hospital_id: string
    item_registry_id: string
    movement_type: 'registered' | 'received' | 'issued' | 'returned_from_dept' | 'transferred' | 'consumed' | 'disposed' | 'returned_to_supplier' | 'status_change'
    source_document_type?: string
    source_document_id?: string
    source_document_number?: string
    from_location?: string
    to_location?: string
    performed_by?: string
    performed_at: string
    scanned_at?: string
    scan_method: 'qr' | 'manual' | 'barcode' | 'rfid' | 'nfc'
    previous_status?: string
    new_status?: string
    quantity: number
    remarks?: string
    metadata?: any
    created_at: string
}

export interface ItemMovementWithRelations extends ItemMovement {
    item?: RegisteredItem
    performer?: {
        id: string
        full_name?: string
        email: string
    }
}

export interface MovementSummary {
    total_received: number
    total_issued: number
    total_returned: number
    total_transferred: number
    total_consumed: number
    by_status: {
        status: string
        count: number
    }[]
}

export interface DiscrepancyReport {
    catalog_item_id: string
    name: string
    code: string
    system_qty: number
    physical_count: number
    discrepancy: boolean
    items: {
        id: string
        qr_code: string
        status: string
        current_location: string
    }[]
}

// =====================================================
// CORE MOVEMENT FUNCTIONS
// =====================================================

/**
 * Record receiving movement (item scanned during GRN/DO processing)
 */
export async function recordReceiving(
    hospitalId: string,
    registryId: string,
    documentRef: {
        type: string
        id: string
        number: string
    },
    location: string,
    userId: string,
    scanMethod: ItemMovement['scan_method'] = 'qr'
): Promise<ApiResponse<ItemMovement>> {
    try {
        // Get current item state
        const { data: currentItem, error: fetchError } = await supabase
            .from('pharmacy_item_registry')
            .select('status, current_location')
            .eq('id', registryId)
            .single()

        if (fetchError) throw fetchError

        // Create movement record
        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .insert({
                hospital_id: hospitalId,
                item_registry_id: registryId,
                movement_type: 'received',
                source_document_type: documentRef.type,
                source_document_id: documentRef.id,
                source_document_number: documentRef.number,
                from_location: currentItem.current_location,
                to_location: location,
                performed_by: userId,
                scanned_at: new Date().toISOString(),
                scan_method: scanMethod,
                previous_status: currentItem.status,
                new_status: 'available',
                quantity: 1
            })
            .select()
            .single()

        if (error) throw error

        // Update registry status and location
        const { error: updateError } = await supabase
            .from('pharmacy_item_registry')
            .update({
                status: 'available',
                current_location: location,
                last_scanned_at: new Date().toISOString(),
                last_scanned_by: userId
            })
            .eq('id', registryId)

        if (updateError) throw updateError

        return { data: data as ItemMovement, error: null }
    } catch (error) {
        console.error('Error recording receiving:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to record receiving' }
    }
}

/**
 * Record issuing movement (item scanned during requisition fulfillment)
 */
export async function recordIssuing(
    hospitalId: string,
    registryId: string,
    destination: string,
    requisitionRef: {
        type: string
        id: string
        number: string
    },
    userId: string,
    scanMethod: ItemMovement['scan_method'] = 'qr'
): Promise<ApiResponse<ItemMovement>> {
    try {
        const { data: currentItem, error: fetchError } = await supabase
            .from('pharmacy_item_registry')
            .select('status, current_location')
            .eq('id', registryId)
            .single()

        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .insert({
                hospital_id: hospitalId,
                item_registry_id: registryId,
                movement_type: 'issued',
                source_document_type: requisitionRef.type,
                source_document_id: requisitionRef.id,
                source_document_number: requisitionRef.number,
                from_location: currentItem.current_location,
                to_location: destination,
                performed_by: userId,
                scanned_at: new Date().toISOString(),
                scan_method: scanMethod,
                previous_status: currentItem.status,
                new_status: 'issued',
                quantity: 1
            })
            .select()
            .single()

        if (error) throw error

        // Update registry status and location
        const { error: updateError } = await supabase
            .from('pharmacy_item_registry')
            .update({
                status: 'issued',
                current_location: destination,
                last_scanned_at: new Date().toISOString(),
                last_scanned_by: userId
            })
            .eq('id', registryId)

        if (updateError) throw updateError

        return { data: data as ItemMovement, error: null }
    } catch (error) {
        console.error('Error recording issuing:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to record issuing' }
    }
}

/**
 * Record return movement (item returned from department)
 */
export async function recordReturn(
    hospitalId: string,
    registryId: string,
    fromLocation: string,
    remarks: string,
    userId: string
): Promise<ApiResponse<ItemMovement>> {
    try {
        const { data: currentItem, error: fetchError } = await supabase
            .from('pharmacy_item_registry')
            .select('status, current_location')
            .eq('id', registryId)
            .single()

        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .insert({
                hospital_id: hospitalId,
                item_registry_id: registryId,
                movement_type: 'returned_from_dept',
                from_location: fromLocation,
                to_location: 'Store',
                performed_by: userId,
                scanned_at: new Date().toISOString(),
                scan_method: 'qr',
                previous_status: currentItem.status,
                new_status: 'available',
                quantity: 1,
                remarks
            })
            .select()
            .single()

        if (error) throw error
        return { data: data as ItemMovement, error: null }
    } catch (error) {
        console.error('Error recording return:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to record return' }
    }
}

/**
 * Record transfer movement (item moved between locations)
 */
export async function recordTransfer(
    hospitalId: string,
    registryId: string,
    fromLocation: string,
    toLocation: string,
    userId: string,
    remarks?: string
): Promise<ApiResponse<ItemMovement>> {
    try {
        const { data: currentItem, error: fetchError } = await supabase
            .from('pharmacy_item_registry')
            .select('status')
            .eq('id', registryId)
            .single()

        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .insert({
                hospital_id: hospitalId,
                item_registry_id: registryId,
                movement_type: 'transferred',
                from_location: fromLocation,
                to_location: toLocation,
                performed_by: userId,
                scanned_at: new Date().toISOString(),
                scan_method: 'qr',
                previous_status: currentItem.status,
                new_status: currentItem.status, // Status unchanged
                quantity: 1,
                remarks
            })
            .select()
            .single()

        if (error) throw error
        return { data: data as ItemMovement, error: null }
    } catch (error) {
        console.error('Error recording transfer:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to record transfer' }
    }
}

// =====================================================
// QUERY FUNCTIONS
// =====================================================

/**
 * Get movement history for a specific item
 */
export async function getMovementHistory(
    registryId: string,
    options?: {
        limit?: number
        movementType?: ItemMovement['movement_type']
    }
): Promise<ApiResponse<ItemMovementWithRelations[]>> {
    try {
        let query = supabase
            .from('pharmacy_item_movements')
            .select(`
        *,
        item:pharmacy_item_registry(id, qr_code, item_type, current_location, status),
        performer:users!pharmacy_item_movements_performed_by_fkey(id, full_name, email)
      `)
            .eq('item_registry_id', registryId)

        if (options?.movementType) {
            query = query.eq('movement_type', options.movementType)
        }

        const { data, error } = await query
            .order('performed_at', { ascending: false })
            .limit(options?.limit || 100)

        if (error) throw error
        return { data: data as ItemMovementWithRelations[], error: null }
    } catch (error) {
        console.error('Error fetching movement history:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch history' }
    }
}

/**
 * Get movements by source document
 */
export async function getMovementsByDocument(
    documentType: string,
    documentId: string
): Promise<ApiResponse<ItemMovementWithRelations[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .select(`
        *,
        item:pharmacy_item_registry(id, qr_code, item_type, current_location, status),
        performer:users!pharmacy_item_movements_performed_by_fkey(id, full_name, email)
      `)
            .eq('source_document_type', documentType)
            .eq('source_document_id', documentId)
            .order('performed_at', { ascending: false })

        if (error) throw error
        return { data: data as ItemMovementWithRelations[], error: null }
    } catch (error) {
        console.error('Error fetching movements by document:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch movements' }
    }
}

/**
 * Get movement summary for a date range
 */
export async function getMovementsSummary(
    hospitalId: string,
    dateRange: {
        startDate: string
        endDate: string
    }
): Promise<ApiResponse<MovementSummary>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .select('movement_type, new_status')
            .eq('hospital_id', hospitalId)
            .gte('performed_at', dateRange.startDate)
            .lte('performed_at', dateRange.endDate)

        if (error) throw error

        const summary: MovementSummary = {
            total_received: data.filter(m => m.movement_type === 'received').length,
            total_issued: data.filter(m => m.movement_type === 'issued').length,
            total_returned: data.filter(m => m.movement_type === 'returned_from_dept').length,
            total_transferred: data.filter(m => m.movement_type === 'transferred').length,
            total_consumed: data.filter(m => m.movement_type === 'consumed').length,
            by_status: []
        }

        // Count by status
        const statusCounts = data.reduce((acc: any, curr) => {
            if (curr.new_status) {
                acc[curr.new_status] = (acc[curr.new_status] || 0) + 1
            }
            return acc
        }, {})

        summary.by_status = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count: count as number
        }))

        return { data: summary, error: null }
    } catch (error) {
        console.error('Error fetching movement summary:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch summary' }
    }
}

/**
 * Reconcile physical vs system movements
 */
export async function reconcilePhysicalVsSystem(
    hospitalId: string,
    location?: string
): Promise<ApiResponse<DiscrepancyReport[]>> {
    try {
        // Call the database function
        const { data, error } = await supabase.rpc('reconcile_movements', {
            p_hospital_id: hospitalId,
            p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            p_end_date: new Date().toISOString()
        })

        if (error) throw error

        // Filter by location if provided
        let result = data || []
        if (location) {
            result = result.filter((item: any) =>
                item.res_current_location?.includes(location) ||
                item.res_last_scanned_location?.includes(location)
            )
        }

        // Aggregate by catalog item for the UI reconciliation view
        const aggregated: Record<string, DiscrepancyReport> = {};

        for (const item of result) {
            const catId = item.res_catalog_item_id || item.res_registry_id;
            if (!aggregated[catId]) {
                aggregated[catId] = {
                    catalog_item_id: catId,
                    name: item.res_name || 'Unknown Item',
                    code: item.res_code || '-',
                    system_qty: Number(item.res_ledger_qty) || 0,
                    physical_count: 0,
                    discrepancy: false,
                    items: []
                };
            }

            aggregated[catId].physical_count++;
            aggregated[catId].items.push({
                id: item.res_registry_id,
                qr_code: item.res_qr_code,
                status: item.res_status,
                current_location: item.res_current_location
            });
        }

        const report = Object.values(aggregated).map(item => ({
            ...item,
            discrepancy: item.physical_count !== item.system_qty
        }));

        return { data: report, error: null }
    } catch (error) {
        console.error('Error reconciling movements:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to reconcile' }
    }
}

/**
 * Get recent movements for a hospital
 */
export async function getRecentMovements(
    hospitalId: string,
    limit: number = 50
): Promise<ApiResponse<ItemMovementWithRelations[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .select(`
        *,
        item:pharmacy_item_registry(id, qr_code, item_type, current_location, status),
        performer:users!pharmacy_item_movements_performed_by_fkey(id, full_name, email)
      `)
            .eq('hospital_id', hospitalId)
            .order('performed_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return { data: data as ItemMovementWithRelations[], error: null }
    } catch (error) {
        console.error('Error fetching recent movements:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch movements' }
    }
}
