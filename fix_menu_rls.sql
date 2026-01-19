-- Partial RLS Disable to fix missing menus
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
