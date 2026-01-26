/**
 * Oxygen Department Service
 * Handles requests from departments and issuance of cylinders.
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
    OxygenCylinderSize,
} from '@/types/pharmacy' // Check types

// Define types locally if not yet in global types
export interface OxygenDeptRequest {
    id: string
    hospital_id: string
    request_id: string
    department_id: string
    requested_by: string
    status: 'pending' | 'approved' | 'rejected' | 'partial' | 'completed' | 'cancelled'
    approved_by?: string | null
    approved_at?: string | null
    rejected_by?: string | null
    rejected_at?: string | null
    rejection_reason?: string | null
    created_at: string
    updated_at: string
    document_url?: string | null
}

export interface CylinderBalance {
    total: number
    available: number
    issued: number
    empty: number
    returned: number
    avg_usage_month: number
}

export interface OxygenDeptRequestItem {
    id: string
    request_id: string
    cylinder_size_id: string
    quantity: number
    quantity_issued: number
    created_at: string
}

export interface OxygenDeptRequestWithRelations extends OxygenDeptRequest {
    department: { department_name: string }
    requester: { full_name: string }
    items: (OxygenDeptRequestItem & { size: OxygenCylinderSize })[]
}

/**
 * Get all department requests
 */
export async function getDeptRequests(
    hospitalId: string,
    filters: { status?: string; department_id?: string },
    page = 1,
    pageSize = 10
): Promise<ApiResponse<PaginatedResponse<OxygenDeptRequestWithRelations>>> {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from('pharmacy_oxygen_dept_requests')
            .select(`
        *,
        department:departments(department_name),
        requester:users(full_name),
        items:pharmacy_oxygen_dept_request_items(
          *,
          size:pharmacy_oxygen_cylinder_sizes(*)
        )
      `, { count: 'exact' })
            .eq('hospital_id', hospitalId)

        if (filters.status) query = query.eq('status', filters.status)
        if (filters.department_id) query = query.eq('department_id', filters.department_id)

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        return {
            data: {
                data: data as any[],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize),
            },
            error: null,
        }
    } catch (error) {
        console.error('Error fetching dept requests:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
    }
}

/**
 * Issue cylinders to department (Manual or via Request)
 */
