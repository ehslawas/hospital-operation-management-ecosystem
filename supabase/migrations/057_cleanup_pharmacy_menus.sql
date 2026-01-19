DO $$
DECLARE
    pharmacy_dept_id uuid;
    role_record record;
    menu_record record;
BEGIN
    -- 1. Get Pharmacy Logistics Department ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS';

    IF pharmacy_dept_id IS NOT NULL THEN
        -- 2. Cleanup: Remove the redundant /pharmacy root folder
        UPDATE public.menus 
        SET parent_id = NULL 
        WHERE parent_id IN (SELECT id FROM public.menus WHERE path = '/pharmacy');

        DELETE FROM public.menus WHERE path = '/pharmacy' AND (SELECT COUNT(*) FROM public.menus WHERE parent_id = (SELECT id FROM public.menus WHERE path = '/pharmacy')) = 0;
        -- Force delete if above safety check fails but we want it gone
        DELETE FROM public.menus WHERE path = '/pharmacy';

        -- 3. Ensure Inventory and Reports are at the root
        UPDATE public.menus SET parent_id = NULL WHERE path IN ('/pharmacy/inventory', '/pharmacy/reports');

        -- 4. Standardize Labels, Icons, and ORDERING based on Reference Image 422
        UPDATE public.menus SET label = 'Dashboard', icon = 'BarChart3', order_index = 1 WHERE path = '/dashboard';
        UPDATE public.menus SET label = 'Financial', icon = 'BarChart3', order_index = 2 WHERE path = '/financial';
        UPDATE public.menus SET label = 'Procurement', icon = 'ShoppingCart', order_index = 3 WHERE path = '/procurement';
        UPDATE public.menus SET label = 'Inventory', icon = 'Package', order_index = 4 WHERE path = '/pharmacy/inventory';
        UPDATE public.menus SET label = 'Distribution', icon = 'Truck', order_index = 5 WHERE path = '/distribution';
        UPDATE public.menus SET label = 'Medical Oxygen', icon = 'Activity', order_index = 6 WHERE path = '/oxygen';
        UPDATE public.menus SET label = 'Catalogs', icon = 'ClipboardList', order_index = 7 WHERE path = '/catalogs';
        UPDATE public.menus SET label = 'Maintenance', icon = 'Settings', order_index = 8 WHERE path = '/maintenance';
        UPDATE public.menus SET label = 'Reports & Logs', icon = 'BarChart3', order_index = 9 WHERE path = '/pharmacy/reports';

        -- 5. Grant Permissions to all Pharmacy-related Roles
        FOR role_record IN 
            SELECT id FROM public.roles 
            WHERE role_code IN (
                'system_admin', 'hospital_admin', 
                'pharmacy_director', 'pharmacy_manager', 
                'pharmacist', 'pharmacy_assistant', 
                'pharmacy_storekeeper', 'pharmacy_staff'
            )
        LOOP
            FOR menu_record IN 
                SELECT id FROM public.menus 
                WHERE path IN (
                    '/dashboard', '/financial', '/procurement', 
                    '/pharmacy/inventory', '/distribution', '/oxygen', 
                    '/catalogs', '/maintenance', '/pharmacy/reports'
                )
                OR parent_id IN (
                    SELECT id FROM public.menus 
                    WHERE path IN ('/financial', '/procurement', '/pharmacy/inventory', '/catalogs', '/maintenance', '/pharmacy/reports')
                )
            LOOP
                INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
                VALUES (role_record.id, menu_record.id, true)
                ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
            END LOOP;
        END LOOP;

    END IF;
END $$;
