-- ============================================================================
-- Migration 101: RBAC Database Functions
-- Description: Core functions for permission checking and approval workflows
-- Created: 2026-01-18
-- ============================================================================

-- ============================================
-- FUNCTION 1: Check Staff Permission
-- ============================================
-- Purpose: Check if a staff member has permission for a specific module action
-- Returns: boolean (true if permitted, false otherwise)
-- Priority: Custom overrides > Role permissions

CREATE OR REPLACE FUNCTION public.check_staff_permission(
    p_staff_id UUID,
    p_module_code TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_custom_override TEXT;
BEGIN
    -- Input validation
    IF p_staff_id IS NULL OR p_module_code IS NULL OR p_action IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check for custom permission overrides first (higher priority)
    SELECT scp.permission_type INTO v_custom_override
    FROM public.staff_custom_permissions scp
    JOIN public.modules m ON m.id = scp.module_id
    WHERE scp.user_id = p_staff_id
        AND m.module_code = p_module_code
        AND scp.action = p_action;
    
    -- If explicitly denied, return false immediately
    IF v_custom_override = 'deny' THEN
        RETURN false;
    END IF;
    
    -- If explicitly granted, return true immediately
    IF v_custom_override = 'grant' THEN
        RETURN true;
    END IF;
    
    -- No custom override found, check role permissions
    SELECT CASE
        WHEN p_action = 'view' THEN COALESCE(rp.can_view, false)
        WHEN p_action = 'create' THEN COALESCE(rp.can_create, false)
        WHEN p_action = 'edit' THEN COALESCE(rp.can_edit, false)
        WHEN p_action = 'delete' THEN COALESCE(rp.can_delete, false)
        ELSE false
    END INTO v_has_permission
    FROM public.users u
    JOIN public.role_permissions rp ON rp.role_id = u.role_id
    JOIN public.modules m ON m.id = rp.module_id
    WHERE u.id = p_staff_id
        AND m.module_code = p_module_code
        AND m.is_active = true;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_staff_permission IS 'Checks if staff has permission for module action, considering custom overrides';

-- ============================================
-- FUNCTION 2: Check Approval Needed
-- ============================================
-- Purpose: Determine if an action requires approval and which workflow to use
-- Returns: Table with needs_approval (boolean) and workflow_id (uuid)

CREATE OR REPLACE FUNCTION public.check_approval_needed(
    p_action_type_code TEXT,
    p_request_data JSONB
) RETURNS TABLE(needs_approval BOOLEAN, workflow_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true::BOOLEAN as needs_approval,
        aw.id as workflow_id
    FROM public.approval_workflows aw
    JOIN public.action_types at ON at.id = aw.action_type_id
    WHERE at.type_code = p_action_type_code
        AND aw.is_active = true
        -- All conditions must match (AND logic)
        AND NOT EXISTS (
            SELECT 1 FROM public.approval_conditions ac
            WHERE ac.workflow_id = aw.id
                AND NOT (
                    CASE ac.operator
                        WHEN '=' THEN (p_request_data->>ac.field_name) = ac.field_value
                        WHEN '!=' THEN (p_request_data->>ac.field_name) != ac.field_value
                        WHEN '>' THEN (p_request_data->>ac.field_name)::NUMERIC > ac.field_value::NUMERIC
                        WHEN '<' THEN (p_request_data->>ac.field_name)::NUMERIC < ac.field_value::NUMERIC
                        WHEN '>=' THEN (p_request_data->>ac.field_name)::NUMERIC >= ac.field_value::NUMERIC
                        WHEN '<=' THEN (p_request_data->>ac.field_name)::NUMERIC <= ac.field_value::NUMERIC
                        WHEN 'contains' THEN (p_request_data->>ac.field_name) ILIKE '%' || ac.field_value || '%'
                        WHEN 'not_contains' THEN (p_request_data->>ac.field_name) NOT ILIKE '%' || ac.field_value || '%'
                        WHEN 'in' THEN (p_request_data->>ac.field_name) = ANY(string_to_array(ac.field_value, ','))
                        WHEN 'not_in' THEN (p_request_data->>ac.field_name) != ALL(string_to_array(ac.field_value, ','))
                        ELSE false
                    END
                )
        )
    ORDER BY aw.created_at DESC
    LIMIT 1;  -- Return first matching workflow
    
    -- If no workflow found, approval is not needed
    IF NOT FOUND THEN
        RETURN QUERY SELECT false::BOOLEAN, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_approval_needed IS 'Evaluates if action needs approval based on workflows and conditions';

-- ============================================
-- FUNCTION 3: Get Staff Accessible Modules
-- ============================================
-- Purpose: Get all modules a staff member can access with their permission levels
-- Returns: Table with module details and CRUD permissions

CREATE OR REPLACE FUNCTION public.get_staff_accessible_modules(
    p_staff_id UUID
) RETURNS TABLE(
    module_id UUID,
    module_code TEXT,
    module_name TEXT,
    parent_module_id UUID,
    route_path TEXT,
    icon_name TEXT,
    display_order INTEGER,
    can_view BOOLEAN,
    can_create BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH role_perms AS (
        -- Get base permissions from role
        SELECT 
            m.id,
            m.module_code,
            m.module_name,
            m.parent_module_id,
            m.route_path,
            m.icon_name,
            m.display_order,
            COALESCE(rp.can_view, false) as role_can_view,
            COALESCE(rp.can_create, false) as role_can_create,
            COALESCE(rp.can_edit, false) as role_can_edit,
            COALESCE(rp.can_delete, false) as role_can_delete
        FROM public.modules m
        LEFT JOIN public.role_permissions rp ON rp.module_id = m.id
        LEFT JOIN public.users u ON u.role_id = rp.role_id
        WHERE u.id = p_staff_id 
            AND m.is_active = true
    ),
    custom_overrides AS (
        -- Get custom permission overrides
        SELECT 
            m.id as module_id,
            BOOL_OR(CASE WHEN scp.action = 'view' AND scp.permission_type = 'grant' THEN true
                         WHEN scp.action = 'view' AND scp.permission_type = 'deny' THEN false
                         ELSE NULL END) as custom_view,
            BOOL_OR(CASE WHEN scp.action = 'create' AND scp.permission_type = 'grant' THEN true
                         WHEN scp.action = 'create' AND scp.permission_type = 'deny' THEN false
                         ELSE NULL END) as custom_create,
            BOOL_OR(CASE WHEN scp.action = 'edit' AND scp.permission_type = 'grant' THEN true
                         WHEN scp.action = 'edit' AND scp.permission_type = 'deny' THEN false
                         ELSE NULL END) as custom_edit,
            BOOL_OR(CASE WHEN scp.action = 'delete' AND scp.permission_type = 'grant' THEN true
                         WHEN scp.action = 'delete' AND scp.permission_type = 'deny' THEN false
                         ELSE NULL END) as custom_delete
        FROM public.modules m
        LEFT JOIN public.staff_custom_permissions scp ON scp.module_id = m.id
        WHERE scp.user_id = p_staff_id
        GROUP BY m.id
    )
    SELECT 
        rp.id,
        rp.module_code,
        rp.module_name,
        rp.parent_module_id,
        rp.route_path,
        rp.icon_name,
        rp.display_order,
        -- Apply custom overrides if they exist, otherwise use role permissions
        COALESCE(co.custom_view, rp.role_can_view) as can_view,
        COALESCE(co.custom_create, rp.role_can_create) as can_create,
        COALESCE(co.custom_edit, rp.role_can_edit) as can_edit,
        COALESCE(co.custom_delete, rp.role_can_delete) as can_delete
    FROM role_perms rp
    LEFT JOIN custom_overrides co ON co.module_id = rp.id
    -- Only include modules where user has at least view permission
    WHERE COALESCE(co.custom_view, rp.role_can_view) = true
    ORDER BY rp.display_order, rp.module_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_staff_accessible_modules IS 'Returns all modules accessible to staff with permission levels';

-- ============================================
-- FUNCTION 4: Check Feature Permission
-- ============================================
-- Purpose: Check if staff has access to a specific feature
-- Returns: boolean

CREATE OR REPLACE FUNCTION public.check_feature_permission(
    p_staff_id UUID,
    p_feature_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN := false;
    v_custom_override TEXT;
BEGIN
    -- Check custom override first
    SELECT scp.permission_type INTO v_custom_override
    FROM public.staff_custom_permissions scp
    JOIN public.features f ON f.id = scp.feature_id
    WHERE scp.user_id = p_staff_id
        AND f.feature_code = p_feature_code;
    
    IF v_custom_override = 'deny' THEN
        RETURN false;
    END IF;
    
    IF v_custom_override = 'grant' THEN
        RETURN true;
    END IF;
    
    -- Check role feature permission
    SELECT COALESCE(rfp.is_enabled, false) INTO v_has_access
    FROM public.users u
    JOIN public.role_feature_permissions rfp ON rfp.role_id = u.role_id
    JOIN public.features f ON f.id = rfp.feature_id
    WHERE u.id = p_staff_id
        AND f.feature_code = p_feature_code;
    
    RETURN COALESCE(v_has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_feature_permission IS 'Checks if staff has access to a specific feature';

-- ============================================
-- FUNCTION 5: Get Pending Approvals for Staff
-- ============================================
-- Purpose: Get all approval requests pending current staff's action
-- Returns: Table with approval request details

CREATE OR REPLACE FUNCTION public.get_pending_approvals_for_staff(
    p_staff_id UUID
) RETURNS TABLE(
    request_id UUID,
    workflow_name TEXT,
    requester_name TEXT,
    request_data JSONB,
    entity_type TEXT,
    entity_id UUID,
    current_step INTEGER,
    step_order INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id as request_id,
        aw.workflow_name,
        u.full_name as requester_name,
        ar.request_data,
        ar.entity_type,
        ar.entity_id,
        ar.current_step,
        aws.step_order,
        ar.created_at
    FROM public.approval_requests ar
    JOIN public.approval_workflows aw ON aw.id = ar.workflow_id
    JOIN public.users u ON u.id = ar.requester_id
    JOIN public.approval_workflow_steps aws ON aws.workflow_id = ar.workflow_id
    JOIN public.users u_staff ON u_staff.id = p_staff_id
    WHERE ar.status = 'pending'
        AND aws.step_order = ar.current_step
        -- Check if current user is eligible approver for this step
        AND (
            aws.approver_user_id = p_staff_id OR
            aws.approver_role_id = u_staff.role_id OR
            aws.approver_department_id = u_staff.department_id
        )
        -- Ensure no action taken yet for this step
        AND NOT EXISTS (
            SELECT 1 FROM public.approval_actions aa
            WHERE aa.request_id = ar.id
                AND aa.step_order = aws.step_order
                AND aa.approver_id = p_staff_id
        )
    ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_pending_approvals_for_staff IS 'Returns approval requests awaiting action from the specified staff member';

-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_staff_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_approval_needed TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_accessible_modules TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_approvals_for_staff TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