export async function issueCylindersToDepartment(
    hospitalId: string,
    data: {
        request_id?: string // Optional, if linked to a request
        department_id: string
        issued_by: string
        issued_at: string
        cylinders: string[] // List of QR codes
        requester_name?: string
        issuer_name?: string
    }
): Promise<ApiResponse<void>> {
    try {
        const { checkApprovalNeeded, createApprovalRequest } = await import('../approvalService');

        const requestData = {
            department_id: data.department_id,
            request_id: data.request_id,
            items_count: data.cylinders.length,
            issuer_id: data.issued_by
        };

        // 0. Check Approval
        const { needs_approval, workflow_id } = await checkApprovalNeeded('oxygen_cylinder_issue', requestData);

        if (needs_approval && workflow_id) {
            await createApprovalRequest(
                workflow_id,
                data.issued_by,
                { ...requestData, cylinders: data.cylinders }, // Store cylinders in request data
                'oxygen_issuance',
                data.request_id || `MANUAL-${Date.now()}` // Fallback ID if manual
            );
            return { data: { approval_required: true } as any, error: null };
        }

        // 1. Validate cylinders (must be available)
        const { data: validCylinders, error: valError } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select('id, qr_code, status, current_location, cylinder_size_id')
            .eq('hospital_id', hospitalId)
            .in('qr_code', data.cylinders)
            .eq('status', 'available')

        if (valError) throw valError

        const foundQRs = validCylinders?.map(c => c.qr_code) || []
        const invalidQRs = data.cylinders.filter(qr => !foundQRs.includes(qr))

        if (invalidQRs.length > 0) {
            throw new Error(`Invalid or unavailable cylinders: ${invalidQRs.join(', ')}`)
        }

        // 2. Perform updates 
        for (const cyl of validCylinders!) {
            // Update Inventory
            const { error: upError } = await supabase
                .from('pharmacy_oxygen_cylinder_inventory')
                .update({
                    status: 'issued',
                    current_location: 'Department',
                    department_id: data.department_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', cyl.id)

            if (upError) throw upError

            // Log Movement
            const { error: movError } = await supabase
                .from('pharmacy_oxygen_cylinder_movements')
                .insert({
                    hospital_id: hospitalId,
                    cylinder_id: cyl.id,
                    movement_type: 'issued',
                    from_location: cyl.current_location,
                    to_location: 'Department',
                    department_id: data.department_id,
                    moved_by: data.issued_by,
                    moved_at: data.issued_at,
                    remarks: `Requester: ${data.requester_name || 'N/A'}, Issuer: ${data.issuer_name || 'N/A'}${data.request_id ? ` (Req ID: ${data.request_id})` : ''}`
                })

            if (movError) throw movError
        }

        // 3. Update or Create Request Record
        let finalRequestId = data.request_id;

        if (data.request_id) {
            // Update existing request record to completed
            const { data: reqData } = await supabase
                .from('pharmacy_oxygen_dept_requests')
                .select('id')
                .eq('request_id', data.request_id)
                .single()

            if (reqData) {
                const { error: reqError } = await supabase
                    .from('pharmacy_oxygen_dept_requests')
                    .update({ status: 'completed' })
                    .eq('id', reqData.id)

                if (reqError) console.warn('Failed to update request status', reqError)
            }
        } else {
            // AUTO-GENERATE COMPLETED REQUEST FOR MANUAL FLOW
            // This ensures manual supplies show up on the "Cylinder Request" page for full tracking.

            // a. Generate Request ID
            const year = new Date().getFullYear()
            const { count } = await supabase
                .from('pharmacy_oxygen_dept_requests')
                .select('*', { count: 'exact', head: true })
                .eq('hospital_id', hospitalId)

            const nextNum = (count || 0) + 1
            finalRequestId = `OC-${year}-${String(nextNum).padStart(4, '0')}`

            // b. Create Request Header (immediately as completed)
            const { data: newReqHeader, error: headerError } = await supabase
                .from('pharmacy_oxygen_dept_requests')
                .insert({
                    hospital_id: hospitalId,
                    request_id: finalRequestId,
                    department_id: data.department_id,
                    requested_by: data.issued_by, // Initiated by Pharmacy staff
                    status: 'completed',
                    approved_by: data.issued_by,
                    approved_at: data.issued_at
                })
                .select()
                .single()

            if (headerError) throw headerError

            // c. Create Request Items (grouping by size from scanned cylinders)
            const itemsMap = new Map<string, number>();
            validCylinders?.forEach(c => {
                const sizeId = c.cylinder_size_id;
                itemsMap.set(sizeId, (itemsMap.get(sizeId) || 0) + 1);
            });

            const itemsToInsert = Array.from(itemsMap.entries()).map(([sizeId, qty]) => ({
                request_id: newReqHeader.id,
                cylinder_size_id: sizeId,
                quantity: qty,
                quantity_issued: qty
            }))

            const { error: itemError } = await supabase
                .from('pharmacy_oxygen_dept_request_items')
                .insert(itemsToInsert)

            if (itemError) throw itemError
        }

        return { data: { approval_required: false, request_id: finalRequestId } as any, error: null }
    } catch (error) {
        console.error('Error issuing cylinders:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to issue' }
    }
}

/**
 * Create a new department request (for testing/manual creation)
 */
export async function createDeptRequest(
    hospitalId: string,
    data: {
        department_id: string
        requested_by: string
        items: { cylinder_size_id: string; quantity: number }[]
    }
): Promise<ApiResponse<void>> {
    try {
        // Generate Request ID
        const year = new Date().getFullYear()
        const { count } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)

        const nextNum = (count || 0) + 1
        const requestId = `OC-${year}-${String(nextNum).padStart(4, '0')}`

        // Create Request
        const { data: req, error: reqError } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .insert({
                hospital_id: hospitalId,
                request_id: requestId,
                department_id: data.department_id,
                requested_by: data.requested_by,
                status: 'pending'
            })
            .select()
            .single()

        if (reqError) throw reqError

        // Create Items
        const itemsToInsert = data.items.map(item => ({
            request_id: req.id,
            cylinder_size_id: item.cylinder_size_id,
            quantity: item.quantity
        }))

        const { error: itemError } = await supabase
            .from('pharmacy_oxygen_dept_request_items')
            .insert(itemsToInsert)

        if (itemError) throw itemError

        return { data: undefined, error: null }
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to create request' }
    }
}

/**
 * Update an existing department request (Only if status is pending)
 */
export async function updateDeptRequest(
    requestId: string,
    data: {
        department_id?: string
        items: { cylinder_size_id: string; quantity: number }[]
    }
): Promise<ApiResponse<void>> {
    try {
        // 1. Get current request to check status
        const { data: currentReq, error: getError } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .select('id, status')
            .eq('id', requestId)
            .single()

        if (getError) throw getError
        if (currentReq.status !== 'pending') {
            throw new Error('Only pending requests can be edited.')
        }

        // 2. Update Header (if department changed)
        if (data.department_id) {
            const { error: updateError } = await supabase
                .from('pharmacy_oxygen_dept_requests')
                .update({
                    department_id: data.department_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (updateError) throw updateError
        }

        // 3. Update Items (Delete and Re-insert is safest for multi-item arrays)
        const { error: deleteError } = await supabase
            .from('pharmacy_oxygen_dept_request_items')
            .delete()
            .eq('request_id', requestId)

        if (deleteError) throw deleteError

        const itemsToInsert = data.items.map(item => ({
            request_id: requestId,
            cylinder_size_id: item.cylinder_size_id,
            quantity: item.quantity
        }))

        const { error: insertError } = await supabase
            .from('pharmacy_oxygen_dept_request_items')
            .insert(itemsToInsert)

        if (insertError) throw insertError

        return { data: undefined, error: null }
    } catch (error) {
        console.error('Error updating request:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to update request' }
    }
}

/**
 * Approve a department request
 */
export async function approveDeptRequest(
    requestId: string,
    approvedBy: string
): Promise<ApiResponse<void>> {
    try {

        const { error } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .update({
                status: 'approved',
                approved_by: approvedBy,
                approved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId)

        if (error) throw error

        return { data: undefined, error: null }
    } catch (error) {
        console.error('Error approving request:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to approve request' }
    }
}

/**
 * Reject a department request
 */
export async function rejectDeptRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
): Promise<ApiResponse<void>> {
    try {

        const { error } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .update({
                status: 'rejected',
                rejected_by: rejectedBy,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId)

        if (error) throw error

        return { data: undefined, error: null }
    } catch (error) {
        console.error('Error rejecting request:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to reject request' }
    }
}

/**
 * Get cylinder balance for a specific size
 */
export async function getCylinderBalance(
    hospitalId: string,
    sizeId: string
): Promise<ApiResponse<CylinderBalance>> {
    try {
        // Get all cylinders for this size
        const { data: cylinders, error } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select('id, status, updated_at')
            .eq('hospital_id', hospitalId)
            .eq('cylinder_size_id', sizeId)

        if (error) throw error

        const total = cylinders?.length || 0
        const available = cylinders?.filter(c => c.status === 'available').length || 0
        const issued = cylinders?.filter(c => c.status === 'issued').length || 0
        const empty = cylinders?.filter(c => c.status === 'empty').length || 0
        const returned = cylinders?.filter(c => c.status === 'returned').length || 0

        // Calculate average monthly usage (issued cylinders in last 3 months)
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        const { count } = await supabase
            .from('pharmacy_oxygen_cylinder_movements')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)
            .eq('movement_type', 'issued')
            .gte('moved_at', threeMonthsAgo.toISOString())
            .in('cylinder_id', cylinders?.map(c => c.id) || [])

        const avg_usage_month = Math.round((count || 0) / 3)

        return {
            data: {
                total,
                available,
                issued,
                empty,
                returned,
                avg_usage_month
            },
            error: null
        }
    } catch (error) {
        console.error('Error getting cylinder balance:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to get balance' }
    }
}

export const uploadRequestDocument = async (id: string, file: Blob): Promise<ApiResponse<string>> => {
    try {
        const fileName = `request_${id}_${Date.now()}.pdf`
        const { data, error } = await supabase.storage
            .from('documents') // Using general documents bucket
            .upload(`pharmacy/oxygen/requests/${fileName}`, file, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (error) throw error

        const publicUrl = supabase.storage.from('documents').getPublicUrl(data.path).data.publicUrl

        // Update record
        const { error: updateError } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .update({ document_url: publicUrl })
            .eq('request_id', id)

        if (updateError) throw updateError

        return { data: publicUrl, error: null }
    } catch (err: any) {
        return { data: null, error: err.message }
    }
}

/**
 * Delete a department request
 * Only allows deleting if status is pending
 */
export async function deleteDeptRequest(requestId: string): Promise<ApiResponse<void>> {
    try {
        // 1. Get current status
        const { data: currentReq, error: getError } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .select('status')
            .eq('id', requestId)
            .single()

        if (getError) throw getError
        if (currentReq.status !== 'pending') {
            throw new Error('Only pending requests can be deleted.')
        }

        // 2. Delete items (cascade should handle this if defined, but being explicit is safer)
        const { error: itemError } = await supabase
            .from('pharmacy_oxygen_dept_request_items')
            .delete()
            .eq('request_id', requestId)

        if (itemError) throw itemError

        // 3. Delete header
        const { error: headerError } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .delete()
            .eq('id', requestId)

        if (headerError) throw headerError

        return { data: undefined, error: null }
    } catch (error) {
        console.error('Error deleting request:', error)
        return { data: null, error: error instanceof Error ? error.message : 'Failed to delete' }
    }
}
