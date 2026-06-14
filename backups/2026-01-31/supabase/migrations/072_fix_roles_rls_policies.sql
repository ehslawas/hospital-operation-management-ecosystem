-- Fix RLS Policies for Roles Table to allow management by Admins
-- This migration adds INSERT, UPDATE, and DELETE policies for System and Hospital Administrators

-- 1. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "service_role_full_access_roles" ON roles;
DROP POLICY IF EXISTS "system_admin_manage_all_roles" ON roles;
DROP POLICY IF EXISTS "hospital_admin_manage_own_roles" ON roles;

-- Ensure RLS is enabled
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: System Admin has full access to all roles
-- They can manage global roles (hospital_id IS NULL) and hospital-specific roles
CREATE POLICY "system_admin_manage_all_roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id IN (SELECT id FROM roles r2 WHERE r2.role_code = 'system_admin')
        AND u.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id IN (SELECT id FROM roles r2 WHERE r2.role_code = 'system_admin')
        AND u.status = 'active'
    )
  );

-- 3. Policy: Hospital Admin can manage roles for their hospital OR system roles
-- This allows them to run the "Sync System Roles" feature which upserts global roles.
CREATE POLICY "hospital_admin_manage_own_roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id IN (SELECT id FROM roles r2 WHERE r2.role_code = 'hospital_admin')
        AND u.status = 'active'
        AND (roles.hospital_id IS NULL OR roles.hospital_id = u.hospital_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id IN (SELECT id FROM roles r2 WHERE r2.role_code = 'hospital_admin')
        AND u.status = 'active'
        AND (roles.hospital_id IS NULL OR roles.hospital_id = u.hospital_id)
    )
  );

-- 4. Ensure authenticated users can still read all roles (lookup)
DROP POLICY IF EXISTS "authenticated_users_can_read_roles" ON roles;
CREATE POLICY "authenticated_users_can_read_roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Always allow service role (internal)
DROP POLICY IF EXISTS "service_role_full_access_roles" ON roles;
CREATE POLICY "service_role_full_access_roles"
  ON roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
