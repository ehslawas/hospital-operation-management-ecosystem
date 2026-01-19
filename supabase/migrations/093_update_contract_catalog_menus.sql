-- Migration: Update Contract Catalog Menus and Add Non-Drug Table
-- Description: Refactor Contract Catalog to have Drug/Non-Drug submenus.

-- 1. Create contract_non_drugs table mirroring contracts
CREATE TABLE IF NOT EXISTS public.contract_non_drugs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_code text,
    item_name text NOT NULL,
    contract_number text NOT NULL,
    start_date date,
    end_date date,
    supplier_name text,
    supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
    unit text,
    unit_price numeric(10, 2),
    delivery_period text,
    sst_rate text,
    currency text DEFAULT 'MYR',
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'expiring', 'pending')),
    metadata jsonb DEFAULT '{}'::jsonb,
    uploaded_file_id uuid REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    
    CONSTRAINT contract_non_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code, contract_number)
);

-- Enable RLS
ALTER TABLE public.contract_non_drugs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS hospital_scoped_contract_non_drugs ON public.contract_non_drugs;
CREATE POLICY hospital_scoped_contract_non_drugs ON public.contract_non_drugs
  FOR ALL USING (
    hospital_id = (
      SELECT hospital_id FROM users WHERE id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contract_non_drugs_item_code ON contract_non_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_contract_non_drugs_supplier_name ON contract_non_drugs(supplier_name);
CREATE INDEX IF NOT EXISTS idx_contract_non_drugs_hospital_status ON contract_non_drugs(hospital_id, status);

-- 2. Update uploaded_files catalog_type constraint
ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;
ALTER TABLE uploaded_files ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'contract', 'contract_drug', 'contract_non_drug', 'reagent'));

-- 3. Update Menus
DO $$
DECLARE
    v_parent_id uuid;
    v_catalogs_parent_id uuid;
    v_pharmacy_dept_id uuid;
    v_old_menu_id uuid;
    v_drug_menu_id uuid;
    v_non_drug_menu_id uuid;
