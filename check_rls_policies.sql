-- Check RLS status and policies for menu-related tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('menus', 'role_menu_access', 'roles', 'departments')
AND schemaname = 'public';

SELECT * FROM pg_policies WHERE tablename IN ('menus', 'role_menu_access');
