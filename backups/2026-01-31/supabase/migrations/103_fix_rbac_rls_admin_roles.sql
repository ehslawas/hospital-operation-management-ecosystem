-- ============================================================================
-- Migration 103: Extended Admin Role Support for RBAC
-- Description: Updates app_is_admin and RLS policies to include official admin roles
-- Fixes: 403 Forbidden when managing permissions as hospital_administrator
-- ============================================================================

-- 1. Update app_is_admin() helper function to include all administrative roles
CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.app_get_my_role_code() IN (
        'system_admin', 
        'hospital_admin', 
        'hospital_administrator', 
        'hospital_director'
    );
$$;

-- 2. Update RBAC policies to use the helper function or expanded role list
-- This ensures that hospital_administrator and hospital_director can manage permissions

-- Modules Management
DROP POLICY IF EXISTS "system_admin_manage_modules" ON public.modules;
CREATE POLICY "admin_manage_modules" ON public.modules
    FOR ALL TO authenticated
    USING (public.app_is_admin());

-- Features Management
DROP POLICY IF EXISTS "admin_manage_features" ON public.features;
CREATE POLICY "admin_manage_features" ON public.features
    FOR ALL TO authenticated
    USING (public.app_is_admin());

-- Role Permissions Management
DROP POLICY IF EXISTS "admin_manage_role_permissions" ON public.role_permissions;
CREATE POLICY "admin_manage_role_permissions" ON public.role_permissions
    FOR ALL TO authenticated
    USING (public.app_is_admin());

-- Role Feature Permissions Management
DROP POLICY IF EXISTS "admin_manage_role_feature_permissions" ON public.role_feature_permissions;
CREATE POLICY "admin_manage_role_feature_permissions" ON public.role_feature_permissions
    FOR ALL TO authenticated
    USING (public.app_is_admin());

-- Custom Permissions Management
DROP POLICY IF EXISTS "admin_manage_custom_permissions" ON public.staff_custom_permissions;
CREATE POLICY "admin_manage_custom_permissions" ON public.staff_custom_permissions
    FOR ALL TO authenticated
    USING (public.app_is_admin());

-- Workflow Management
DROP POLICY IF EXISTS "admin_manage_workflows" ON public.approval_workflows;
CREATE POLICY "admin_manage_workflows" ON public.approval_workflows
    FOR ALL TO authenticated
    USING (public.app_is_admin());

DROP POLICY IF EXISTS "admin_manage_workflow_steps" ON public.approval_workflow_steps;
CREATE POLICY "admin_manage_workflow_steps" ON public.approval_workflow_steps
    FOR ALL TO authenticated
    USING (public.app_is_admin());

DROP POLICY IF EXISTS "admin_manage_conditions" ON public.approval_conditions;
CREATE POLICY "admin_manage_conditions" ON public.approval_conditions
    FOR ALL TO authenticated
    USING (public.app_is_admin());

-- 3. Ensure users read policies are also inclusive
DROP POLICY IF EXISTS "rls_users_select_admin" ON public.users;
CREATE POLICY "rls_users_select_admin"
    ON public.users FOR SELECT TO authenticated
    USING (
        public.app_get_my_role_code() = 'system_admin'
        OR (public.app_get_my_role_code() IN ('hospital_admin', 'hospital_administrator', 'hospital_director') 
            AND hospital_id = public.app_get_my_hospital_id())
    );

RAISE NOTICE '=== RBAC ADMIN ROLE EXPANSION APPLIED ===';
