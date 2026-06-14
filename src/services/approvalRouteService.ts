import { supabase } from './supabase'
import type { ApprovalRoute, ApprovalLog } from '@/types'
import { checkUserResourceAccess } from './resourcePermissionService'

/**
 * Get the appropriate approval route for a department
 */
export async function getApprovalRoute(departmentId: string): Promise<ApprovalRoute[]> {
    try {
        // 1. Get department to check approval type
        const { data: dept, error: deptError } = await supabase
            .from('departments')
            .select('approval_type')
            .eq('id', departmentId)
            .single()

        if (deptError || !dept) throw new Error('Department not found')

        const routeType = dept.approval_type || 'standard'

        // 2. Get the approval route steps
        const { data: routes, error: routeError } = await supabase
            .from('approval_routes')
            .select('*')
            .eq('route_type', routeType)
            .order('step_order', { ascending: true })

        if (routeError) throw routeError
        return (routes || []) as ApprovalRoute[]
    } catch (error) {
        console.error('Error fetching approval route:', error)
        return []
    }
}

/**
 * Check if the current user can approve a specific Purchase Order
 * based on workflow steps and permission matrix.
 */
export async function canUserApprovePurchaseOrder(
    userId: string,
    poId: string
): Promise<{ canApprove: boolean; message?: string }> {
    try {
        // 1. Get user details
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id, department_id, roles(role_code)')
            .eq('id', userId)
            .single()

        if (userError || !user) return { canApprove: false, message: 'User not found' }

        // System Admins have absolute right (Bypass)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((user.roles as any)?.role_code === 'system_admin') {
            return { canApprove: true }
        }

        // 2. Get PO details
        const { data: po, error: poError } = await supabase
            .from('pharmacy_purchase_orders')
            .select('status, workflow_id, current_step')
            .eq('id', poId)
            .single()

        if (poError || !po) return { canApprove: false, message: 'Purchase order not found' }

        // Only pending_approval status can be approved
        if (po.status !== 'pending_approval') {
            return { canApprove: false, message: `PO status is ${po.status}. Only pending approval POs can be approved.` }
        }

        // PER USER REQUIREMENT: Require workflow
        if (!po.workflow_id) {
            return { canApprove: false, message: 'This purchase order has no approval workflow attached.' }
        }

        // 3. Check Permission Matrix (can_approve)
        const hasMatrixPermission = await checkUserResourceAccess(userId, 'purchase_order', 'approve')
        if (!hasMatrixPermission) {
            return { canApprove: false, message: 'Your role does not have "Approve" permission in the permission matrix.' }
        }

        // 4. Check Workflow Step Authorization
        const { data: currentStep, error: stepError } = await supabase
            .from('approval_workflow_steps')
            .select('*')
            .eq('workflow_id', po.workflow_id)
            .eq('step_order', po.current_step || 1)
            .single()

        if (stepError || !currentStep) {
            return { canApprove: false, message: 'Could not find current workflow step definition.' }
        }

        // Authorization logic:
        // Must match EITHER user_id, role_id, OR department_id as defined in the step
        let authorized = false

        if (currentStep.approver_user_id) {
            authorized = currentStep.approver_user_id === userId
        } else if (currentStep.approver_role_id && currentStep.approver_department_id) {
            // Strictly check both if both defined
            authorized = currentStep.approver_role_id === user.role_id &&
                currentStep.approver_department_id === user.department_id
        } else if (currentStep.approver_role_id) {
            authorized = currentStep.approver_role_id === user.role_id
        } else if (currentStep.approver_department_id) {
            authorized = currentStep.approver_department_id === user.department_id
        }

        if (!authorized) {
            return {
                canApprove: false,
                message: 'You are not authorized for the current approval step of this workflow.'
            }
        }

        return { canApprove: true }
    } catch (error) {
        console.error('Error checking workflow authorization:', error)
        return { canApprove: false, message: 'Internal error checking authorization' }
    }
}

/**
 * Process an approval action and log it
 */
export async function processApproval(
    entityType: string,
    entityId: string,
    action: 'approved' | 'rejected' | 'escalated' | 'auto_finalized',
    stepOrder: number,
    comments?: string
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // 1. Get user IP (best effort in client-side context, often handled by edge functions)
        // In a pure client service, we might not have IP.

        // 2. Log to approval_logs
        const { error } = await supabase
            .from('approval_logs')
            .insert({
                entity_type: entityType,
                entity_id: entityId,
                step_order: stepOrder,
                action: action,
                approved_by: user.id,
                comments: comments,
                user_agent: navigator.userAgent
            })

        if (error) throw error

        // 3. Update the entity status
        // This would typically be a specific service call (e.g., updatePOStatus),
        // but the generic logging service handles the audit trail part.

    } catch (error) {
        console.error('Error processing approval:', error)
        throw error
    }

}

/**
 * Get approval history for an entity
 */
export async function getApprovalLogs(
    entityType: string,
    entityId: string
): Promise<ApprovalLog[]> {
    try {
        const { data, error } = await supabase
            .from('approval_logs')
            .select('*, approver:users(full_name, roles(role_name))')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as ApprovalLog[]
    } catch (error) {
        console.error('Error fetching approval logs:', error)
        return []
    }
}
