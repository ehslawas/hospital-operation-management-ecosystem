-- Migration 067: Complete Menu System Fix
-- Description: Single comprehensive migration to fix all menu permissions and department links
-- This replaces the patchwork approach of migrations 060-066

DO $$
DECLARE
    pharmacy_dept_id uuid;
    admin_dept_id uuid;
    hospital_id_for_admin uuid;
    role_rec record;
    menu_rec record;
    perm_count integer := 0;
    menu_update_count integer := 0;
BEGIN
    RAISE NOTICE '=== MIGRATION 067: COMPLETE MENU SYSTEM FIX ===';
    
    -- ============================================
    -- STEP 1: Ensure departments exist
    -- ============================================
    RAISE NOTICE 'Step 1: Ensuring departments exist...';
    
    -- Get or create pharmacy_logistics department
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics' LIMIT 1;
    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'pharmacy_logistics department not found!';
    END IF;
    RAISE NOTICE '  Pharmacy Logistics Dept ID: %', pharmacy_dept_id;
    
    -- Get or create hospital_admin department
    SELECT id INTO admin_dept_id FROM public.departments WHERE department_code = 'hospital_admin' LIMIT 1;
    IF admin_dept_id IS NULL THEN
        -- Create it
        SELECT id INTO hospital_id_for_admin FROM public.hospitals LIMIT 1;
        INSERT INTO public.departments (department_name, department_code, hospital_id)
        VALUES ('Hospital Administration', 'hospital_admin', hospital_id_for_admin)
        RETURNING id INTO admin_dept_id;
        RAISE NOTICE '  Created Hospital Admin Dept ID: %', admin_dept_id;
    ELSE
        RAISE NOTICE '  Hospital Admin Dept ID: %', admin_dept_id;
    END IF;

    -- ============================================
    -- STEP 2: Clear ALL department restrictions first (reset to clean state)
    -- ============================================
    RAISE NOTICE 'Step 2: Resetting all menu department restrictions...';
    UPDATE public.menus SET allowed_department_id = NULL;
    GET DIAGNOSTICS menu_update_count = ROW_COUNT;
    RAISE NOTICE '  Reset % menus to global (NULL dept)', menu_update_count;

    -- ============================================
    -- STEP 3: Set Pharmacy department on pharmacy menus
    -- ============================================
    RAISE NOTICE 'Step 3: Setting pharmacy department on pharmacy menus...';
    
    -- Using path-based matching for accuracy
    UPDATE public.menus 
    SET allowed_department_id = pharmacy_dept_id
    WHERE path LIKE '/inventory%'
       OR path LIKE '/procurement%'
       OR path LIKE '/financial%'
       OR path LIKE '/distribution%'
       OR path LIKE '/oxygen%'
       OR path LIKE '/catalogs%'
       OR path LIKE '/maintenance%'
       OR path LIKE '/reports%'
       OR path LIKE '/facilities%'
       OR label IN (
           'Inventory', 'Procurement', 'Financial', 'Distribution', 
           'Medical Oxygen', 'Catalogs', 'Maintenance', 'Reports & Logs',
           'Hospital Facilities', 'Clinic Facilities', 'Warrant', 'Payments',
           'APPL Allocation', 'CC Allocation', 'LP Allocation', 'LPO',
           'Purchase Orders', 'Order Tracking', 'Receiving', 'Stock Verification',
           'Stock Locations', 'Drug Catalog', 'Non-Drug Catalog', 'Supplier Catalog',
           'Contract Catalog', 'Unit Catalog', 'Penalties', 'Letters of Undertaking'
       );
    GET DIAGNOSTICS menu_update_count = ROW_COUNT;
    RAISE NOTICE '  Assigned % menus to Pharmacy Logistics dept', menu_update_count;

    -- ============================================
    -- STEP 4: Set Admin department on admin menus
    -- ============================================
    RAISE NOTICE 'Step 4: Setting admin department on admin menus...';
    
    UPDATE public.menus 
    SET allowed_department_id = admin_dept_id
    WHERE path LIKE '/admin%'
       OR label IN (
           'Manage Users', 'Access Requests', 'Departments', 
           'Roles & Permissions', 'Hospitals', 'Hospital Memos',
           'Audit Logs', 'System Settings'
       );
    GET DIAGNOSTICS menu_update_count = ROW_COUNT;
    RAISE NOTICE '  Assigned % menus to Hospital Admin dept', menu_update_count;

    -- ============================================
    -- STEP 5: Keep Dashboard as global (NULL)
    -- ============================================
    RAISE NOTICE 'Step 5: Ensuring Dashboard is global...';
    UPDATE public.menus SET allowed_department_id = NULL WHERE path = '/dashboard' OR path = '/' OR label = 'Dashboard';
    GET DIAGNOSTICS menu_update_count = ROW_COUNT;
    RAISE NOTICE '  Set % menus as global (Dashboard)', menu_update_count;

    -- ============================================
    -- STEP 6: Clear ALL existing permissions (start fresh)
    -- ============================================
    RAISE NOTICE 'Step 6: Clearing all existing role_menu_access entries...';
    DELETE FROM public.role_menu_access;
    GET DIAGNOSTICS perm_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % old permission entries', perm_count;

    -- ============================================
    -- STEP 7: Grant permissions to PHARMACY roles
    -- ============================================
    RAISE NOTICE 'Step 7: Granting permissions to pharmacy roles...';
    perm_count := 0;
    
    FOR role_rec IN 
        SELECT id, role_code FROM public.roles 
        WHERE role_code ILIKE '%pharmacy%' OR role_code ILIKE '%pharmacist%'
    LOOP
        -- Grant access to pharmacy-specific menus + global menus
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_rec.id, m.id, true
        FROM public.menus m
        WHERE m.allowed_department_id = pharmacy_dept_id 
           OR m.allowed_department_id IS NULL
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        
        GET DIAGNOSTICS menu_update_count = ROW_COUNT;
        perm_count := perm_count + menu_update_count;
        RAISE NOTICE '  Role %: granted % permissions', role_rec.role_code, menu_update_count;
    END LOOP;
    RAISE NOTICE '  Total pharmacy permissions: %', perm_count;

    -- ============================================
    -- STEP 8: Grant permissions to ADMIN roles
    -- ============================================
    RAISE NOTICE 'Step 8: Granting permissions to admin roles...';
    perm_count := 0;
    
    FOR role_rec IN 
        SELECT id, role_code FROM public.roles 
        WHERE role_code IN ('system_admin', 'hospital_admin')
    LOOP
        -- Grant access to admin-specific menus + global menus
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_rec.id, m.id, true
        FROM public.menus m
        WHERE m.allowed_department_id = admin_dept_id 
           OR m.allowed_department_id IS NULL
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        
        GET DIAGNOSTICS menu_update_count = ROW_COUNT;
        perm_count := perm_count + menu_update_count;
        RAISE NOTICE '  Role %: granted % permissions', role_rec.role_code, menu_update_count;
    END LOOP;
    RAISE NOTICE '  Total admin permissions: %', perm_count;

    -- ============================================
    -- STEP 9: Summary
    -- ============================================
    RAISE NOTICE '=== MIGRATION 067 COMPLETE ===';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Pharmacy Dept ID: %', pharmacy_dept_id;
    RAISE NOTICE '  - Admin Dept ID: %', admin_dept_id;
    
    -- Count final state
    SELECT COUNT(*) INTO perm_count FROM public.role_menu_access;
    RAISE NOTICE '  - Total permissions in system: %', perm_count;
    
    SELECT COUNT(*) INTO menu_update_count FROM public.menus WHERE allowed_department_id = pharmacy_dept_id;
    RAISE NOTICE '  - Pharmacy-restricted menus: %', menu_update_count;
    
    SELECT COUNT(*) INTO menu_update_count FROM public.menus WHERE allowed_department_id = admin_dept_id;
    RAISE NOTICE '  - Admin-restricted menus: %', menu_update_count;
    
    SELECT COUNT(*) INTO menu_update_count FROM public.menus WHERE allowed_department_id IS NULL;
    RAISE NOTICE '  - Global menus: %', menu_update_count;
    
END $$;
