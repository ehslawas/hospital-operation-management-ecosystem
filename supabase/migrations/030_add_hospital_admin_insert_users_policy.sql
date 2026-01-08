-- Migration: Add INSERT policy for Hospital Admins to create users
-- This allows Hospital Admins to create new users when approving access requests for their hospital

-- ============================================
-- 1. Enable RLS on users table (if not already)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing INSERT policy if exists
-- ============================================
DROP POLICY IF EXISTS "hospital_admin_insert_users" ON users;
DROP POLICY IF EXISTS "system_admin_insert_users" ON users;

-- ============================================
-- 3. Policy: System Admin can insert any user
-- ============================================
CREATE POLICY "system_admin_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
  );

-- ============================================
-- 4. Policy: Hospital Admin can insert users for their hospital
-- ============================================
-- This allows Hospital Admins to create new users when approving access requests
-- The user being created must belong to the same hospital as the Hospital Admin
CREATE POLICY "hospital_admin_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Hospital Admin can only create users in their own hospital
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = users.hospital_id
        AND u.status = 'active'
    )
    -- Ensure the new user is not a system admin (only System Admin can create system admins)
    AND users.role_id != (SELECT id FROM roles WHERE role_code = 'system_admin')
  );

-- Add comment
COMMENT ON POLICY "hospital_admin_insert_users" ON users IS 
  'Allows Hospital Admins to create new users in their hospital when approving access requests';

