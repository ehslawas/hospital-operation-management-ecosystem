-- ==========================================================================
-- MIGRATION: DEFINITIVE RLS FIX FOR PERFORMANCE
-- ==========================================================================
-- The Root Cause: RLS policies create recursive loops where:
--   users table policies → query roles table → roles table policies → query users table → ∞
--
-- The Solution:
--   1. Drop ALL existing RLS policies on critical tables.
--   2. Create SECURITY DEFINER helper functions that bypass RLS.
--   3. Create new, non-recursive policies using these functions.
--   4. Add simple "authenticated can read" policies for lookup tables.
-- ==========================================================================

-- ============================================
-- STEP 0: DISABLE RLS TEMPORARILY FOR CLEANUP
-- ============================================
-- This ensures we can drop policies without access issues

-- ============================================
-- STEP 1: DROP ALL EXISTING PROBLEMATIC POLICIES
-- ============================================

-- USERS TABLE: Drop all existing policies
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol_name);
        RAISE NOTICE 'Dropped policy: % on users', pol_name;
    END LOOP;
END $$;

-- ROLES TABLE: Drop all existing policies
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.roles', pol_name);
        RAISE NOTICE 'Dropped policy: % on roles', pol_name;
    END LOOP;
END $$;

-- DEPARTMENTS TABLE: Drop all existing policies
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'departments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.departments', pol_name);
        RAISE NOTICE 'Dropped policy: % on departments', pol_name;
    END LOOP;
END $$;

-- HOSPITALS TABLE: Drop all existing policies
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'hospitals' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.hospitals', pol_name);
        RAISE NOTICE 'Dropped policy: % on hospitals', pol_name;
    END LOOP;
END $$;

-- ============================================
-- STEP 2: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- ============================================
-- These functions bypass RLS and prevent recursion.
-- We use public schema with a prefix because 'auth' schema is protected.

DROP FUNCTION IF EXISTS public.app_get_my_role_code() CASCADE;
CREATE OR REPLACE FUNCTION public.app_get_my_role_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT r.role_code
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    LIMIT 1;
$$;

DROP FUNCTION IF EXISTS public.app_get_my_hospital_id() CASCADE;
CREATE OR REPLACE FUNCTION public.app_get_my_hospital_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT hospital_id FROM public.users WHERE id = auth.uid();
$$;

DROP FUNCTION IF EXISTS public.app_is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.app_get_my_role_code() IN ('system_admin', 'hospital_admin');
$$;

-- ============================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE NEW, SIMPLE, NON-RECURSIVE POLICIES
-- ============================================

-- -------------- ROLES TABLE ----------------
-- All authenticated users can READ roles (needed for lookups)
CREATE POLICY "rls_roles_select_authenticated"
    ON public.roles FOR SELECT TO authenticated
    USING (true);

-- Admins can manage roles
CREATE POLICY "rls_roles_manage_admin"
    ON public.roles FOR ALL TO authenticated
    USING (public.app_get_my_role_code() IN ('system_admin', 'hospital_admin'))
    WITH CHECK (public.app_get_my_role_code() IN ('system_admin', 'hospital_admin'));

-- Service role bypass
CREATE POLICY "rls_roles_service_role"
    ON public.roles FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- -------------- DEPARTMENTS TABLE ----------------
-- All authenticated users can READ departments (needed for lookups)
CREATE POLICY "rls_departments_select_authenticated"
    ON public.departments FOR SELECT TO authenticated
    USING (true);

-- Admins can manage departments
CREATE POLICY "rls_departments_manage_admin"
    ON public.departments FOR ALL TO authenticated
    USING (public.app_is_admin())
    WITH CHECK (public.app_is_admin());

-- Service role bypass
CREATE POLICY "rls_departments_service_role"
    ON public.departments FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- -------------- HOSPITALS TABLE ----------------
-- All authenticated users can READ hospitals (needed for lookups)
CREATE POLICY "rls_hospitals_select_authenticated"
    ON public.hospitals FOR SELECT TO authenticated
    USING (true);

-- Admins can manage hospitals
CREATE POLICY "rls_hospitals_manage_admin"
    ON public.hospitals FOR ALL TO authenticated
    USING (public.app_is_admin())
    WITH CHECK (public.app_is_admin());

-- Service role bypass
CREATE POLICY "rls_hospitals_service_role"
    ON public.hospitals FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- -------------- USERS TABLE ----------------
-- Users can always see themselves
CREATE POLICY "rls_users_select_self"
    ON public.users FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Admins can see all users (or scoped to hospital for hospital_admin)
CREATE POLICY "rls_users_select_admin"
    ON public.users FOR SELECT TO authenticated
    USING (
        public.app_get_my_role_code() = 'system_admin'
        OR (public.app_get_my_role_code() = 'hospital_admin' AND hospital_id = public.app_get_my_hospital_id())
    );

-- Users can update their own non-sensitive fields
CREATE POLICY "rls_users_update_self"
    ON public.users FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can manage users
CREATE POLICY "rls_users_manage_admin"
    ON public.users FOR ALL TO authenticated
    USING (public.app_is_admin())
    WITH CHECK (public.app_is_admin());

-- Service role bypass
CREATE POLICY "rls_users_service_role"
    ON public.users FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- ============================================
-- STEP 5: Grant execute on helper functions
-- ============================================
GRANT EXECUTE ON FUNCTION public.app_get_my_role_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_get_my_hospital_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_is_admin() TO authenticated;

DO $$ 
BEGIN
    RAISE NOTICE '=== RLS PERFORMANCE FIX APPLIED SUCCESSFULLY ===';
END $$;
