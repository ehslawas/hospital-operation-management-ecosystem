/**
 * TypeScript Type Definitions for RBAC System
 * Generated from Supabase schema
 */

// ============================================
// CORE PERMISSION TYPES
// ============================================

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type PermissionType = 'grant' | 'deny';

export interface Module {
    id: string;
    module_name: string;
    module_code: string;
    parent_module_id: string | null;
    route_path: string;
    icon_name: string | null;
    display_order: number;
    is_active: boolean;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface Feature {
    id: string;
    module_id: string;
    feature_name: string;
    feature_code: string;
    description: string | null;
    created_at: Date;
}

export interface RolePermission {
    id: string;
    role_id: string;
    module_id: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    granted_at: Date;
    granted_by: string | null;
}

export interface RoleFeaturePermission {
    id: string;
    role_id: string;
    feature_id: string;
    is_enabled: boolean;
    granted_at: Date;
    granted_by: string | null;
}

export interface StaffCustomPermission {
    id: string;
    user_id: string;
    module_id: string | null;
    feature_id: string | null;
    permission_type: PermissionType;
    action: PermissionAction | null;
    created_at: Date;
    created_by: string | null;
}

// ============================================
// COMPOSITE PERMISSION TYPES (for UI/API)
// ============================================

export interface ModuleWithPermissions extends Module {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    children?: ModuleWithPermissions[];
}

export interface FeatureWithPermission extends Feature {
    is_enabled: boolean;
    module: Module;
}

export interface PermissionOverride {
    moduleId?: string;
    featureId?: string;
    permissionType: PermissionType;
    action?: PermissionAction;
}

// ============================================
// APPROVAL WORKFLOW TYPES
// ============================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ApprovalAction = 'approve' | 'reject';

export type ConditionOperator =
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in';

export interface ActionType {
    id: string;
    type_name: string;
    type_code: string;
    description: string | null;
    created_at: Date;
}

export interface ApprovalWorkflow {
    id: string;
    workflow_name: string;
    action_type_id: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
}

export interface ApprovalWorkflowStep {
    id: string;
    workflow_id: string;
    step_order: number;
    approver_role_id: string | null;
    approver_department_id: string | null;
    approver_user_id: string | null;
    is_required: boolean;
    can_reject: boolean;
    created_at: Date;
}

export interface ApprovalCondition {
    id: string;
    workflow_id: string;
    field_name: string;
    operator: ConditionOperator;
    field_value: string;
    created_at: Date;
}

export interface ApprovalRequest {
    id: string;
    workflow_id: string;
    requester_id: string;
    request_data: Record<string, any>;
    entity_type: string;
    entity_id: string | null;
    current_step: number;
    status: ApprovalStatus;
    created_at: Date;
    updated_at: Date;
}

export interface ApprovalActionRecord {
    id: string;
    request_id: string;
    step_order: number;
    approver_id: string;
    action: ApprovalAction;
    comments: string | null;
    created_at: Date;
}

// ============================================
// COMPOSITE APPROVAL WORKFLOW TYPES (for UI)
// ============================================

export interface ApprovalWorkflowWithDetails extends ApprovalWorkflow {
    action_type: ActionType;
    steps: ApprovalWorkflowStepWithDetails[];
    conditions: ApprovalCondition[];
}

export interface ApprovalWorkflowStepWithDetails extends ApprovalWorkflowStep {
    approver_role_name?: string;
    approver_department_name?: string;
    approver_user_name?: string;
}

export interface ApprovalRequestWithDetails extends ApprovalRequest {
    workflow: ApprovalWorkflow;
    requester: {
        id: string;
        full_name: string;
        email: string;
        role_name: string;
        department_name: string;
    };
    actions: ApprovalActionWithDetails[];
    current_step_details?: ApprovalWorkflowStepWithDetails;
}

export interface ApprovalActionWithDetails extends ApprovalActionRecord {
    approver: {
        id: string;
        full_name: string;
        email: string;
        role_name: string;
    };
    step_details: ApprovalWorkflowStepWithDetails;
}

// ============================================
// FORM/INPUT TYPES (for Admin UI)
// ============================================

export interface ModuleFormData {
    module_name: string;
    module_code: string;
    parent_module_id: string | null;
    route_path: string;
    icon_name: string | null;
    display_order: number;
    is_active: boolean;
    description: string | null;
}

export interface FeatureFormData {
    module_id: string;
    feature_name: string;
    feature_code: string;
    description: string | null;
}

export interface RolePermissionFormData {
    role_id: string;
    permissions: {
        module_id: string;
        can_view: boolean;
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
    }[];
    feature_permissions: {
        feature_id: string;
        is_enabled: boolean;
    }[];
}

export interface StaffCustomPermissionFormData {
    user_id: string;
    overrides: {
        module_id?: string;
        feature_id?: string;
        permission_type: PermissionType;
        action?: PermissionAction;
    }[];
}

export interface ApprovalWorkflowFormData {
    workflow_name: string;
    action_type_id: string;
    description: string | null;
    is_active: boolean;
    conditions: {
        field_name: string;
        operator: ConditionOperator;
        field_value: string;
    }[];
    steps: {
        step_order: number;
        approver_role_id?: string;
        approver_department_id?: string;
        approver_user_id?: string;
        is_required: boolean;
        can_reject: boolean;
    }[];
}

// ============================================
// DATABASE FUNCTION RETURN TYPES
// ============================================

export interface CheckApprovalNeededResult {
    needs_approval: boolean;
    workflow_id: string | null;
}

export interface PendingApprovalForStaff {
    request_id: string;
    workflow_name: string;
    requester_name: string;
    request_data: Record<string, any>;
    entity_type: string;
    entity_id: string | null;
    current_step: number;
    step_order: number;
    created_at: Date;
}

// ============================================
// CONTEXT/HOOK TYPES
// ============================================

export interface PermissionCheckResult {
    hasAccess: boolean;
    isLoading: boolean;
    error: Error | null;
}

export interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    role_id: string;
    role_name: string;
    role_code: string;
    department_id: string | null;
    department_name: string | null;
    hospital_id: string | null;
}

export interface PermissionCacheEntry {
    moduleCode: string;
    action: PermissionAction;
    hasPermission: boolean;
    timestamp: number;
}

export interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    error: Error | null;
    checkPermission: (moduleCode: string, action: PermissionAction) => Promise<boolean>;
    checkFeatureAccess: (featureCode: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshPermissions: () => Promise<void>;
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OmitFields<T, K extends keyof T> = Omit<T, K>;
