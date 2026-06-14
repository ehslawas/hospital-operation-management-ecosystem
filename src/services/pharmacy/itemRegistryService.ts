/**
 * Item Registry Service
 * 
 * Manages the physical item registry with QR code tracking for both drugs and non-drugs.
 * Provides CRUD operations, QR lookups, and status management.
 */

import { supabase } from '../supabase'
import type { ApiResponse } from '@/types'

// =====================================================
// TYPES
// =====================================================

export interface RegisteredItem {
    id: string
    hospital_id: string
    qr_code: string
    serial_number?: string
    item_id: string
    item_type: 'drug' | 'non_drug'
    batch_id?: string
    current_location: string
    status: 'available' | 'issued' | 'in_transit' | 'consumed' | 'expired' | 'damaged' | 'returned' | 'transferred' | 'decommissioned' | 'stolen' | 'disposed'
    last_scanned_at?: string
    last_scanned_by?: string
    remarks?: string
    created_at: string
    updated_at: string
}

export interface RegisteredItemWithRelations extends RegisteredItem {
    item_details?: any // Drug or Non-Drug details
    drug?: any // For backward compatibility in UI
    non_drug?: any // For backward compatibility in UI
    batch_details?: {
        id: string
        batch_number: string
        expiry_date?: string
    }
    last_scanner?: {
        id: string
        full_name?: string
        email: string
    }
}

export interface BulkRegisterPayload {
    qr_code: string
    serial_number?: string
    item_id: string
    item_type: 'drug' | 'non_drug'
    batch_id?: string
    current_location?: string
}

// =====================================================
// CORE FUNCTIONS
// =====================================================

/**
 * Record initial registration movement
 */
export async function recordRegistration(
    hospitalId: string,
    registryId: string,
    location: string,
    userId: string
): Promise<ApiResponse<any>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .insert({
                hospital_id: hospitalId,
                item_registry_id: registryId,
                movement_type: 'registered',
                from_location: 'System Registration',
                to_location: location,
                performed_by: userId,
                performed_at: new Date().toISOString(),
                scan_method: 'manual',
                quantity: 1,
                remarks: 'Initial item registration'
            })
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error recording registration:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to record registration' }
    }
}

/**
 * Register a single item with QR code
 */
export async function registerItem(
    hospitalId: string,
    payload: BulkRegisterPayload,
    userId?: string
): Promise<ApiResponse<RegisteredItem>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .insert({
                hospital_id: hospitalId,
                ...payload,
                current_location: payload.current_location || 'Store',
                status: 'available'
            })
            .select()
            .single()

        if (error) throw error

        // Log initial movement if userId provided
        if (userId && data) {
            await recordRegistration(hospitalId, data.id, data.current_location, userId)
        }

        return { data: data as RegisteredItem, error: null }
    } catch (error) {
        console.error('Error registering item:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to register item' }
    }
}

/**
 * Register multiple items in bulk
 */
export async function registerItems(
    hospitalId: string,
    items: BulkRegisterPayload[],
    userId?: string
): Promise<ApiResponse<RegisteredItem[]>> {
    try {
        const itemsToInsert = items.map(item => ({
            hospital_id: hospitalId,
            ...item,
            current_location: item.current_location || 'Store',
            status: 'available'
        }))

        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .insert(itemsToInsert)
            .select()

        if (error) throw error

        // Log initial movements if userId provided
        if (userId && data && data.length > 0) {
            const movementPromises = data.map(item =>
                recordRegistration(hospitalId, item.id, item.current_location, userId)
            )
            await Promise.all(movementPromises)
        }

        return { data: data as RegisteredItem[], error: null }
    } catch (error) {
        console.error('Error registering bulk items:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to register items' }
    }
}

/**
 * Find an item by QR code
 */
export async function findByQR(
    hospitalId: string,
    qrCode: string
): Promise<ApiResponse<RegisteredItemWithRelations | null>> {
    try {
        const trimmed = qrCode.trim()

        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .select(`
        *,
        last_scanner:users!pharmacy_item_registry_last_scanned_by_fkey(id, full_name, email)
      `)
            .eq('hospital_id', hospitalId)
            .eq('qr_code', trimmed)
            .maybeSingle()

        if (error) throw error

        // If found, enrich with item details
        if (data) {
            const itemDetails = await getItemDetails(data.item_id, data.item_type)
            return {
                data: {
                    ...data,
                    item_details: itemDetails,
                    drug: data.item_type === 'drug' ? itemDetails : undefined,
                    non_drug: data.item_type === 'non_drug' ? itemDetails : undefined
                } as RegisteredItemWithRelations,
                error: null
            }
        }

        return { data: null, error: null }
    } catch (error) {
        console.error('Error finding item by QR:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to find item' }
    }
}

