-- Migration: Prevent RLS Infinite Recursion
-- Description: Creates SECURITY DEFINER functions for role checks and updates policies to use them.

-- ============================================
-- 0. PRE-CLEANUP: Drop all dependent policies
-- ============================================
-- We must drop policies BEFORE functions because functions are dependencies.

-- Users Table Policies
DROP POLICY IF EXISTS "system_admin_all_users" ON public.users;
DROP POLICY IF EXISTS "hospital_admin_all_users" ON public.users;
DROP POLICY IF EXISTS "users_self_management" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "hospital_admin_insert_users" ON public.users;
DROP POLICY IF EXISTS "system_admin_insert_users" ON public.users;
DROP POLICY IF EXISTS "hospital_admin_scope_users" ON public.users;
DROP POLICY IF EXISTS "protect_system_admin_deletion" ON public.users;
DROP POLICY IF EXISTS "protect_system_admin_modification" ON public.users;

-- Roles Table Policies
DROP POLICY IF EXISTS "authenticated_users_can_read_roles" ON public.roles;
DROP POLICY IF EXISTS "system_admin_manage_all_roles" ON public.roles;
DROP POLICY IF EXISTS "hospital_admin_manage_own_roles" ON public.roles;
DROP POLICY IF EXISTS "service_role_full_access_roles" ON public.roles;

-- Role Menu Access Table Policies
DROP POLICY IF EXISTS "system_admin_all_role_menu_access" ON public.role_menu_access;
DROP POLICY IF EXISTS "hospital_admin_manage_role_menu_access" ON public.role_menu_access;
DROP POLICY IF EXISTS "users_view_own_role_menu_access" ON public.role_menu_access;

-- Hospitals Table Policies
DROP POLICY IF EXISTS "system_admin_full_access_hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "hospital_admin_view_own_hospital" ON public.hospitals;

-- Menus Table Policies
DROP POLICY IF EXISTS "system_admin_all_menus" ON public.menus;
DROP POLICY IF EXISTS "hospital_admin_view_menus" ON public.menus;

-- ============================================
-- 1. Helper Functions (Bypass RLS)
-- ============================================
-- Now we can safely drop and recreate the functions

DROP FUNCTION IF EXISTS public.get_role_id_by_code(TEXT);
DROP FUNCTION IF EXISTS public.check_user_has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.is_system_admin(UUID);
DROP FUNCTION IF EXISTS public.is_hospital_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_hospital_id(UUID);

CREATE OR REPLACE FUNCTION public.get_role_id_by_code(p_role_code TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.roles WHERE role_code = p_role_code LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_user_has_role(p_user_id UUID, p_role_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = p_user_id 
          AND r.role_code = p_role_code
          AND u.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_system_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.check_user_has_role(p_user_id, 'system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_hospital_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.check_user_has_role(p_user_id, 'hospital_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_hospital_id(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT hospital_id FROM public.users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Update Roles Table Policies
-- ============================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_read_roles"
  ON public.roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_admin_manage_all_roles"
  ON public.roles FOR ALL TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "hospital_admin_manage_own_roles"
  ON public.roles FOR ALL TO authenticated
  USING (
    public.is_hospital_admin(auth.uid()) 
    AND (roles.hospital_id IS NULL OR roles.hospital_id = public.get_user_hospital_id(auth.uid()))
  )
  WITH CHECK (
    public.is_hospital_admin(auth.uid()) 
    AND (roles.hospital_id IS NULL OR roles.hospital_id = public.get_user_hospital_id(auth.uid()))
  );

CREATE POLICY "service_role_full_access_roles"
  ON public.roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 3. Update Role Menu Access Policies
-- ============================================
ALTER TABLE public.role_menu_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_admin_all_role_menu_access"
    ON public.role_menu_access FOR ALL TO authenticated
    USING (public.is_system_admin(auth.uid()));

CREATE POLICY "hospital_admin_manage_role_menu_access"
    ON public.role_menu_access FOR ALL TO authenticated
    USING (
        public.is_hospital_admin(auth.uid())
        AND (
            (SELECT r.hospital_id FROM public.roles r WHERE r.id = role_menu_access.role_id) = public.get_user_hospital_id(auth.uid())
        )
    );

CREATE POLICY "users_view_own_role_menu_access"
    ON public.role_menu_access FOR SELECT TO authenticated
    USING (
        role_id = (SELECT u.role_id FROM public.users u WHERE u.id = auth.uid())
    );

-- ============================================
-- 4. Update Hospitals Policies
-- ============================================
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_admin_full_access_hospitals"
  ON public.hospitals FOR ALL TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "hospital_admin_view_own_hospital"
  ON public.hospitals FOR SELECT TO authenticated
  USING (
    public.is_hospital_admin(auth.uid()) 
    AND id = public.get_user_hospital_id(auth.uid())
  );

-- ============================================
-- 5. Update Menus Policies
-- ============================================
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_admin_all_menus"
    ON public.menus FOR ALL TO authenticated
    USING (public.is_system_admin(auth.uid()));

CREATE POLICY "hospital_admin_view_menus"
    ON public.menus FOR SELECT TO authenticated
    USING (public.is_hospital_admin(auth.uid()));

-- ============================================
-- 6. Update Users Policies
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_admin_all_users"
    ON public.users FOR ALL TO authenticated
    USING (public.is_system_admin(auth.uid()))
    WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "hospital_admin_all_users"
    ON public.users FOR ALL TO authenticated
    USING (
        public.is_hospital_admin(auth.uid())
        AND (hospital_id = public.get_user_hospital_id(auth.uid()))
    )
    WITH CHECK (
        public.is_hospital_admin(auth.uid())
        AND (hospital_id = public.get_user_hospital_id(auth.uid()))
        AND (role_id != public.get_role_id_by_code('system_admin'))
    );

CREATE POLICY "users_self_management"
    ON public.users FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "users_self_update"
    ON public.users FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role_id = (SELECT u.role_id FROM public.users u WHERE u.id = auth.uid()));
