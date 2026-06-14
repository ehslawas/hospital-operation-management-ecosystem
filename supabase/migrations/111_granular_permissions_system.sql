-- ============================================================================
-- Migration 111: Granular Permissions System
-- Description: Refactors Medical Oxygen and Pharmacy Logistics into granular sub-modules
--              to prevent "all-or-nothing" menu access.
-- ============================================================================

DO $$
DECLARE
    -- Parent Module IDs
    oxygen_parent_id UUID;
    logistics_parent_id UUID;
    admin_system_role_id UUID;

    -- New Module IDs (Oxygen)
    mod_ox_dash UUID;
    mod_ox_inv UUID;
    mod_ox_req UUID;
    mod_ox_qr UUID;
    mod_ox_rec UUID;
    mod_ox_recv UUID;

    -- New Module IDs (Logistics)
    mod_log_proc UUID;
    mod_log_fin UUID;
    mod_log_dist UUID;
    mod_log_inv UUID;
    mod_log_rep UUID;

BEGIN
    RAISE NOTICE '=== MIGRATION 111: SETTING UP GRANULAR PERMISSIONS ===';

    -- 1. GET OR CREATE PARENT MODULES
    -- ============================================================================
    
    -- Medical Oxygen Parent
    SELECT id INTO oxygen_parent_id FROM public.modules WHERE module_code = 'pharmacy.oxygen';
    IF oxygen_parent_id IS NULL THEN
        INSERT INTO public.modules (module_name, module_code, route_path, icon_name, display_order)
        VALUES ('Medical Oxygen', 'pharmacy.oxygen', '/pharmacy/oxygen', 'Cylinder', 10)
        RETURNING id INTO oxygen_parent_id;
    END IF;

    -- Pharmacy Logistics Parent
    SELECT id INTO logistics_parent_id FROM public.modules WHERE module_code = 'pharmacy_logistics';
    IF logistics_parent_id IS NULL THEN
         -- Try fallback or create
         INSERT INTO public.modules (module_name, module_code, route_path, icon_name, display_order)
         VALUES ('Pharmacy Logistics', 'pharmacy_logistics', '/pharmacy/logistics', 'Package', 5)
         RETURNING id INTO logistics_parent_id;
    END IF;

    -- 2. CREATE GRANULAR SUB-MODULES (OXYGEN)
    -- ============================================================================
    RAISE NOTICE 'Creating Oxygen Sub-modules...';

    -- Dashboard
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Oxygen Dashboard', 'pharmacy.oxygen.dashboard', oxygen_parent_id, '/pharmacy/oxygen/dashboard', 'LayoutDashboard', 1)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = oxygen_parent_id
    RETURNING id INTO mod_ox_dash;

    -- Inventory
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Cylinder Inventory', 'pharmacy.oxygen.inventory', oxygen_parent_id, '/pharmacy/oxygen/inventory', 'List', 2)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = oxygen_parent_id
    RETURNING id INTO mod_ox_inv;

    -- Requests
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Cylinder Requests', 'pharmacy.oxygen.requests', oxygen_parent_id, '/pharmacy/oxygen/cylinder-requests', 'Inbox', 3)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = oxygen_parent_id
    RETURNING id INTO mod_ox_req;

    -- QR Generator
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('QR Generator', 'pharmacy.oxygen.qr', oxygen_parent_id, '/pharmacy/oxygen/qr', 'QrCode', 4)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = oxygen_parent_id
    RETURNING id INTO mod_ox_qr;

    -- Stock Reconciliation
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Stock Reconciliation', 'pharmacy.oxygen.reconciliation', oxygen_parent_id, '/pharmacy/oxygen/stock-reconciliation', 'ClipboardCheck', 5)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = oxygen_parent_id
    RETURNING id INTO mod_ox_rec;
    
    -- Receiving (Likely exists or needed)
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Oxygen Receiving', 'pharmacy.oxygen.receiving', oxygen_parent_id, '/pharmacy/oxygen/receiving', 'Truck', 6)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = oxygen_parent_id
    RETURNING id INTO mod_ox_recv;

    -- 3. CREATE GRANULAR SUB-MODULES (LOGISTICS)
    -- ============================================================================
    RAISE NOTICE 'Creating Logistics Sub-modules...';

    -- Procurement
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Procurement', 'pharmacy.logistics.procurement', logistics_parent_id, '/pharmacy/logistics/procurement', 'ShoppingCart', 1)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = logistics_parent_id
    RETURNING id INTO mod_log_proc;

    -- Financial
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Financial', 'pharmacy.logistics.financial', logistics_parent_id, '/pharmacy/logistics/financial', 'DollarSign', 2)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = logistics_parent_id
    RETURNING id INTO mod_log_fin;

    -- Distribution
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Distribution', 'pharmacy.logistics.distribution', logistics_parent_id, '/pharmacy/logistics/distribution', 'Truck', 3)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = logistics_parent_id
    RETURNING id INTO mod_log_dist;

    -- Inventory (Logistics)
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Inventory', 'pharmacy.logistics.inventory', logistics_parent_id, '/pharmacy/logistics/inventory', 'Package', 4)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = logistics_parent_id
    RETURNING id INTO mod_log_inv;

    -- Reports
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order)
    VALUES ('Reports', 'pharmacy.logistics.reports', logistics_parent_id, '/pharmacy/logistics/reports', 'BarChart', 5)
    ON CONFLICT (module_code) DO UPDATE SET parent_module_id = logistics_parent_id
    RETURNING id INTO mod_log_rep;


    -- 4. UPDATE MENUS TO USE NEW MODULE CODES
    -- ============================================================================
    RAISE NOTICE 'Remapping Menus...';

    -- Oxygen Menus
    UPDATE public.menus SET module_code = 'pharmacy.oxygen.dashboard' WHERE path LIKE '%/pharmacy/oxygen/dashboard%';
    UPDATE public.menus SET module_code = 'pharmacy.oxygen.inventory' WHERE path LIKE '%/pharmacy/oxygen/inventory%';
    UPDATE public.menus SET module_code = 'pharmacy.oxygen.requests' WHERE path LIKE '%/pharmacy/oxygen/cylinder-requests%';
    UPDATE public.menus SET module_code = 'pharmacy.oxygen.qr' WHERE path LIKE '%/pharmacy/oxygen/qr%';
    UPDATE public.menus SET module_code = 'pharmacy.oxygen.reconciliation' WHERE path LIKE '%/pharmacy/oxygen/stock-reconciliation%';

    -- Logistics Menus (Need to match paths roughly)
    UPDATE public.menus SET module_code = 'pharmacy.logistics.procurement' WHERE path LIKE '%/pharmacy/logistics/procurement%' OR label ILIKE '%Procurement%';
    UPDATE public.menus SET module_code = 'pharmacy.logistics.financial' WHERE path LIKE '%/pharmacy/logistics/financial%' OR label ILIKE '%Financial%';
    UPDATE public.menus SET module_code = 'pharmacy.logistics.distribution' WHERE path LIKE '%/pharmacy/logistics/distribution%' OR label ILIKE '%Distribution%';
    UPDATE public.menus SET module_code = 'pharmacy.logistics.inventory' 
        WHERE (path LIKE '%/pharmacy/logistics/inventory%' OR label ILIKE '%Inventory%') 
        AND path NOT LIKE '%oxygen%'; -- Exclude oxygen inventory
    UPDATE public.menus SET module_code = 'pharmacy.logistics.reports' WHERE path LIKE '%/pharmacy/logistics/reports%' OR label ILIKE '%Reports%';


    -- 5. UPDATE FEATURES TO LINK TO NEW MODULES
    -- ============================================================================
    RAISE NOTICE 'Remapping Features...';
    
    -- Function to upsert feature and link to module
    -- Helper replacement via direct logic since we can't define functions easily inside DO block used like this without risk

    -- Oxygen Features
    -- We assume feature_code is stable key. IF feature doesn't exist, we create it.
    
    -- Dashboard
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    VALUES (mod_ox_dash, 'View Dashboard', 'dashboard_view', 'View Oxygen Dashboard')
    ON CONFLICT (module_id, feature_code) DO NOTHING; -- If exists under this module, fine.
    
    -- If duplicate code exists under old module, we should move it? 
    -- Better to UPDATE existing features by code to point to NEW module_id
    UPDATE public.features SET module_id = mod_ox_dash WHERE feature_code = 'dashboard_view';
    UPDATE public.features SET module_id = mod_ox_inv WHERE feature_code = 'cylinder_view';
    UPDATE public.features SET module_id = mod_ox_req WHERE feature_code = 'cylinder_request';
    UPDATE public.features SET module_id = mod_ox_qr WHERE feature_code = 'qr_generate';
    UPDATE public.features SET module_id = mod_ox_rec WHERE feature_code IN ('return_process', 'stock_reconciliation');

    -- Logistics Features
    -- Existing codes might be generic (e.g. 'inventory_view'). We need to be careful.
    -- Assuming they follow a pattern or we create new canonical ones.
    
    -- Procurement
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    VALUES (mod_log_proc, 'View Procurement', 'procurement_view', 'Access Procurement Module')
    ON CONFLICT (module_id, feature_code) DO NOTHING;
    UPDATE public.features SET module_id = mod_log_proc WHERE feature_code = 'procurement_view';

    -- Financial
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    VALUES (mod_log_fin, 'View Financials', 'financial_view', 'Access Financial Module')
    ON CONFLICT (module_id, feature_code) DO NOTHING;
    UPDATE public.features SET module_id = mod_log_fin WHERE feature_code = 'financial_view';

    -- Distribution
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    VALUES (mod_log_dist, 'View Distribution', 'distribution_view', 'Access Distribution Module')
    ON CONFLICT (module_id, feature_code) DO NOTHING;
    UPDATE public.features SET module_id = mod_log_dist WHERE feature_code = 'distribution_view';

    -- Inventory (Logistics)
    -- CAREFUL: 'inventory_view' might be used by oxygen too if not careful. 
    -- Oxygen uses 'cylinder_view'.
    -- Check if 'inventory_view' exists
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    VALUES (mod_log_inv, 'View Logistics Inventory', 'inventory_view', 'Access Pharmacy Inventory')
    ON CONFLICT (module_id, feature_code) DO NOTHING;
    UPDATE public.features SET module_id = mod_log_inv WHERE feature_code = 'inventory_view';
    
    -- Reports
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    VALUES (mod_log_rep, 'View Global Reports', 'reports_view', 'Access Pharmacy Reports')
    ON CONFLICT (module_id, feature_code) DO NOTHING;
    UPDATE public.features SET module_id = mod_log_rep WHERE feature_code = 'reports_view';


    -- 6. GRANT ADMIN ACCESS (Safety Net)
    -- ============================================================================
    RAISE NOTICE 'Granting Admin Permissions...';
    
    SELECT id INTO admin_system_role_id FROM public.roles WHERE role_code = 'system_admin' LIMIT 1;
    
    IF admin_system_role_id IS NOT NULL THEN
        -- Link new modules to admin role
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
        VALUES 
            (admin_system_role_id, mod_ox_dash, true, true, true, true),
            (admin_system_role_id, mod_ox_inv, true, true, true, true),
            (admin_system_role_id, mod_ox_req, true, true, true, true),
            (admin_system_role_id, mod_ox_qr, true, true, true, true),
            (admin_system_role_id, mod_ox_rec, true, true, true, true),
            (admin_system_role_id, mod_ox_recv, true, true, true, true),
            (admin_system_role_id, mod_log_proc, true, true, true, true),
            (admin_system_role_id, mod_log_fin, true, true, true, true),
            (admin_system_role_id, mod_log_dist, true, true, true, true),
            (admin_system_role_id, mod_log_inv, true, true, true, true),
            (admin_system_role_id, mod_log_rep, true, true, true, true)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
    END IF;

    RAISE NOTICE '=== MIGRATION 111 COMPLETE ===';
END $$;
