-- Migration: Add missing Inventory and Reports menus
-- Description: Adds 'Inventory' and 'Reports & Logs' menus for Pharmacy Logistics department

-- Variable to store Pharmacy Logistics Dept ID
DO $$
DECLARE
    pharmacy_dept_id uuid;
    inventory_parent_id uuid;
    reports_parent_id uuid;
    catalogs_parent_id uuid;
BEGIN
    -- Get Pharmacy Logistics Department ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS';

    -- IF Pharmacy Logistics exists, insert specific menus
    IF pharmacy_dept_id IS NOT NULL THEN
        
        -- 1. Insert 'Inventory' Parent Menu (Core to Pharmacy)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Inventory', '/pharmacy/inventory', 'Package', NULL, 4, true, pharmacy_dept_id, 'inventory')
        ON CONFLICT (path) DO NOTHING
        RETURNING id INTO inventory_parent_id;

        -- Check if it existed previously
        IF inventory_parent_id IS NULL THEN
            SELECT id INTO inventory_parent_id FROM public.menus WHERE path = '/pharmacy/inventory';
        END IF;

        -- Insert Inventory Sub-menus (Inferred from routes)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES 
            (gen_random_uuid(), 'Overview', '/pharmacy/inventory', 'BarChart', inventory_parent_id, 1, true, pharmacy_dept_id, 'inventory_overview')
        ON CONFLICT (path) DO NOTHING;

        -- 2. Insert 'Reports & Logs' Parent Menu (Core to Pharmacy)
        -- Order index 8 (after Maintenance which is 7)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Reports & Logs', '/pharmacy/reports', 'FileText', NULL, 8, true, pharmacy_dept_id, 'reports')
        ON CONFLICT (path) DO NOTHING
        RETURNING id INTO reports_parent_id;

        -- Check if it existed previously
        IF reports_parent_id IS NULL THEN
             SELECT id INTO reports_parent_id FROM public.menus WHERE path = '/pharmacy/reports';
        END IF;

        -- Insert Reports Sub-menus (Found in routes.tsx)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES 
            (gen_random_uuid(), 'Inventory', '/pharmacy/reports/inventory', 'Package', reports_parent_id, 1, true, pharmacy_dept_id, 'report_inventory'),
            (gen_random_uuid(), 'Procurement', '/pharmacy/reports/procurement', 'ShoppingCart', reports_parent_id, 2, true, pharmacy_dept_id, 'report_procurement'),
            (gen_random_uuid(), 'Financial', '/pharmacy/reports/financial', 'DollarSign', reports_parent_id, 3, true, pharmacy_dept_id, 'report_financial'),
            (gen_random_uuid(), 'Distribution', '/pharmacy/reports/distribution', 'Truck', reports_parent_id, 4, true, pharmacy_dept_id, 'report_distribution')
        ON CONFLICT (path) DO NOTHING;

    END IF;

END $$;
