-- Migration 069: Restore "Gold Standard" Pharmacy Submenus
-- Description: Explicitly restores specific submenus requested by user (Buffer Levels, Transfer Requests, QR Generator)

DO $$
DECLARE
    pharmacy_dept_id uuid;
    inventory_parent_id uuid;
    distribution_parent_id uuid;
    oxygen_parent_id uuid;
    menu_count integer := 0;
BEGIN
    RAISE NOTICE '=== MIGRATION 069: ESTABLISHING GOLD STANDARD MENUS ===';

    -- 1. Get Pharmacy Dept ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics' LIMIT 1;
    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'Pharmacy Logistics department not found!';
    END IF;

    -- ============================================
    -- 1. INVENTORY RESTORATION
    -- ============================================
    SELECT id INTO inventory_parent_id FROM public.menus WHERE path = '/pharmacy/inventory' LIMIT 1;
    
    IF inventory_parent_id IS NOT NULL THEN
        -- Delete "Overview" if it conflicts or is duplicate functionality (Optional, but keeping for now)
        -- Insert User Requested Items
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES 
            (gen_random_uuid(), 'Drug (Buffer Levels)', '/pharmacy/inventory/buffer-drug', 'Package', inventory_parent_id, 1, false, pharmacy_dept_id, 'inv_buffer_drug'),
            (gen_random_uuid(), 'Non-Drug (Buffer Levels)', '/pharmacy/inventory/buffer-non-drug', 'Package', inventory_parent_id, 2, false, pharmacy_dept_id, 'inv_buffer_nondrug'),
            (gen_random_uuid(), 'Item Movement', '/pharmacy/inventory/movement', 'ArrowLeftRight', inventory_parent_id, 3, false, pharmacy_dept_id, 'inv_movement'),
            (gen_random_uuid(), 'Slow Moving Items', '/pharmacy/inventory/slow-moving', 'TrendingDown', inventory_parent_id, 4, false, pharmacy_dept_id, 'inv_slow_moving'),
            (gen_random_uuid(), 'Near Expiry Items', '/pharmacy/inventory/expiry', 'Clock', inventory_parent_id, 5, false, pharmacy_dept_id, 'inv_expiry'),
            (gen_random_uuid(), 'Bad / Defective Stock', '/pharmacy/inventory/defective', 'AlertTriangle', inventory_parent_id, 6, false, pharmacy_dept_id, 'inv_defective')
        ON CONFLICT (path) DO UPDATE SET 
            label = EXCLUDED.label,
            parent_id = inventory_parent_id,
            allowed_department_id = pharmacy_dept_id;
            
        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '  Restored % Inventory submenus', menu_count;
    END IF;

    -- ============================================
    -- 2. DISTRIBUTION RESTORATION
    -- ============================================
    SELECT id INTO distribution_parent_id FROM public.menus WHERE label = 'Distribution' AND path = '/distribution' LIMIT 1;

    IF distribution_parent_id IS NOT NULL THEN
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES 
            (gen_random_uuid(), 'Transfer Requests', '/distribution/requests', 'ClipboardList', distribution_parent_id, 1, false, pharmacy_dept_id, 'dist_requests'),
            (gen_random_uuid(), 'Inter-Facility', '/distribution/inter-facility', 'Truck', distribution_parent_id, 2, false, pharmacy_dept_id, 'dist_inter'),
            (gen_random_uuid(), 'Intra-Facility', '/distribution/intra-facility', 'Building2', distribution_parent_id, 3, false, pharmacy_dept_id, 'dist_intra')
        ON CONFLICT (path) DO UPDATE SET 
            label = EXCLUDED.label,
            parent_id = distribution_parent_id,
            allowed_department_id = pharmacy_dept_id;

        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '  Restored % Distribution submenus', menu_count;
    END IF;

    -- ============================================
    -- 3. MEDICAL OXYGEN RESTORATION
    -- ============================================
    SELECT id INTO oxygen_parent_id FROM public.menus WHERE label = 'Medical Oxygen' AND path = '/oxygen' LIMIT 1;

    IF oxygen_parent_id IS NOT NULL THEN
        -- Renaming existing items to match user preference or upserting new ones
        
        -- Oxygen Dashboard
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Oxygen Dashboard', '/oxygen/dashboard', 'Activity', oxygen_parent_id, 1, false, pharmacy_dept_id, 'oxygen_dashboard')
        ON CONFLICT (path) DO UPDATE SET label = 'Oxygen Dashboard', allowed_department_id = pharmacy_dept_id;

        -- Cylinder Inventory
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Cylinder Inventory', '/oxygen/inventory', 'Database', oxygen_parent_id, 2, false, pharmacy_dept_id, 'oxygen_inventory')
        ON CONFLICT (path) DO UPDATE SET label = 'Cylinder Inventory', allowed_department_id = pharmacy_dept_id;

        -- Cylinder Request (Singular)
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Cylinder Request', '/oxygen/request', 'ShoppingCart', oxygen_parent_id, 3, false, pharmacy_dept_id, 'oxygen_request')
        ON CONFLICT (path) DO UPDATE SET label = 'Cylinder Request', allowed_department_id = pharmacy_dept_id;

        -- QR Generator
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'QR Generator', '/oxygen/qr-generator', 'QrCode', oxygen_parent_id, 4, false, pharmacy_dept_id, 'oxygen_qr')
        ON CONFLICT (path) DO UPDATE SET label = 'QR Generator', allowed_department_id = pharmacy_dept_id;

        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '  Restored % Oxygen submenus', menu_count;
    END IF;

    -- ============================================
    -- 4. REFRESH PERMISSIONS
    -- ============================================
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT r.id, m.id, true
    FROM public.roles r, public.menus m
    WHERE (r.role_code ILIKE '%pharmacy%' OR r.role_code ILIKE '%pharmacist%')
    AND m.allowed_department_id = pharmacy_dept_id
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
    
    RAISE NOTICE 'Permissions refreshed for new menus.';
    
END $$;
