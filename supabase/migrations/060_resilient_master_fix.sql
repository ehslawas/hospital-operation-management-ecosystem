-- Migration: Resilient Master Menu Fix
-- Description: Uses case-insensitive lookups to ensure all menus are created even if codes are lowercase.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    role_rec record;
    menu_rec record;
BEGIN
    -- 1. Get Pharmacy Logistics Department ID (Case-insensitive)
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code ILIKE 'pharmacy_logistics';

    RAISE NOTICE 'Found Pharmacy Dept ID: %', pharmacy_dept_id;

    IF pharmacy_dept_id IS NOT NULL THEN
        -- 2. Cleanup: Delete any redundant /pharmacy root folder to avoid confusion
        DELETE FROM public.role_menu_access WHERE menu_id IN (SELECT id FROM public.menus WHERE path = '/pharmacy');
        DELETE FROM public.menus WHERE path = '/pharmacy';

        -- 3. Ensure Inventory Menu at root (Order 4)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Inventory', '/pharmacy/inventory', 'Package', NULL, 4, true, pharmacy_dept_id, 'inventory')
        ON CONFLICT (path) DO UPDATE SET 
            label = 'Inventory', 
            icon = 'Package', 
            order_index = 4, 
            parent_id = NULL,
            allowed_department_id = pharmacy_dept_id;

        -- 4. Ensure Reports & Logs Menu at root (Order 9)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Reports & Logs', '/pharmacy/reports', 'BarChart3', NULL, 9, true, pharmacy_dept_id, 'reports')
        ON CONFLICT (path) DO UPDATE SET 
            label = 'Reports & Logs', 
            icon = 'BarChart3', 
            order_index = 9, 
            parent_id = NULL,
            allowed_department_id = pharmacy_dept_id;

        -- 5. Standardize all other shared menus
        UPDATE public.menus SET order_index = 1, label = 'Dashboard', icon = 'BarChart3', allowed_department_id = NULL WHERE path = '/dashboard';
        UPDATE public.menus SET order_index = 2, label = 'Financial', icon = 'BarChart3', allowed_department_id = NULL WHERE path = '/financial';
        UPDATE public.menus SET order_index = 3, label = 'Procurement', icon = 'ShoppingCart', allowed_department_id = NULL WHERE path = '/procurement';
        UPDATE public.menus SET order_index = 5, label = 'Distribution', icon = 'Truck', allowed_department_id = NULL WHERE path = '/distribution';
        UPDATE public.menus SET order_index = 6, label = 'Medical Oxygen', icon = 'Activity', allowed_department_id = NULL WHERE path = '/oxygen';
        UPDATE public.menus SET order_index = 7, label = 'Catalogs', icon = 'ClipboardList', allowed_department_id = NULL WHERE path = '/catalogs';
        UPDATE public.menus SET order_index = 8, label = 'Maintenance', icon = 'Settings', allowed_department_id = NULL WHERE path = '/maintenance';

        -- 6. Grant Permissions to all Pharmacy Roles (Case-insensitive)
        FOR role_rec IN 
            SELECT id FROM public.roles 
            WHERE role_code ILIKE ANY (ARRAY['system_admin', 'hospital_admin', 'pharmacy%', 'pharmacist%'])
        LOOP
            -- Grant view to all top-level menus
            FOR menu_rec IN 
                SELECT id FROM public.menus 
                WHERE path IN ('/dashboard', '/financial', '/procurement', '/pharmacy/inventory', '/distribution', '/oxygen', '/catalogs', '/maintenance', '/pharmacy/reports')
            LOOP
                INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
                VALUES (role_rec.id, menu_rec.id, true)
                ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
            END LOOP;
        END LOOP;

    ELSE
        RAISE EXCEPTION 'Department PHARMACY_LOGISTICS not found! Please check your departments table.';
    END IF;
END $$;
