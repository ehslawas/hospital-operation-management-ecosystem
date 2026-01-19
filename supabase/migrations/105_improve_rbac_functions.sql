-- ============================================================================
-- Migration 105: Improve RBAC Function Robustness
-- Description: Update check_staff_permission and get_staff_accessible_modules 
--              to implicitly grant 'view' access to a module if any feature 
--              within it is granted.
-- Created: 2026-01-19
-- ============================================================================

-- Update check_staff_permission
CREATE OR REPLACE FUNCTION public.check_staff_permission(
    p_staff_id UUID,
    p_module_code TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_custom_override TEXT;
    v_has_feature_grant BOOLEAN := false;
BEGIN
    -- Input validation
    IF p_staff_id IS NULL OR p_module_code IS NULL OR p_action IS NULL THEN
        RETURN false;
    END IF;
    
    -- 1. Check for explicit module override (highest priority)
    SELECT scp.permission_type INTO v_custom_override
    FROM public.staff_custom_permissions scp
    JOIN public.modules m ON m.id = scp.module_id
    WHERE scp.user_id = p_staff_id
        AND m.module_code = p_module_code
        AND scp.action = p_action;
    
    IF v_custom_override = 'deny' THEN
        RETURN false;
    END IF;
    
    IF v_custom_override = 'grant' THEN
        RETURN true;
    END IF;

    -- 2. Special case for 'view' action: check if any feature within this module is granted
    IF p_action = 'view' THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.staff_custom_permissions scp
            JOIN public.features f ON f.id = scp.feature_id
            JOIN public.modules m ON m.id = f.module_id
            WHERE scp.user_id = p_staff_id
                AND m.module_code = p_module_code
                AND scp.permission_type = 'grant'
        ) INTO v_has_feature_grant;

        IF v_has_feature_grant THEN
            RETURN true;
        END IF;
    END IF;
    
    -- 3. Check role permissions
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

-- Update get_staff_accessible_modules
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
            m.display_order as order_idx,
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
        -- Get custom permission overrides (modules)
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
    ),
    feature_grants AS (
        -- Modules that have at least one granted feature
        SELECT DISTINCT f.module_id
        FROM public.staff_custom_permissions scp
        JOIN public.features f ON f.id = scp.feature_id
        WHERE scp.user_id = p_staff_id
            AND scp.permission_type = 'grant'
    )
    SELECT 
        rp.id,
        rp.module_code,
        rp.module_name,
        rp.parent_module_id,
        rp.route_path,
        rp.icon_name,
        rp.order_idx,
        -- Apply custom overrides if they exist, otherwise check feature grants, then role permissions
        COALESCE(co.custom_view, CASE WHEN fg.module_id IS NOT NULL THEN true ELSE rp.role_can_view END) as can_view,
        COALESCE(co.custom_create, rp.role_can_create) as can_create,
        COALESCE(co.custom_edit, rp.role_can_edit) as can_edit,
        COALESCE(co.custom_delete, rp.role_can_delete) as can_delete
    FROM role_perms rp
    LEFT JOIN custom_overrides co ON co.module_id = rp.id
    LEFT JOIN feature_grants fg ON fg.module_id = rp.id
    -- Only include modules where user has at least view permission
    WHERE COALESCE(co.custom_view, CASE WHEN fg.module_id IS NOT NULL THEN true ELSE rp.role_can_view END) = true
    ORDER BY rp.order_idx, rp.module_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
