-- ============================================================================
-- Migration 110: Fix get_staff_accessible_modules for custom permissions
-- 
-- ROOT CAUSE: The previous implementation joined role_permissions first,
-- which meant users whose roles have NO role_permissions entries would get
-- an empty base set, causing feature_grants from staff_custom_permissions
-- to be completely ignored.
--
-- FIX: Restructure to start from ALL active modules, then LEFT JOIN all
-- permission sources. This ensures modules granted via staff_custom_permissions
-- (feature grants) are always included regardless of role_permissions state.
-- ============================================================================

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
DECLARE
    v_role_id UUID;
BEGIN
    -- Step 1: Get the user's role_id (single lookup, not repeated in CTEs)
    SELECT u.role_id INTO v_role_id
    FROM public.users u
    WHERE u.id = p_staff_id;

    RETURN QUERY
    WITH 
    -- Role-level module permissions (from role_permissions table)
    role_module_perms AS (
        SELECT 
            rp.module_id,
            COALESCE(rp.can_view, false) as can_view,
            COALESCE(rp.can_create, false) as can_create,
            COALESCE(rp.can_edit, false) as can_edit,
            COALESCE(rp.can_delete, false) as can_delete
        FROM public.role_permissions rp
        WHERE rp.role_id = v_role_id
    ),
    
    -- Role-level feature permissions (from role_feature_permissions table)
    -- This grants VIEW access to the parent module when any feature is enabled
    role_feature_grants AS (
        SELECT DISTINCT f.module_id
        FROM public.role_feature_permissions rfp
        JOIN public.features f ON f.id = rfp.feature_id
        WHERE rfp.role_id = v_role_id
            AND rfp.is_enabled = true
    ),
    
    -- User-level custom module overrides (from staff_custom_permissions, where module_id is set)
    user_module_overrides AS (
        SELECT 
            scp.module_id,
            BOOL_OR(CASE WHEN scp.action = 'view' AND scp.permission_type = 'grant' THEN true END) as grant_view,
            BOOL_OR(CASE WHEN scp.action = 'view' AND scp.permission_type = 'deny' THEN true END) as deny_view,
            BOOL_OR(CASE WHEN scp.action = 'create' AND scp.permission_type = 'grant' THEN true END) as grant_create,
            BOOL_OR(CASE WHEN scp.action = 'edit' AND scp.permission_type = 'grant' THEN true END) as grant_edit,
            BOOL_OR(CASE WHEN scp.action = 'delete' AND scp.permission_type = 'grant' THEN true END) as grant_delete
        FROM public.staff_custom_permissions scp
        WHERE scp.user_id = p_staff_id
            AND scp.module_id IS NOT NULL
        GROUP BY scp.module_id
    ),
    
    -- User-level custom feature grants (from staff_custom_permissions, where feature_id is set)
    -- This grants VIEW access to the parent module when any feature is granted
    user_feature_grants AS (
        SELECT DISTINCT f.module_id
        FROM public.staff_custom_permissions scp
        JOIN public.features f ON f.id = scp.feature_id
        WHERE scp.user_id = p_staff_id
            AND scp.permission_type = 'grant'
            AND scp.feature_id IS NOT NULL
    ),
    
    -- Combine all permission sources for each module
    combined_perms AS (
        SELECT 
            m.id,
            m.module_code,
            m.module_name,
            m.parent_module_id,
            m.route_path,
            m.icon_name,
            m.display_order,
            
            -- VIEW: Check deny override first, then grant sources (in priority order)
            CASE 
                WHEN umo.deny_view = true THEN false  -- User explicitly denied
                WHEN umo.grant_view = true THEN true  -- User explicitly granted
                WHEN ufg.module_id IS NOT NULL THEN true  -- User granted a feature in this module
                WHEN rfg.module_id IS NOT NULL THEN true  -- Role has a feature enabled in this module
                WHEN rmp.can_view = true THEN true  -- Role has module-level view permission
                ELSE false
            END as final_can_view,
            
            -- CREATE: User override > Role permission
            COALESCE(umo.grant_create, rmp.can_create, false) as final_can_create,
            
            -- EDIT: User override > Role permission
            COALESCE(umo.grant_edit, rmp.can_edit, false) as final_can_edit,
            
            -- DELETE: User override > Role permission
            COALESCE(umo.grant_delete, rmp.can_delete, false) as final_can_delete
            
        FROM public.modules m
        LEFT JOIN role_module_perms rmp ON rmp.module_id = m.id
        LEFT JOIN role_feature_grants rfg ON rfg.module_id = m.id
        LEFT JOIN user_module_overrides umo ON umo.module_id = m.id
        LEFT JOIN user_feature_grants ufg ON ufg.module_id = m.id
        WHERE m.is_active = true
    )
    
    -- Return only modules where user has view access
    SELECT 
        cp.id,
        cp.module_code,
        cp.module_name,
        cp.parent_module_id,
        cp.route_path,
        cp.icon_name,
        cp.display_order,
        cp.final_can_view,
        cp.final_can_create,
        cp.final_can_edit,
        cp.final_can_delete
    FROM combined_perms cp
    WHERE cp.final_can_view = true
    ORDER BY cp.display_order, cp.module_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add helpful index for performance
CREATE INDEX IF NOT EXISTS idx_staff_custom_permissions_user_feature 
    ON public.staff_custom_permissions(user_id, feature_id) 
    WHERE feature_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_role_feature_permissions_role_enabled 
    ON public.role_feature_permissions(role_id) 
    WHERE is_enabled = true;

COMMENT ON FUNCTION public.get_staff_accessible_modules IS 
'Returns all modules a staff member can access. Considers:
1. Role-level module permissions (role_permissions)
2. Role-level feature grants (role_feature_permissions → implicit module view)
3. User-level module overrides (staff_custom_permissions with module_id)
4. User-level feature grants (staff_custom_permissions with feature_id → implicit module view)

Priority: User overrides > Role permissions. Feature grants implicitly enable module view access.';
