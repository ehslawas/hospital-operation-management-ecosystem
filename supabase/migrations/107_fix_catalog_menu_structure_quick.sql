-- Quick manual execution script
-- Copy and paste this into your Supabase SQL Editor
-- OR run using: npx supabase db push --file supabase/migrations/107_fix_catalog_menu_structure.sql

\echo 'Starting catalog menu structure fix...'

DO $$
DECLARE
    v_catalogs_parent_id uuid;
    v_inventory_parent_id uuid;
    v_contract_parent_id uuid;
    v_pharmacy_dept_id uuid;
    v_drug_menu_id uuid;
    v_non_drug_menu_id uuid;
    v_contract_drug_menu_id uuid;
    v_contract_non_drug_menu_id uuid;
BEGIN
    SELECT id INTO v_pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS' LIMIT 1;
    SELECT id INTO v_catalogs_parent_id FROM public.menus WHERE menu_name = 'Catalogs' AND parent_id IS NULL LIMIT 1;
    
    IF v_catalogs_parent_id IS NULL THEN RAISE EXCEPTION 'Catalogs parent menu not found!'; END IF;
    
    -- Create Inventory Catalog parent
    SELECT id INTO v_inventory_parent_id FROM public.menus WHERE menu_path = '/pharmacy/catalog/inventory-parent' LIMIT 1;
    IF v_inventory_parent_id IS NULL THEN
        v_inventory_parent_id := gen_random_uuid();
        INSERT INTO public.menus (id, menu_name, menu_path, icon, parent_id, display_order, is_core, department_id, module_code)
        VALUES (v_inventory_parent_id, 'Inventory Catalog', '/pharmacy/catalog/inventory-parent', 'Package', v_catalogs_parent_id, 1, true, v_pharmacy_dept_id, 'pharmacy.inventory_catalog');
    ELSE
        UPDATE public.menus SET parent_id = v_catalogs_parent_id, display_order = 1 WHERE id = v_inventory_parent_id;
    END IF;
    
    -- Move Drug and Non-Drug under Inventory
    UPDATE public.menus SET parent_id = v_inventory_parent_id, display_order = 1 WHERE menu_path = '/pharmacy/catalog/drugs';
    UPDATE public.menus SET parent_id = v_inventory_parent_id, display_order = 2 WHERE menu_path = '/pharmacy/catalog/non-drugs';
    
    -- Create Contract Catalog parent
    SELECT id INTO v_contract_parent_id FROM public.menus WHERE menu_path = '/pharmacy/catalog/contracts-parent' LIMIT 1;
    IF v_contract_parent_id IS NULL THEN
        v_contract_parent_id := gen_random_uuid();
        INSERT INTO public.menus (id, menu_name, menu_path, icon, parent_id, display_order, is_core, department_id, module_code)
        VALUES (v_contract_parent_id, 'Contract Catalog', '/pharmacy/catalog/contracts-parent', 'FileText', v_catalogs_parent_id, 4, true, v_pharmacy_dept_id, 'pharmacy.contract_catalog');
    ELSE
        UPDATE public.menus SET parent_id = v_catalogs_parent_id, display_order = 4 WHERE id = v_contract_parent_id;
    END IF;
    
    -- Handle Contract Drug (might be at old path)
    SELECT id INTO v_contract_drug_menu_id FROM public.menus WHERE menu_path IN ('/pharmacy/catalog/contracts', '/pharmacy/catalog/contract-drugs') LIMIT 1;
    IF v_contract_drug_menu_id IS NOT NULL THEN
        UPDATE public.menus SET menu_name = 'Contract Drug', menu_path = '/pharmacy/catalog/contract-drugs', parent_id = v_contract_parent_id, display_order = 1 WHERE id = v_contract_drug_menu_id;
    END IF;
    
    -- Create/Update Contract Non-Drug
    SELECT id INTO v_contract_non_drug_menu_id FROM public.menus WHERE menu_path = '/pharmacy/catalog/contract-non-drugs' LIMIT 1;
    IF v_contract_non_drug_menu_id IS NULL THEN
        v_contract_non_drug_menu_id := gen_random_uuid();
        INSERT INTO public.menus (id, menu_name, menu_path, icon, parent_id, display_order, is_core, department_id, module_code)
        VALUES (v_contract_non_drug_menu_id, 'Contract Non-Drug', '/pharmacy/catalog/contract-non-drugs', 'Package', v_contract_parent_id, 2, true, v_pharmacy_dept_id, 'pharmacy.contract_non_drug');
    ELSE
        UPDATE public.menus SET parent_id = v_contract_parent_id, display_order = 2 WHERE id = v_contract_non_drug_menu_id;
    END IF;
    
    -- Update order of all catalog menus
    UPDATE public.menus SET display_order = 2 WHERE menu_path = '/pharmacy/catalog/supplier';
    UPDATE public.menus SET display_order = 3 WHERE menu_path = '/pharmacy/catalog/appl';
    UPDATE public.menus SET display_order = 5 WHERE menu_path = '/pharmacy/catalog/lp';
    UPDATE public.menus SET display_order = 6 WHERE menu_path = '/pharmacy/catalog/reagents';
    UPDATE public.menus SET display_order = 7 WHERE menu_path = '/pharmacy/catalog/hospitals';
    UPDATE public.menus SET display_order = 8 WHERE menu_path = '/pharmacy/catalog/clinics';
END $$;

\echo 'Catalog menu structure fixed!'

-- Verify the changes
SELECT 
    m.menu_name,
    m.menu_path,
    m.display_order,
    p.menu_name as parent_name
FROM menus m
LEFT JOIN menus p ON m.parent_id = p.id
WHERE m.menu_name ILIKE '%catalog%' 
   OR p.menu_name ILIKE '%catalog%'
ORDER BY COALESCE(m.parent_id, m.id), m.display_order;
