-- Migration: Restore Admin Integrity (Version 2)
-- Description: Separates Hospital Admin menus from Pharmacy Logistics and adds missing Admin menus.
-- Fixes: Corrected syntax error in LOOP and simplified permission grant logic.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    hosp_admin_role_id uuid;
    sys_admin_role_id uuid;
    menu_id_var uuid;
BEGIN
    -- 1. Get Department ID for Pharmacy Logistics
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code ILIKE 'pharmacy_logistics';
    
    -- 2. Get Role IDs
    SELECT id INTO hosp_admin_role_id FROM public.roles WHERE role_code = 'hospital_admin';
    SELECT id INTO sys_admin_role_id FROM public.roles WHERE role_code = 'system_admin';

    -- 3. Restrict Labeled Pharmacy Modules to Pharmacy Department
    UPDATE public.menus 
    SET allowed_department_id = pharmacy_dept_id 
    WHERE path IN (
        '/financial', 
        '/procurement', 
        '/pharmacy/inventory', 
        '/distribution', 
        '/oxygen', 
        '/catalogs', 
        '/maintenance', 
        '/pharmacy/reports'
    );

    -- 4. CLEANUP permissions: Remove access for Admins from these restricted Pharmacy menus
    DELETE FROM public.role_menu_access 
    WHERE role_id IN (hosp_admin_role_id, sys_admin_role_id)
    AND menu_id IN (
        SELECT id FROM public.menus 
        WHERE allowed_department_id = pharmacy_dept_id
    );

    -- 5. Add/Ensure Hospital Admin Specific Menus
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Manage Users', '/admin/users', 'Users', 10, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Manage Users', icon = 'Users', order_index = 10, allowed_department_id = NULL;
    
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Access Requests', '/admin/access-requests', 'UserPlus', 11, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Access Requests', icon = 'UserPlus', order_index = 11, allowed_department_id = NULL;
    
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Departments', '/admin/departments', 'Building2', 12, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Departments', icon = 'Building2', order_index = 12, allowed_department_id = NULL;
    
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Roles & Permissions', '/admin/roles', 'Shield', 13, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Roles & Permissions', icon = 'Shield', order_index = 13, allowed_department_id = NULL;
    
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Hospitals', '/admin/hospitals', 'Hospital', 14, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Hospitals', icon = 'Hospital', order_index = 14, allowed_department_id = NULL;

    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'System Settings', '/admin/modules', 'Settings', 15, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'System Settings', icon = 'Settings', order_index = 15, allowed_department_id = NULL;

    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Hospital Memos', '/admin/memos', 'Bell', 16, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Hospital Memos', icon = 'Bell', order_index = 16, allowed_department_id = NULL;

    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code)
    VALUES (gen_random_uuid(), 'Audit Logs', '/admin/audit-logs', 'FileText', 17, true, 'admin')
    ON CONFLICT (path) DO UPDATE SET label = 'Audit Logs', icon = 'FileText', order_index = 17, allowed_department_id = NULL;

    -- 6. Grant Permissions (Using faster SET based SQL instead of loops)
    
    -- System Admin permissions
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT sys_admin_role_id, id, true
    FROM public.menus 
    WHERE path LIKE '/admin/%' OR path = '/dashboard'
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    -- Hospital Admin permissions
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT hosp_admin_role_id, id, true
    FROM public.menus 
    WHERE path LIKE '/admin/%' OR path = '/dashboard'
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

END $$;
