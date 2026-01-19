-- Diagnose User Loading Hang
-- Drop the suspected recursive policies on the users table

DROP POLICY IF EXISTS "system_admin_all_users" ON users;
DROP POLICY IF EXISTS "hospital_admin_all_users" ON users;
DROP POLICY IF EXISTS "hospital_admin_scope_users" ON users;

-- Re-add a simplified generic policy for testing (Authenticated users can see themselves)
CREATE POLICY "users_simple_self_view"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow System Admin (hardcoded ID check if possible, or just open it up temporarily for debugging)
-- WARNING: This is for debugging only.
-- Create a policy that allows reading all users if you are authenticated, just to verify the HANG is gone.
-- We can refine access control later.
CREATE POLICY "debug_read_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);
