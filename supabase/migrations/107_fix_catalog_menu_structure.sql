-- Migration: Fix Catalog Menu Structure (Definitive)
-- Description: Correctly nests Drug/Non-Drug under Inventory and Contract Drug/Non-Drug under Contract Catalog
-- Ensures correct column names (label, path, ordering) and permissions.

DO $$
DECLARE
    v_catalogs_parent_id uuid;
    v_inventory_parent_id uuid;
    v_contract_parent_id uuid;
    v_pharmacy_dept_id uuid;
BEGIN
    -- Get references
    SELECT id INTO v_pharmacy_dept_id FROM departments WHERE department_code = 'PHARMACY_LOGISTICS' LIMIT 1;
    SELECT id INTO v_catalogs_parent_id FROM menus WHERE label = 'Catalogs' AND parent_id IS NULL LIMIT 1;
    
    -- 1. CREATE/UPDATE INVENTORY CATALOG PARENT
    SELECT id INTO v_inventory_parent_id FROM menus WHERE path = '/pharmacy/catalog/inventory-parent' LIMIT 1;
    IF v_inventory_parent_id IS NULL THEN
        INSERT INTO menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Inventory Catalog', '/pharmacy/catalog/inventory-parent', 'Package', v_catalogs_parent_id, 1, true, v_pharmacy_dept_id, 'pharmacy.inventory_catalog')
        RETURNING id INTO v_inventory_parent_id;
    ELSE
        UPDATE menus SET parent_id = v_catalogs_parent_id, order_index = 1 WHERE id = v_inventory_parent_id;
    END IF;
    
    -- 2. MOVE DRUG & NON-DRUG UNDER INVENTORY
    UPDATE menus SET parent_id = v_inventory_parent_id, order_index = 1 WHERE path = '/pharmacy/catalog/drugs';
    UPDATE menus SET parent_id = v_inventory_parent_id, order_index = 2 WHERE path = '/pharmacy/catalog/non-drugs';
    
    -- 3. ENSURE APPL PARENT & SUB-MENUS
    UPDATE menus SET parent_id = v_catalogs_parent_id, order_index = 2 WHERE path = '/pharmacy/catalog/appl';
    UPDATE menus SET order_index = 1 WHERE path = '/pharmacy/catalog/appl-drugs';
    UPDATE menus SET order_index = 2 WHERE path = '/pharmacy/catalog/appl-non-drugs';
    
    -- 4. CREATE/UPDATE CONTRACT CATALOG PARENT
    SELECT id INTO v_contract_parent_id FROM menus WHERE path = '/pharmacy/catalog/contracts-parent' LIMIT 1;
    IF v_contract_parent_id IS NULL THEN
        INSERT INTO menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'Contract Catalog', '/pharmacy/catalog/contracts-parent', 'FileText', v_catalogs_parent_id, 3, true, v_pharmacy_dept_id, 'pharmacy.contract_catalog')
        RETURNING id INTO v_contract_parent_id;
    ELSE
        UPDATE menus SET parent_id = v_catalogs_parent_id, order_index = 3 WHERE id = v_contract_parent_id;
    END IF;
    
    -- 5. HANDLE CONTRACT DRUG (MIGHT BE AT OLD PATH)
    UPDATE menus 
    SET label = 'Contract Drug', 
        path = '/pharmacy/catalog/contract-drugs', 
        parent_id = v_contract_parent_id, 
        order_index = 1 
    WHERE path IN ('/pharmacy/catalog/contracts', '/pharmacy/catalog/contract-drugs');
    
    -- 6. ENSURE CONTRACT NON-DRUG
    INSERT INTO menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
    VALUES (gen_random_uuid(), 'Contract Non-Drug', '/pharmacy/catalog/contract-non-drugs', 'Package', v_contract_parent_id, 2, true, v_pharmacy_dept_id, 'pharmacy.contract_non_drug')
    ON CONFLICT (path) DO UPDATE SET parent_id = v_contract_parent_id, order_index = 2;
    
    -- 7. ENSURE LP PARENT & SUB-MENUS
    UPDATE menus SET parent_id = v_catalogs_parent_id, order_index = 4 WHERE path = '/pharmacy/catalog/lp';
    UPDATE menus SET order_index = 1 WHERE path = '/pharmacy/catalog/lp-drugs';
    UPDATE menus SET order_index = 2 WHERE path = '/pharmacy/catalog/lp-non-drugs';
    
    -- 8. SET CORRECT ORDER FOR ALL CATALOG MENUS (User's Requested Order)
    UPDATE menus SET order_index = 1 WHERE path = '/pharmacy/catalog/inventory-parent';
    UPDATE menus SET order_index = 2 WHERE path = '/pharmacy/catalog/appl';
    UPDATE menus SET order_index = 3 WHERE path = '/pharmacy/catalog/contracts-parent';
    UPDATE menus SET order_index = 4 WHERE path = '/pharmacy/catalog/lp';
    UPDATE menus SET order_index = 5 WHERE path = '/pharmacy/catalog/reagents';
    UPDATE menus SET order_index = 6 WHERE path = '/pharmacy/catalog/supplier';
    UPDATE menus SET order_index = 7 WHERE path = '/pharmacy/catalog/hospitals';
    UPDATE menus SET order_index = 8 WHERE path = '/pharmacy/catalog/clinics';
    
    RAISE NOTICE '✅ Catalog menu structure fixed successfully!';
END $$;

-- Verify the changes
SELECT 
    m.label as menu_name,
    m.path as menu_path,
    m.order_index as display_order,
    p.label as parent_name
FROM menus m
LEFT JOIN menus p ON m.parent_id = p.id
WHERE m.label ILIKE '%catalog%' 
   OR p.label ILIKE '%catalog%'
ORDER BY COALESCE(m.parent_id, m.id), m.order_index;
