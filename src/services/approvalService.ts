/**
 * Approval Workflow Service
 * Handles all approval workflow-related API calls
 */

import { supabase } from '../lib/supabase';
import type {
    ActionType,
    ApprovalWorkflow,
    ApprovalWorkflowStep,
    ApprovalCondition,
    ApprovalRequest,
    ApprovalActionRecord,
    ApprovalRequestWithDetails,
    CheckApprovalNeededResult,
    PendingApprovalForStaff,
} from '../types/rbac.types';

// ============================================
// APPROVAL CHECKING
// ============================================

/**
 * Check if an action needs approval based on workflows
 * Returns workflow ID if approval is needed
 */
export async function checkApprovalNeeded(
    actionTypeCode: string,
    requestData: Record<string, any>
): Promise<CheckApprovalNeededResult> {
    try {
        const { data, error } = await supabase.rpc('check_approval_needed', {
            p_action_type_code: actionTypeCode,
            p_request_data: requestData,
        });

        if (error) throw error;

        if (data && data.length > 0) {
            return {
                needs_approval: data[0].needs_approval,
                workflow_id: data[0].workflow_id,
            };
        }

        return { needs_approval: false, workflow_id: null };
    } catch (error) {
        console.error('[Approval Service] Error checking approval needed:', error);
        return { needs_approval: false, workflow_id: null };
    }
}

/**
 * Get pending approvals for a specific staff member
 */
export async function getPendingApprovalsForStaff(
    staffId: string
): Promise<PendingApprovalForStaff[]> {
    try {
        const { data, error } = await supabase.rpc('get_pending_approvals_for_staff', {
            p_staff_id: staffId,
        });

        if (error) throw error;
        return (data || []) as PendingApprovalForStaff[];
    } catch (error) {
        console.error('[Approval Service] Error getting pending approvals:', error);
        return [];
    }
}

// ============================================
// APPROVAL REQUEST MANAGEMENT
// ============================================

/**
 * Create a new approval request
 */