/**
 * Find an item by serial number
 */
export async function findBySerial(
    hospitalId: string,
    serialNumber: string
): Promise<ApiResponse<RegisteredItemWithRelations | null>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .select(`
        *,
        last_scanner:users!pharmacy_item_registry_last_scanned_by_fkey(id, full_name, email)
      `)
            .eq('hospital_id', hospitalId)
            .ilike('serial_number', serialNumber.trim())
            .maybeSingle()

        if (error) throw error

        if (data) {
            const itemDetails = await getItemDetails(data.item_id, data.item_type)
            return {
                data: {
                    ...data,
                    item_details: itemDetails
                } as RegisteredItemWithRelations,
                error: null
            }
        }

        return { data: null, error: null }
    } catch (error) {
        console.error('Error finding item by serial:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to find item' }
    }
}

/**
 * Update item status and location
 */
export async function updateItemStatus(
    registryId: string,
    newStatus: RegisteredItem['status'],
    location?: string,
    userId?: string
): Promise<ApiResponse<void>> {
    try {
        const updatePayload: any = {
            status: newStatus,
            last_scanned_at: new Date().toISOString(),
        }

        if (location) {
            updatePayload.current_location = location
        }

        if (userId) {
            updatePayload.last_scanned_by = userId
        }

        const { error } = await supabase
            .from('pharmacy_item_registry')
            .update(updatePayload)
            .eq('id', registryId)

        if (error) throw error
        return { data: undefined, error: null }
    } catch (error) {
        console.error('Error updating item status:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to update status' }
    }
}

/**
 * Get all items by batch
 */
export async function getItemsByBatch(
    batchId: string
): Promise<ApiResponse<RegisteredItemWithRelations[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .select(`
        *,
        last_scanner:users!pharmacy_item_registry_last_scanned_by_fkey(id, full_name, email)
      `)
            .eq('batch_id', batchId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data: data as RegisteredItemWithRelations[], error: null }
    } catch (error) {
        console.error('Error getting items by batch:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch items' }
    }
}

/**
 * Get all items by location
 */
export async function getItemsByLocation(
    hospitalId: string,
    location: string
): Promise<ApiResponse<RegisteredItemWithRelations[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .select(`
        *,
        last_scanner:users!pharmacy_item_registry_last_scanned_by_fkey(id, full_name, email)
      `)
            .eq('hospital_id', hospitalId)
            .ilike('current_location', location)
            .order('updated_at', { ascending: false })

        if (error) throw error
        return { data: data as RegisteredItemWithRelations[], error: null }
    } catch (error) {
        console.error('Error getting items by location:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch items' }
    }
}

/**
 * Get all registered items with filters
 */
