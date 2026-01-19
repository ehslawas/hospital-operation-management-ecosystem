-- Disable RLS on departments and roles
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
