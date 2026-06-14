-- Fix RLS Policies for Roles Table
-- This migration ensures roles table is accessible for system operations

-- ============================================
-- Roles Table RLS Policies
-- ============================================

-- Check if RLS is enabled, if so, add policies
DO $$
BEGIN
  -- Check if RLS is enabled on roles table
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'roles'
  ) THEN
    -- Enable RLS if not already enabled
    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "authenticated_users_can_read_roles" ON roles;
    DROP POLICY IF EXISTS "system_admin_full_access_roles" ON roles;
    DROP POLICY IF EXISTS "public_read_roles" ON roles;
    
    -- Policy: All authenticated users can read roles (needed for role lookups)
    -- This is safe because roles don't contain sensitive data - they're public metadata
    CREATE POLICY "authenticated_users_can_read_roles"
      ON roles
      FOR SELECT
      TO authenticated
      USING (true);
    
    -- Policy: Allow service role full access (for migrations and admin operations)
    -- Service role bypasses RLS, but we add this for explicit clarity
    CREATE POLICY "service_role_full_access_roles"
      ON roles
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    -- Note: For INSERT/UPDATE/DELETE on roles, we rely on service_role or
    -- application-level permissions. Roles should only be modified by system admins
    -- through the application, not directly via API.
  END IF;
END $$;

