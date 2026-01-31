import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface OxygenStockAdjustment {
    id: string
    hospital_id: string
    cylinder_id: string
    adjusted_by: string
    old_status: string
    new_status: string
    reason: string
    remarks?: string
    created_at: string
}

export interface CylinderStockSummary {
    status: string
    count: number
}

// Get stock summary counts by status
export const getStockSummaryByStatus = async (hospitalId: string): Promise<ApiResponse<CylinderStockSummary[]>> => {
    try {
        const { data, error } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select('status, id', { count: 'exact' })
            .eq('hospital_id', hospitalId)

        if (error) throw error

        // Group by status
        const summaryMap = new Map<string, number>()
        data.forEach(item => {
            const current = summaryMap.get(item.status) || 0
            summaryMap.set(item.status, current + 1)
        })

        const summary: CylinderStockSummary[] = Array.from(summaryMap.entries()).map(([status, count]) => ({
            status,
            count
        }))

        return { data: summary, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

// Adjust a single cylinder's status and location
export const adjustCylinderStatus = async (
    hospitalId: string,
    cylinderId: string,
    newStatus: string,
    reason: string,
    remarks: string,
    userId: string,
    oldStatus: string,
    newLocation?: string,
    newDepartmentId?: string | null
): Promise<ApiResponse<void>> => {
    try {
        const updateData: any = {
            status: newStatus,
            last_reconciled_at: new Date().toISOString()
        }
        if (newLocation !== undefined) updateData.current_location = newLocation
        if (newDepartmentId !== undefined) updateData.department_id = newDepartmentId

        const { error: updateError } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update(updateData)
            .eq('id', cylinderId)
            .eq('hospital_id', hospitalId)

        if (updateError) throw updateError

        // 2. Create Audit Log
        const { error: auditError } = await supabase
            .from('pharmacy_oxygen_stock_adjustments')
            .insert({
                hospital_id: hospitalId,
                cylinder_id: cylinderId,
                adjusted_by: userId,
                old_status: oldStatus,
                new_status: newStatus,
                reason,
                remarks: remarks || `Location: ${newLocation || 'N/A'}, Dept: ${newDepartmentId || 'N/A'}`
            })

        if (auditError) throw auditError

        return { data: null, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

// Bulk adjust multiple cylinders
export const bulkAdjustCylinderStatus = async (
    hospitalId: string,
    cylinderIds: string[],
    newStatus: string,
    reason: string,
    remarks: string,
    userId: string,
    cylindersData: { id: string, status: string }[],
    newLocation?: string,
    newDepartmentId?: string | null
): Promise<ApiResponse<void>> => {
    try {
        // 1. Update Inventory for all cylinders
        const updateData: any = {
            status: newStatus,
            last_reconciled_at: new Date().toISOString()
        }
        if (newLocation !== undefined) updateData.current_location = newLocation
        if (newDepartmentId !== undefined) updateData.department_id = newDepartmentId

        const { error: updateError } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update(updateData)
            .in('id', cylinderIds)
            .eq('hospital_id', hospitalId)

        if (updateError) throw updateError

        // 2. Create Audit Logs for each
        const auditLogs = cylindersData.map(c => ({
            hospital_id: hospitalId,
            cylinder_id: c.id,
            adjusted_by: userId,
            old_status: c.status,
            new_status: newStatus,
            reason,
            remarks: remarks || `Bulk Update. Location: ${newLocation || 'N/A'}, Dept: ${newDepartmentId || 'N/A'}`
        }))

        const { error: auditError } = await supabase
            .from('pharmacy_oxygen_stock_adjustments')
            .insert(auditLogs)

        if (auditError) throw auditError

        return { data: null, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

// Get adjustment history
export const getAdjustmentHistory = async (
    hospitalId: string,
    page: number = 1,
    pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<any>>> => {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, count, error } = await supabase
            .from('pharmacy_oxygen_stock_adjustments')
            .select(`
                *,
                cylinder:pharmacy_oxygen_cylinder_inventory(qr_code, serial_number),
                adjuster:adjusted_by(full_name)
            `, { count: 'exact' })
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        return {
            data: {
                data: data || [],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            },
            error: null
        }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}
