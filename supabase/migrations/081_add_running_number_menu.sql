-- Migration 081: Add Running Number Menu
-- Description: Adds the "Reference Numbers" menu item to the Hospital Admin navigation.

DO $$
DECLARE
    admin_dept_id uuid;
    hosp_admin_role_id uuid;
    sys_admin_role_id uuid;
    new_menu_id uuid;
BEGIN
    RAISE NOTICE '=== MIGRATION 081: ADDING REFERENCE NUMBER MENU ===';

    -- 1. Get Hospital Admin Department ID
    SELECT id INTO admin_dept_id FROM public.departments WHERE department_code = 'hospital_admin' LIMIT 1;
    
    -- 2. Get Role IDs
    SELECT id INTO hosp_admin_role_id FROM public.roles WHERE role_code = 'hospital_admin';
    SELECT id INTO sys_admin_role_id FROM public.roles WHERE role_code = 'system_admin';

    -- 3. Insert the Menu Item
    new_menu_id := gen_random_uuid();
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code, allowed_department_id)
    VALUES (new_menu_id, 'Reference Numbers', '/admin/running-numbers', 'Hash', 17, true, 'admin', admin_dept_id)
    ON CONFLICT (path) DO UPDATE SET 
        label = 'Reference Numbers', 
        icon = 'Hash', 
        order_index = 17, 
        module_code = 'admin',
        allowed_department_id = admin_dept_id
    RETURNING id INTO new_menu_id;

    RAISE NOTICE '  Menu item "Reference Numbers" created/updated with ID: %', new_menu_id;

    -- 4. Grant access to Roles
    -- Hospital Admin
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    VALUES (hosp_admin_role_id, new_menu_id, true)
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    -- System Admin
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    VALUES (sys_admin_role_id, new_menu_id, true)
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    RAISE NOTICE '  Permissions granted to Hospital Admin and System Admin.';
    RAISE NOTICE '=== MIGRATION 081 COMPLETE ===';
END $$;
