-- Migration: Final Fix for APPL & LP Catalog Visibility
-- Description: Ensures menus exist, are correctly nested under 'Catalogs', and have permissions
-- Date: 2026-01-14

DO $$
DECLARE
    v_pharm_dept_id uuid;
    v_cat_parent_id uuid;
    v_appl_parent_id uuid;
    v_lp_parent_id uuid;
    v_role_id uuid;
BEGIN
    -- 1. Identify Pharmacy Department (trying both possibilities)
    SELECT id INTO v_pharm_dept_id 
    FROM public.departments 
    WHERE department_code IN ('PHARMACY_LOGISTICS', 'PHARMACY_LOGISTIC') 
    LIMIT 1;
    
    -- 2. Identify the main 'Catalogs' parent menu
    SELECT id INTO v_cat_parent_id 
    FROM public.menus 
    WHERE path = '/catalogs' OR label = 'Catalogs' 
    LIMIT 1;

    -- 3. Create or Update APPL Catalog Parent Menu
    INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'APPL Catalog', '/pharmacy/catalog/appl', 'Package', v_cat_parent_id, 7, true, v_pharm_dept_id, 'appl_catalog')
    ON CONFLICT (path) DO UPDATE SET 
        parent_id = v_cat_parent_id,
        label = EXCLUDED.label,
        allowed_department_id = v_pharm_dept_id
    RETURNING id INTO v_appl_parent_id;

    -- 4. Create or Update LP Catalog Parent Menu
    INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'LP Catalog', '/pharmacy/catalog/lp', 'Package', v_cat_parent_id, 8, true, v_pharm_dept_id, 'lp_catalog')
    ON CONFLICT (path) DO UPDATE SET 
        parent_id = v_cat_parent_id,
        label = EXCLUDED.label,
        allowed_department_id = v_pharm_dept_id
    RETURNING id INTO v_lp_parent_id;

    -- 5. Create or Update Submenus
    -- APPL Drugs
    INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'APPL Drugs', '/pharmacy/catalog/appl-drugs', 'Pill', v_appl_parent_id, 1, true, v_pharm_dept_id, 'appl_drugs')
    ON CONFLICT (path) DO UPDATE SET parent_id = v_appl_parent_id, allowed_department_id = v_pharm_dept_id;

    -- APPL Non-Drugs
    INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'APPL Non-Drugs', '/pharmacy/catalog/appl-non-drugs', 'Box', v_appl_parent_id, 2, true, v_pharm_dept_id, 'appl_non_drugs')
    ON CONFLICT (path) DO UPDATE SET parent_id = v_appl_parent_id, allowed_department_id = v_pharm_dept_id;

    -- LP Drugs
    INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'LP Drugs', '/pharmacy/catalog/lp-drugs', 'Pill', v_lp_parent_id, 1, true, v_pharm_dept_id, 'lp_drugs')
    ON CONFLICT (path) DO UPDATE SET parent_id = v_lp_parent_id, allowed_department_id = v_pharm_dept_id;

    -- LP Non-Drugs
    INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'LP Non-Drugs', '/pharmacy/catalog/lp-non-drugs', 'Box', v_lp_parent_id, 2, true, v_pharm_dept_id, 'lp_non_drugs')
    ON CONFLICT (path) DO UPDATE SET parent_id = v_lp_parent_id, allowed_department_id = v_pharm_dept_id;

    -- 6. Ensure Permissions for all Pharmacy & Admin Roles
    FOR v_role_id IN 
        SELECT id FROM public.roles WHERE role_code IN (
            'pharmacy_director', 'pharmacy_manager', 'pharmacist', 
            'pharmacy_assistant', 'pharmacy_storekeeper', 'pharmacy_staff',
            'hospital_admin', 'system_admin'
        )
    LOOP
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view, can_edit, can_delete)
        SELECT v_role_id, id, true, true, true 
        FROM public.menus 
        WHERE path LIKE '/pharmacy/catalog/%'
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
    END LOOP;

    RAISE NOTICE 'APPL and LP Catalogs have been successfully integrated under the Catalogs menu.';
END $$;