export async function getRegisteredItems(
    hospitalId: string,
    filters?: {
        status?: RegisteredItem['status']
        item_type?: 'drug' | 'non_drug'
        location?: string
        search?: string
    }
): Promise<ApiResponse<RegisteredItemWithRelations[]>> {
    try {
        let query = supabase
            .from('pharmacy_item_registry')
            .select(`
        *,
        last_scanner:users!pharmacy_item_registry_last_scanned_by_fkey(id, full_name, email)
      `)
            .eq('hospital_id', hospitalId)

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.item_type) {
            query = query.eq('item_type', filters.item_type)
        }

        if (filters?.location) {
            query = query.ilike('current_location', `%${filters.location}%`)
        }

        if (filters?.search) {
            query = query.or(`qr_code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
        }

        const { data, error } = await query.order('updated_at', { ascending: false })

        if (error) throw error
        return { data: data as RegisteredItemWithRelations[], error: null }
    } catch (error) {
        console.error('Error getting registered items:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch items' }
    }
}

/**
 * Get a single registered item by ID with relations
 */
export async function getRegisteredItemById(
    registryId: string
): Promise<ApiResponse<RegisteredItemWithRelations>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_registry')
            .select(`
                *,
                item_details:item_id,
                batch_details:batch_id (
                    id,
                    batch_number,
                    expiry_date
                ),
                last_scanner:last_scanned_by (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('id', registryId)
            .single()

        if (error) throw error
        return { data: data as RegisteredItemWithRelations, error: null }
    } catch (error) {
        console.error('Error getting item by ID:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch item' }
    }
}

/**
 * Record a movement for an item with status validation
 */
export async function recordMovement(
    hospitalId: string,
    registryId: string,
    movementType: 'issued' | 'returned' | 'transferred' | 'decommissioned' | 'stolen' | 'damaged' | 'disposed',
    payload: {
        fromLocation: string;
        toLocation: string;
        userId: string;
        remarks?: string;
        scanMethod?: 'qr' | 'manual';
    }
): Promise<ApiResponse<any>> {
    try {
        // 1. Fetch current item state
        const { data: item, error: fetchError } = await supabase
            .from('pharmacy_item_registry')
            .select('status, current_location')
            .eq('id', registryId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Validate transition
        let nextStatus: RegisteredItem['status'] = 'available';

        switch (movementType) {
            case 'issued':
                if (item.status !== 'available' && item.status !== 'transferred') {
                    throw new Error(`Cannot issue item with current status: ${item.status}`);
                }
                nextStatus = 'issued';
                break;
            case 'returned':
                if (item.status !== 'issued') {
                    throw new Error(`Cannot return item that is not issued (Current: ${item.status})`);
                }
                nextStatus = 'available';
                break;
            case 'transferred':
                nextStatus = 'transferred';
                break;
            case 'decommissioned':
            case 'stolen':
            case 'damaged':
            case 'disposed':
                nextStatus = movementType;
                break;
        }

        // 3. Insert movement record
        const { data: movement, error: moveError } = await supabase
            .from('pharmacy_item_movements')
            .insert({
                hospital_id: hospitalId,
                item_registry_id: registryId,
                movement_type: movementType,
                from_location: payload.fromLocation,
                to_location: payload.toLocation,
                performed_by: payload.userId,
                performed_at: new Date().toISOString(),
                scan_method: payload.scanMethod || 'manual',
                quantity: 1,
                remarks: payload.remarks || `${movementType.toUpperCase()} via system`
            })
            .select()
            .single();

        if (moveError) throw moveError;

        // 4. Update registry status and location
        const { error: updateError } = await supabase
            .from('pharmacy_item_registry')
            .update({
                status: nextStatus,
                current_location: payload.toLocation,
                last_scanned_at: new Date().toISOString(),
                last_scanned_by: payload.userId
            })
            .eq('id', registryId);

        if (updateError) throw updateError;

        return { data: movement, error: null };
    } catch (error) {
        console.error('Error recording movement:', error);
        return { data: null, error: error instanceof Error ? error.message : 'Failed to record movement' };
    }
}

/**
 * Get movement history for a registered item
 */
export async function getMovementHistory(
    registryId: string
): Promise<ApiResponse<any[]>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_item_movements')
            .select(`
                *,
                user:performed_by (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('item_registry_id', registryId)
            .order('performed_at', { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error('Error fetching movement history:', error);
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch history' };
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get item details based on type (drug or non_drug)
 */
async function getItemDetails(itemId: string, itemType: 'drug' | 'non_drug') {
    try {
        if (itemType === 'drug') {
            const { data } = await supabase
                .from('master_drugs')
                .select('id, drug_code, drug_name, generic_name, dosage_form, strength')
                .eq('id', itemId)
                .single()
            return data
        } else {
            const { data } = await supabase
                .from('master_non_drugs')
                .select('id, item_code, item_name, category')
                .eq('id', itemId)
                .single()
            return data
        }
    } catch (error) {
        console.error('Error fetching item details:', error)
        return null
    }
}

/**
 * Generate QR code string
 */
export function generateQRCode(prefix: string, index: number, suffix?: string): string {
    const paddedIndex = String(index).padStart(6, '0')
    return `${prefix}${paddedIndex}${suffix || ''}`
}

/**
 * Validate QR code format
 */
export function validateQRCode(qrCode: string): boolean {
    // Basic validation: alphanumeric, 6-100 characters
    return /^[A-Z0-9-]{6,100}$/i.test(qrCode)
}
