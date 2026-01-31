-- Login RLS Fix - Allow anonymous users to lookup users by employee_id for login
-- This is required because the login flow needs to query the users table BEFORE authentication
-- to find the user's email address for Supabase Auth

-- ============================================
-- 1. Enable RLS on users table (if not already)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing login policy if exists
-- ============================================
DROP POLICY IF EXISTS "anon_user_lookup_for_login" ON users;
DROP POLICY IF EXISTS "service_role_full_access_users" ON users;

-- ============================================
-- 3. Add policy for anonymous user lookup during login
-- ============================================
-- This policy allows anonymous (unauthenticated) users to SELECT
-- from the users table. This is necessary for the login flow where
-- we need to find a user by employee_id to get their email before
-- authenticating with Supabase Auth.
--
-- Security note: This only allows SELECT and the application should
-- only query by employee_id. Consider using a Supabase Edge Function
-- for production to further restrict what data is returned.

CREATE POLICY "anon_user_lookup_for_login"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- 4. Add service role full access for admin operations
-- ============================================
CREATE POLICY "service_role_full_access_users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Grant necessary permissions to anon role
-- ============================================
GRANT SELECT ON users TO anon;
GRANT SELECT ON roles TO anon;
GRANT SELECT ON departments TO anon;
GRANT SELECT ON hospitals TO anon;

