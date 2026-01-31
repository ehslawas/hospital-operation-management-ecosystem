-- Roll back custom RLS on users table to debug login issues
-- This migration restores the simpler behaviour where RLS is disabled
-- for the users table. This is safe for local development while we
-- diagnose Supabase 500 errors on /rest/v1/users.

-- 1. Drop the custom policies added in 006_login_rls_fix (if they exist)
DROP POLICY IF EXISTS "anon_user_lookup_for_login" ON users;
DROP POLICY IF EXISTS "service_role_full_access_users" ON users;

-- 2. Disable Row Level Security on users table for now
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note:
-- In Supabase, disabling RLS on a table makes it fully accessible to
-- clients that have privileges (anon / authenticated). For local
-- development this is acceptable and will avoid RLS-related 500 errors
-- during login. Once everything is stable, we can re‑introduce a
-- minimal, well‑tested RLS policy specifically for login.


