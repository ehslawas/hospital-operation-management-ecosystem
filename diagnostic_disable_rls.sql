-- AGGRESSIVE DIAGNOSTIC FIX
-- Temporarily disable RLS on all core tables to rule out permissions entirely.
-- If the app loads instantly after this, we KNOW it's an RLS issue.

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;

-- Also verify the 'role_permissions' foreign key isn't locking
-- (Nothing to do here, just noting it)

NOTIFY pgrst, 'reload schema';
