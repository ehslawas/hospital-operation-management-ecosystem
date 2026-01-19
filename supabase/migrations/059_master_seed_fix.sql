-- Migration: Master Menu & Permission Fix
-- Description: Ensures all menus from the reference image exist, are correctly ordered, and accessible.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    inventory_id uuid;
    reports_id uuid;
    role_rec record;
    menu_rec record;
BEGIN
    -- 1. Get Pharmacy Logistics Department ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS';

    IF pharmacy_dept_id IS NOT NULL THEN
        -- 2. Ensure Inventory Menu exists at root level (Order 4)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Inventory', '/pharmacy/inventory', 'Package', NULL, 4, true, pharmacy_dept_id, 'inventory')
        ON CONFLICT (path) DO UPDATE SET 
            label = 'Inventory', 
            icon = 'Package', 
            order_index = 4, 
            parent_id = NULL,
            allowed_department_id = pharmacy_dept_id
        RETURNING id INTO inventory_id;

        -- 3. Ensure Reports & Logs exists at root level (Order 9)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Reports & Logs', '/pharmacy/reports', 'BarChart3', NULL, 9, true, pharmacy_dept_id, 'reports')
        ON CONFLICT (path) DO UPDATE SET 
            label = 'Reports & Logs', 
            icon = 'BarChart3', 
            order_index = 9, 
            parent_id = NULL,
            allowed_department_id = pharmacy_dept_id
        RETURNING id INTO reports_id;

        -- 4. Re-order other top-level menus to match reference image 422
        -- Dashboard (1), Financial (2), Procurement (3), Inventory (4), Distribution (5), Oxygen (6), Catalogs (7), Maintenance (8), Reports (9)
        UPDATE public.menus SET order_index = 1, label = 'Dashboard', icon = 'BarChart3' WHERE path = '/dashboard';
        UPDATE public.menus SET order_index = 2, label = 'Financial', icon = 'BarChart3' WHERE path = '/financial';
        UPDATE public.menus SET order_index = 3, label = 'Procurement', icon = 'ShoppingCart' WHERE path = '/procurement';
        UPDATE public.menus SET order_index = 5, label = 'Distribution', icon = 'Truck' WHERE path = '/distribution';
        UPDATE public.menus SET order_index = 6, label = 'Medical Oxygen', icon = 'Activity' WHERE path = '/oxygen';
        UPDATE public.menus SET order_index = 7, label = 'Catalogs', icon = 'ClipboardList' WHERE path = '/catalogs';
        UPDATE public.menus SET order_index = 8, label = 'Maintenance', icon = 'Settings' WHERE path = '/maintenance';

        -- 5. Global Permission Reset for Pharmacy Roles
        FOR role_rec IN 
            SELECT id FROM public.roles 
            WHERE role_code IN ('system_admin', 'hospital_admin', 'pharmacy_director', 'pharmacy_manager', 'pharmacist', 'pharmacy_assistant', 'pharmacy_storekeeper', 'pharmacy_staff')
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
            
            -- Also grant view to all sub-menus of those parents
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            SELECT role_rec.id, m.id, true
            FROM public.menus m
            WHERE m.parent_id IN (
                SELECT id FROM public.menus 
                WHERE path IN ('/financial', '/procurement', '/pharmacy/inventory', '/catalogs', '/maintenance', '/pharmacy/reports')
            )
            ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        END LOOP;

    END IF;
END $$;