BEGIN
    -- Get Pharmacy Dept
    SELECT id INTO v_pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS' LIMIT 1;
    
    -- Get "Catalogs" Parent
    SELECT id INTO v_catalogs_parent_id FROM public.menus WHERE label = 'Catalogs' OR path = '/catalogs' LIMIT 1;

    -- 1. Ensure "Contract Catalog" (the dropdown container) exists under "Catalogs"
    SELECT id INTO v_parent_id FROM public.menus WHERE path = '/pharmacy/catalog/contracts-parent' LIMIT 1;
    
    IF v_parent_id IS NULL THEN
        v_parent_id := gen_random_uuid();
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (
            v_parent_id,
            'Contract Catalog',
            '/pharmacy/catalog/contracts-parent',
            'FileText',
            v_catalogs_parent_id,
            4,
            true,
            v_pharmacy_dept_id,
            'contract_catalog'
        );
    ELSE
        -- Ensure it's nested under Catalogs even if it was created at root previously
        UPDATE public.menus 
        SET parent_id = v_catalogs_parent_id, 
            order_index = 4 
        WHERE id = v_parent_id;
    END IF;

    -- 2. Handle "Contract Drug" (Try finding by old path first, then new path)
    SELECT id INTO v_drug_menu_id FROM public.menus WHERE path = '/pharmacy/catalog/contracts' LIMIT 1;
    
    IF v_drug_menu_id IS NOT NULL THEN
        -- Transition from old to new
        UPDATE public.menus
        SET label = 'Contract Drug',
            path = '/pharmacy/catalog/contract-drugs',
            parent_id = v_parent_id,
            order_index = 1,
            module_code = 'contract_drug'
        WHERE id = v_drug_menu_id;
    ELSE
        -- Already transitioned or missing?
        SELECT id INTO v_drug_menu_id FROM public.menus WHERE path = '/pharmacy/catalog/contract-drugs' LIMIT 1;
        IF v_drug_menu_id IS NOT NULL THEN
            UPDATE public.menus SET parent_id = v_parent_id WHERE id = v_drug_menu_id;
        END IF;
    END IF;

    -- 3. Handle "Contract Non Drug"
    SELECT id INTO v_non_drug_menu_id FROM public.menus WHERE path = '/pharmacy/catalog/contract-non-drugs' LIMIT 1;
    
    IF v_non_drug_menu_id IS NULL THEN
        v_non_drug_menu_id := gen_random_uuid();
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (
            v_non_drug_menu_id,
            'Contract Non Drug',
            '/pharmacy/catalog/contract-non-drugs',
            'Package',
            v_parent_id,
            2,
            true,
            v_pharmacy_dept_id,
            'contract_non_drug'
        );
    ELSE
        UPDATE public.menus SET parent_id = v_parent_id WHERE id = v_non_drug_menu_id;
    END IF;
    
    -- 4. Sync Permissions
    -- Grant access to parent container and non-drug based on drug menu access if they exist
    IF v_drug_menu_id IS NOT NULL THEN
        -- Access for parent
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT rma.role_id, v_parent_id, rma.can_view
        FROM public.role_menu_access rma
        WHERE rma.menu_id = v_drug_menu_id
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = EXCLUDED.can_view;

        -- Access for non-drug
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT rma.role_id, v_non_drug_menu_id, rma.can_view
        FROM public.role_menu_access rma
        WHERE rma.menu_id = v_drug_menu_id
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = EXCLUDED.can_view;
    END IF;

    -- 5. Create "Inventory Catalog" parent under "Catalogs"
    DECLARE
        v_inv_parent_id uuid;
    BEGIN
        SELECT id INTO v_inv_parent_id FROM public.menus WHERE path = '/pharmacy/catalog/inventory-parent' LIMIT 1;
        
        IF v_inv_parent_id IS NULL THEN
            v_inv_parent_id := gen_random_uuid();
            INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
            VALUES (
                v_inv_parent_id,
                'Inventory Catalog',
                '/pharmacy/catalog/inventory-parent',
                'Package',
                v_catalogs_parent_id,
                1,
                true,
                v_pharmacy_dept_id,
                'inventory_catalog'
            );
        ELSE
            UPDATE public.menus SET parent_id = v_catalogs_parent_id, order_index = 1 WHERE id = v_inv_parent_id;
        END IF;

        -- Move Drug and Non-Drug under Inventory Catalog
        UPDATE public.menus SET parent_id = v_inv_parent_id, order_index = 1, label = 'Drug Catalog' WHERE path = '/pharmacy/catalog/drugs';
        UPDATE public.menus SET parent_id = v_inv_parent_id, order_index = 2, label = 'Non-Drug Catalog' WHERE path = '/pharmacy/catalog/non-drugs';

        -- Sync Permissions for Inventory Catalog Parent (based on Drug Catalog access)
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT rma.role_id, v_inv_parent_id, rma.can_view
        FROM public.role_menu_access rma, public.menus m
        WHERE rma.menu_id = m.id AND m.path = '/pharmacy/catalog/drugs'
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = EXCLUDED.can_view;
    END;

    -- 6. Final Rearrangement of all Catalog sub-menus
    UPDATE public.menus SET order_index = 1 WHERE path = '/pharmacy/catalog/inventory-parent';
    UPDATE public.menus SET order_index = 2 WHERE path = '/pharmacy/catalog/appl';
    UPDATE public.menus SET order_index = 3 WHERE path = '/pharmacy/catalog/contracts-parent';
    UPDATE public.menus SET order_index = 4 WHERE path = '/pharmacy/catalog/lp';
    UPDATE public.menus SET order_index = 5 WHERE path = '/pharmacy/catalog/reagents';
    UPDATE public.menus SET order_index = 6 WHERE path = '/pharmacy/catalog/suppliers';
    UPDATE public.menus SET order_index = 7 WHERE path = '/pharmacy/catalog/hospitals';
    UPDATE public.menus SET order_index = 8 WHERE path = '/pharmacy/catalog/clinics';

END $$;
