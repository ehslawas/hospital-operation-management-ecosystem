-- Diagnostic Query: Check Menu System State
-- Run this in your Supabase SQL Editor to verify data exists

-- 1. Check if departments exist
SELECT 'Departments' as table_name, COUNT(*) as count FROM public.departments;

-- 2. Check if menus exist
SELECT 'Menus' as table_name, COUNT(*) as count FROM public.menus;

-- 3. Check if role_menu_access exists
SELECT 'Role Menu Access' as table_name, COUNT(*) as count FROM public.role_menu_access;

-- 4. Show all menus
SELECT 
    id,
    label,
    path,
    parent_id,
    order_index,
    is_core,
    allowed_department_id,
    module_code
FROM public.menus
ORDER BY order_index;

-- 5. Show departments
SELECT 
    id,
    department_code,
    department_name
FROM public.departments;

-- 6. Show role menu access
SELECT 
    rma.id,
    r.role_name,
    m.label as menu_label,
    rma.can_view
FROM public.role_menu_access rma
JOIN public.roles r ON r.id = rma.role_id
JOIN public.menus m ON m.id = rma.menu_id
ORDER BY r.role_name, m.label;

-- 7. Check current user's department and role
SELECT 
    u.id,
    u.full_name,
    u.employee_id,
    r.role_name,
    r.role_code,
    d.department_name,
    d.department_code
FROM public.users u
LEFT JOIN public.roles r ON r.id = u.role_id
LEFT JOIN public.departments d ON d.id = u.department_id
WHERE u.email = auth.email(); -- Shows current logged-in user
