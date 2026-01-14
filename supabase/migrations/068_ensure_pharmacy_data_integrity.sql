-- Migration 068: Ensure Pharmacy Data Integrity (Fill Missing Submenus)
-- Description: Creates missing submenus for Distribution and Medical Oxygen, and fixes Inventory permission paths.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    distribution_parent_id uuid;
    oxygen_parent_id uuid;
    inventory_parent_id uuid;
    menu_count integer := 0;
BEGIN
    RAISE NOTICE '=== MIGRATION 068: ENSURE DATA INTEGRITY ===';

    -- 1. Get Pharmacy Dept ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics' LIMIT 1;
    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'Pharmacy Logistics department not found!';
    END IF;

    -- ============================================
    -- FIX INVENTORY (Path Mismatch Issue)
    -- ============================================
    RAISE NOTICE 'Fixing Inventory Menu Permissions...';
    
    -- Get Inventory Parent explicitly by path
    SELECT id INTO inventory_parent_id FROM public.menus WHERE path = '/pharmacy/inventory' LIMIT 1;
    
    IF inventory_parent_id IS NOT NULL THEN
        -- Explicitly update permissions for this exact path
        UPDATE public.menus SET allowed_department_id = pharmacy_dept_id WHERE id = inventory_parent_id;
        
        -- Also update any children bound to this parent
        UPDATE public.menus SET allowed_department_id = pharmacy_dept_id WHERE parent_id = inventory_parent_id;

        RAISE NOTICE '  Updated Inventory Department Links';
    ELSE
        RAISE NOTICE '  Warning: Inventory parent menu not found at /pharmacy/inventory';
    END IF;

    -- ============================================
    -- FILL DISTRIBUTION SUBMENUS
    -- ============================================
    RAISE NOTICE 'Ensuring Distribution Submenus...';
    
    -- Get Distribution Parent
    SELECT id INTO distribution_parent_id FROM public.menus WHERE label = 'Distribution' AND path = '/distribution' LIMIT 1;
    
    IF distribution_parent_id IS NOT NULL THEN
        -- Link Parent to Pharmacy
        UPDATE public.menus SET allowed_department_id = pharmacy_dept_id WHERE id = distribution_parent_id;

        -- Insert Submenus
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES 
            (gen_random_uuid(), 'Overview', '/distribution/overview', 'LayoutDashboard', distribution_parent_id, 1, false, pharmacy_dept_id, 'distribution_overview'),
            (gen_random_uuid(), 'Fleet Management', '/distribution/fleet', 'Truck', distribution_parent_id, 2, false, pharmacy_dept_id, 'distribution_fleet'),
            (gen_random_uuid(), 'Delivery Orders', '/distribution/orders', 'FileText', distribution_parent_id, 3, false, pharmacy_dept_id, 'distribution_orders')
        ON CONFLICT (path) DO UPDATE SET 
            parent_id = distribution_parent_id,
            allowed_department_id = pharmacy_dept_id;
            
        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '  Upserted % Distribution submenus', menu_count;
    ELSE
        RAISE NOTICE '  Warning: Distribution parent not found';
    END IF;

    -- ============================================
    -- FILL MEDICAL OXYGEN SUBMENUS
    -- ============================================
    RAISE NOTICE 'Ensuring Medical Oxygen Submenus...';

    -- Get Oxygen Parent
    SELECT id INTO oxygen_parent_id FROM public.menus WHERE label = 'Medical Oxygen' AND path = '/oxygen' LIMIT 1;

    IF oxygen_parent_id IS NOT NULL THEN
        -- Link Parent to Pharmacy
        UPDATE public.menus SET allowed_department_id = pharmacy_dept_id WHERE id = oxygen_parent_id;

        -- Insert Submenus based on migration 047 tables
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES 
            (gen_random_uuid(), 'Dashboard', '/oxygen/dashboard', 'LayoutDashboard', oxygen_parent_id, 1, false, pharmacy_dept_id, 'oxygen_dashboard'),
            (gen_random_uuid(), 'Cylinder Registry', '/oxygen/cylinders', 'Database', oxygen_parent_id, 2, false, pharmacy_dept_id, 'oxygen_cylinders'),
            (gen_random_uuid(), 'Reception & Refill', '/oxygen/reception', 'ArrowDownToLine', oxygen_parent_id, 3, false, pharmacy_dept_id, 'oxygen_reception'),
            (gen_random_uuid(), 'Supplier Requests', '/oxygen/requests', 'ShoppingCart', oxygen_parent_id, 4, false, pharmacy_dept_id, 'oxygen_requests'),
            (gen_random_uuid(), 'Movements & Loan', '/oxygen/movements', 'ArrowLeftRight', oxygen_parent_id, 5, false, pharmacy_dept_id, 'oxygen_movements')
        ON CONFLICT (path) DO UPDATE SET 
            parent_id = oxygen_parent_id,
            allowed_department_id = pharmacy_dept_id;
            
        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '  Upserted % Oxygen submenus', menu_count;
    ELSE
         RAISE NOTICE '  Warning: Medical Oxygen parent not found';
    END IF;

    -- ============================================
    -- GLOBAL PERMISSION GRANT (For Safe Measure)
    -- ============================================
    RAISE NOTICE 'Refreshing Permissions...';
    
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT r.id, m.id, true
    FROM public.roles r, public.menus m
    WHERE (r.role_code ILIKE '%pharmacy%' OR r.role_code ILIKE '%pharmacist%')
    AND m.allowed_department_id = pharmacy_dept_id
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    RAISE NOTICE '=== COMPLETE ===';
END $$;
