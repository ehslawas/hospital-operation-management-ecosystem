/**
 * Intrafacility Transfer Service
 * Handles transfers between Pharmacy Logistic and Hospital Departments
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
    TransferRequest,
    TransferRequestWithRelations,
    TransferFilter,
    TransferRequestFormData,
    TransferFlowDirection,
    TransferStatus
} from '@/types/pharmacy'

/**
 * Get departments that have an active Unit Catalog
 * Used for populating the "Department" dropdown in request forms
 */
export async function getDepartmentsWithCatalog(
    hospitalId: string
): Promise<ApiResponse<Array<{ id: string; department_name: string; department_code: string }>>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_unit_catalog')
            .select(`
        department_id,
        department:departments!inner(
          id,
          department_name,
          department_code
        )
      `)
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')

        if (error) throw error

        // Transform to flat structure
        const departments = data.map((item: any) => ({
            id: item.department.id, // Department ID (used for selection)
            catalog_id: item.id,    // Catalog ID (used for item filtering)
            department_name: item.department.department_name,
            department_code: item.department.department_code
        }))

        return { data: departments, error: null }
    } catch (error) {
        console.error('Error fetching catalog departments:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Create a new Intrafacility Request (Department -> Pharmacy)
 * - Validation: Can only request items present in Unit Catalog
 */
export async function createIntrafacilityRequest(
    hospitalId: string,
    userId: string,
    data: TransferRequestFormData
): Promise<ApiResponse<TransferRequest>> {
    try {
        if (!data.to_department_id) throw new Error("Target department is required")
        if (!data.required_date) throw new Error("Required date is required")

        // 1. Verify all items exist in the department's unit catalog
        if (data.items && data.items.length > 0) {
            const { data: catalogItems, error: catalogError } = await supabase
                .from('pharmacy_unit_catalog_items')
                .select('drug_id, non_drug_id')
                .eq('hospital_id', hospitalId)
                .in('department_id', [data.to_department_id]) // Assuming to_department_id is the requesting dept
                .eq('is_active', true)

            if (catalogError) throw catalogError

            const validItemIds = new Set([
                ...catalogItems.map(c => c.drug_id).filter(Boolean),
                ...catalogItems.map(c => c.non_drug_id).filter(Boolean)
            ])

            const invalidItems = data.items.filter(item => !validItemIds.has(item.item_id))

            if (invalidItems.length > 0) {
                return {
                    data: null,
                    error: `Cannot request items that are not in your Unit Catalog. Invalid items count: ${invalidItems.length}`
                }
            }
        }

        const now = new Date()
        const transferNumber = `TR-INTRA-${now.getFullYear()}-${String(Date.now()).slice(-6)}`

        const requestData = {
            transfer_number: transferNumber,
            transfer_type: 'intra_facility',
            flow_direction: 'request' as TransferFlowDirection,
            from_hospital_id: hospitalId, // Pharmacy Logistic (Central)
            // For intra request: "from" is effectively central store, "to" is department
            // But in the DB request record, usually 'from' = store, 'to' = dept logic is kept consistent?
            // Actually standard: Request FROM Dept TO Store? 
            // The current schema uses 'to_department_id' as the destination of goods.
            // So Department requests items -> Destination is Department. 
            to_hospital_id: hospitalId,
            to_department_id: data.to_department_id,
            request_date: now.toISOString(),
            required_date: data.required_date,
            status: 'pending',
            priority: data.priority,
            requested_by: userId,
            notes: data.notes
        }

        const { data: inserted, error } = await supabase
            .from('pharmacy_transfer_requests')
            .insert(requestData)
            .select('*')
            .single()

        if (error) throw error

        if (data.items && data.items.length > 0) {
            const items = data.items.map((item) => ({
                transfer_id: inserted.id,
                item_type: item.item_type,
                item_id: item.item_id,
                quantity_requested: item.quantity,
                notes: item.notes
            }))

            const { error: itemsError } = await supabase
                .from('pharmacy_transfer_request_items')
                .insert(items)

            if (itemsError) throw itemsError
        }

        return { data: inserted as TransferRequest, error: null }
    } catch (error) {
        console.error('Error creating intrafacility request:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Create a Pharmacy Issue (Push) (Pharmacy -> Department)
 * - Skips 'request' phase, goes directly to 'approved/preparing'
 */
export async function createPharmacyIssue(
    hospitalId: string,
    userId: string,
    data: TransferRequestFormData
): Promise<ApiResponse<TransferRequest>> {
    try {
        if (!data.to_department_id) throw new Error("Target department is required")

        const now = new Date()
        const transferNumber = `TR-ISSUE-${now.getFullYear()}-${String(Date.now()).slice(-6)}`

        const issueData = {
            transfer_number: transferNumber,
            transfer_type: 'intra_facility',
            flow_direction: 'issue' as TransferFlowDirection,
            from_hospital_id: hospitalId,
            to_hospital_id: hospitalId,
            to_department_id: data.to_department_id,
            request_date: now.toISOString(),
            status: 'approved', // Auto-approved since created by Pharmacy
            priority: 'normal',
            requested_by: userId, // Pharmacy user essentially requests it themselves
            approved_by: userId,
            approved_at: now.toISOString(),
            notes: data.notes
        }

        const { data: inserted, error } = await supabase
            .from('pharmacy_transfer_requests')
            .insert(issueData)
            .select('*')
            .single()

        if (error) throw error

        if (data.items && data.items.length > 0) {
            const items = data.items.map((item) => ({
                transfer_id: inserted.id,
                item_type: item.item_type,
                item_id: item.item_id,
                quantity_requested: item.quantity,
                quantity_approved: item.quantity, // Auto-approve quantity
                notes: item.notes
            }))

            const { error: itemsError } = await supabase
                .from('pharmacy_transfer_request_items')
                .insert(items)

            if (itemsError) throw itemsError
        }

        return { data: inserted as TransferRequest, error: null }
    } catch (error) {
        console.error('Error creating pharmacy issue:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Get Intrafacility Transfers
 */
export async function getIntrafacilityTransfers(
    hospitalId: string,
    filter?: TransferFilter & { department_id?: string; flow_direction?: string },
    page: number = 1,
    pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<TransferRequestWithRelations>>> {
    try {
        let query = supabase
            .from('pharmacy_transfer_requests')
            .select(`
        *,
        from_department:departments!from_department_id(department_name),
        to_department:departments!to_department_id(department_name),
        requested_by_user:users!requested_by(email, full_name),
        items:pharmacy_transfer_request_items(count)
      `, { count: 'exact' })
            .eq('from_hospital_id', hospitalId)
            .eq('transfer_type', 'intra_facility')

        if (filter?.search) {
            query = query.ilike('transfer_number', `%${filter.search}%`)
        }

        if (filter?.status && filter.status !== 'all') {
            query = query.eq('status', filter.status)
        }

        if (filter?.department_id) {
            query = query.eq('to_department_id', filter.department_id)
        }

        // Add logic for filtering by flow direction if needed

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await query
            .order('request_date', { ascending: false })
            .range(from, to)

        if (error) throw error

        return {
            data: {
                data: data as unknown as TransferRequestWithRelations[],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            },
            error: null
        }
    } catch (error) {
        console.error('Error fetching intrafacility transfers:', error)
        return { data: null, error: (error as Error).message }
    }
}

/**
 * Get single transfer detail with items
 */
export async function getIntrafacilityTransferDetail(
    transferId: string
): Promise<ApiResponse<TransferRequestWithRelations>> {
    try {
        const { data, error } = await supabase
            .from('pharmacy_transfer_requests')
            .select(`
                *,
                from_hospital:hospitals!from_hospital_id(*),
                to_hospital:hospitals!to_hospital_id(*),
                from_department:departments!from_department_id(*),
                to_department:departments!to_department_id(*),
                requested_by_user:users!requested_by(*),
                approved_by_user:users!approved_by(*),
                items:pharmacy_transfer_request_items(
                    *,
                    drug:drugs(*),
                    non_drug:pharmacy_non_drug_catalog(*),
                    catalog_item:pharmacy_unit_catalog_items(*)
                )
            `)
            .eq('id', transferId)
            .single();

        if (error) throw error;

        return { data: data as unknown as TransferRequestWithRelations, error: null };
    } catch (error) {
        console.error('Error fetching transfer detail:', error);
        return { data: null, error: (error as Error).message };
    }
}

/**
 * Update transfer status
 */
export async function updateTransferStatus(
    transferId: string,
    status: TransferStatus,
    userId: string,
    notes?: string
): Promise<ApiResponse<TransferRequest>> {
    try {
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'approved' || status === 'preparing') {
            updateData.approved_by = userId;
            updateData.approved_at = new Date().toISOString();
        }

        if (notes) {
            updateData.notes = notes;
        }

        const { data, error } = await supabase
            .from('pharmacy_transfer_requests')
            .update(updateData)
            .eq('id', transferId)
            .select()
            .single();

        if (error) throw error;

        return { data: data as TransferRequest, error: null };
    } catch (error) {
        console.error('Error updating transfer status:', error);
        return { data: null, error: (error as Error).message };
    }
}

/**
 * Process Issue (Finalize quantities and preparation)
 */
export async function processTransferIssue(
    transferId: string,
    items: Array<{ id: string; quantity_approved: number; notes?: string }>,
    userId: string
): Promise<ApiResponse<void>> {
    try {
        // 1. Update item quantities
        for (const item of items) {
            const { error: itemError } = await supabase
                .from('pharmacy_transfer_request_items')
                .update({
                    quantity_approved: item.quantity_approved,
                    notes: item.notes
                })
                .eq('id', item.id);

            if (itemError) throw itemError;
        }

        // 2. Update transfer status to 'preparing' or 'approved'
        const { error: transferError } = await supabase
            .from('pharmacy_transfer_requests')
            .update({
                status: 'approved',
                approved_by: userId,
                approved_at: new Date().toISOString()
            })
            .eq('id', transferId);

        if (transferError) throw transferError;

        return { data: null, error: null };
    } catch (error) {
        console.error('Error processing transfer issue:', error);
        return { data: null, error: (error as Error).message };
    }
}