export async function createApprovalRequest(
    workflowId: string,
    requesterId: string,
    requestData: Record<string, any>,
    entityType: string,
    entityId?: string
): Promise<ApprovalRequest> {
    const { data, error } = await supabase
        .from('approval_requests')
        .insert({
            workflow_id: workflowId,
            requester_id: requesterId,
            request_data: requestData,
            entity_type: entityType,
            entity_id: entityId,
            current_step: 1,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get approval request by ID with full details
 */
export async function getApprovalRequestById(
    requestId: string
): Promise<ApprovalRequestWithDetails | null> {
    const { data, error } = await supabase
        .from('approval_requests')
        .select(`
      *,
      workflow:approval_workflows(*),
      requester:users!approval_requests_requester_id_fkey(
        id,
        full_name,
        email,
        role:roles(role_name),
        department:departments(department_name)
      ),
      actions:approval_actions(
        *,
        approver:users!approval_actions_approver_id_fkey(
          id,
          full_name,
          email,
          role:roles(role_name)
        )
      )
    `)
        .eq('id', requestId)
        .single();

    if (error) {
        console.error('[Approval Service] Error getting request:', error);
        return null;
    }

    return data as any;
}

/**
 * Get all approval requests (with filters)
 */
export async function getApprovalRequests(filters?: {
    status?: string;
    requesterId?: string;
    entityType?: string;
    fromDate?: string;
    toDate?: string;
}): Promise<ApprovalRequestWithDetails[]> {
    let query = supabase
        .from('approval_requests')
        .select(`
      *,
      workflow:approval_workflows(*),
      requester:users!approval_requests_requester_id_fkey(
        id,
        full_name,
        email,
        role:roles(role_name),
        department:departments(department_name)
      )
    `)
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.requesterId) {
        query = query.eq('requester_id', filters.requesterId);
    }
    if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.fromDate) {
        query = query.gte('created_at', filters.fromDate);
    }
    if (filters?.toDate) {
        query = query.lte('created_at', filters.toDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as any;
}

/**
 * Get requests created by a specific user
 */
export async function getMyRequests(userId: string): Promise<ApprovalRequestWithDetails[]> {
    return getApprovalRequests({ requesterId: userId });
}

/**
 * Approve an approval request
 */
export async function approveRequest(
    requestId: string,
    approverId: string,
    comments?: string
): Promise<void> {
    // Get the request to determine current step
    const request = await getApprovalRequestById(requestId);
    if (!request) throw new Error('Approval request not found');

    // Record the approval action
    const { error: actionError } = await supabase
        .from('approval_actions')
        .insert({
            request_id: requestId,
            step_order: request.current_step,
            approver_id: approverId,
            action: 'approve',
            comments,
        });

    if (actionError) throw actionError;

    // Get workflow steps to check if there are more steps
    const { data: steps, error: stepsError } = await supabase
        .from('approval_workflow_steps')
        .select('*')
        .eq('workflow_id', request.workflow_id)
        .order('step_order');

    if (stepsError) throw stepsError;

    const nextStep = request.current_step + 1;
    const hasMoreSteps = steps.some((s) => s.step_order === nextStep);

    // Update request status
    const { error: updateError } = await supabase
        .from('approval_requests')
        .update({
            current_step: hasMoreSteps ? nextStep : request.current_step,
            status: hasMoreSteps ? 'pending' : 'approved',
        })
        .eq('id', requestId);

    if (updateError) throw updateError;
}

/**
 * Reject an approval request
 */
export async function rejectRequest(
    requestId: string,
    approverId: string,
    comments?: string
): Promise<void> {
    // Get the request to determine current step
    const request = await getApprovalRequestById(requestId);
    if (!request) throw new Error('Approval request not found');

    // Record the rejection action
    const { error: actionError } = await supabase
        .from('approval_actions')
        .insert({
            request_id: requestId,
            step_order: request.current_step,
            approver_id: approverId,
            action: 'reject',
            comments,
        });

    if (actionError) throw actionError;

    // Update request status to rejected
    const { error: updateError } = await supabase
        .from('approval_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

    if (updateError) throw updateError;
}

/**
 * Cancel an approval request (by requester)
 */
export async function cancelRequest(requestId: string, requesterId: string): Promise<void> {
    const { error } = await supabase
        .from('approval_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('requester_id', requesterId); // Ensure only requester can cancel

    if (error) throw error;
}

// ============================================
// WORKFLOW MANAGEMENT (ADMIN)
// ============================================

export async function getAllActionTypes(): Promise<ActionType[]> {
    const { data, error } = await supabase
        .from('action_types')
        .select('*')
        .order('type_name');

    if (error) throw error;
    return data || [];
}

export async function createActionType(actionType: Partial<ActionType>): Promise<ActionType> {
    const { data, error } = await supabase
        .from('action_types')
        .insert(actionType)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getAllWorkflows(): Promise<ApprovalWorkflow[]> {
    const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getWorkflowById(id: string): Promise<ApprovalWorkflow | null> {
    const { data, error } = await supabase
        .from('approval_workflows')
        .select(`
      *,
      action_type:action_types(*),
      steps:approval_workflow_steps(*),
      conditions:approval_conditions(*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('[Approval Service] Error getting workflow:', error);
        return null;
    }

    return data as any;
}

export async function createWorkflow(workflow: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
    const { data, error } = await supabase
        .from('approval_workflows')
        .insert(workflow)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateWorkflow(
    id: string,
    updates: Partial<ApprovalWorkflow>
): Promise<ApprovalWorkflow> {
    const { data, error } = await supabase
        .from('approval_workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
        .from('approval_workflows')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// WORKFLOW STEPS MANAGEMENT
// ============================================

export async function saveWorkflowStep(
    step: Partial<ApprovalWorkflowStep>
): Promise<ApprovalWorkflowStep> {
    const { data, error } = await supabase
        .from('approval_workflow_steps')
        .insert(step)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteWorkflowStep(id: string): Promise<void> {
    const { error } = await supabase
        .from('approval_workflow_steps')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function deleteAllWorkflowSteps(workflowId: string): Promise<void> {
    const { error } = await supabase
        .from('approval_workflow_steps')
        .delete()
        .eq('workflow_id', workflowId);

    if (error) throw error;
}

// ============================================
// WORKFLOW CONDITIONS MANAGEMENT
// ============================================

export async function saveWorkflowCondition(
    condition: Partial<ApprovalCondition>
): Promise<ApprovalCondition> {
    const { data, error } = await supabase
        .from('approval_conditions')
        .insert(condition)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteWorkflowCondition(id: string): Promise<void> {
    const { error } = await supabase
        .from('approval_workflow_steps')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function deleteAllWorkflowConditions(workflowId: string): Promise<void> {
    const { error } = await supabase
        .from('approval_conditions')
        .delete()
        .eq('workflow_id', workflowId);

    if (error) throw error;
}

// ============================================
// COMPLETE WORKFLOW SAVE (ATOMIC)
// ============================================

/**
 * Save a complete workflow with conditions and steps
 * This is an atomic operation - either all succeed or all fail
 */
export async function saveCompleteWorkflow(
    workflow: Partial<ApprovalWorkflow>,
    conditions: Partial<ApprovalCondition>[],
    steps: Partial<ApprovalWorkflowStep>[]
): Promise<ApprovalWorkflow> {
    // If workflow has ID, update; otherwise create
    let savedWorkflow: ApprovalWorkflow;

    if (workflow.id) {
        savedWorkflow = await updateWorkflow(workflow.id, workflow);

        // Delete existing conditions and steps
        await deleteAllWorkflowConditions(workflow.id);
        await deleteAllWorkflowSteps(workflow.id);
    } else {
        savedWorkflow = await createWorkflow(workflow);
    }

    // Insert new conditions
    for (const condition of conditions) {
        await saveWorkflowCondition({
            ...condition,
            workflow_id: savedWorkflow.id,
        });
    }

    // Insert new steps
    for (const step of steps) {
        await saveWorkflowStep({
            ...step,
            workflow_id: savedWorkflow.id,
        });
    }

    return savedWorkflow;
}
