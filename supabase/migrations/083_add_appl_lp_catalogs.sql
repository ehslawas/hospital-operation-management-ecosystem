-- Migration: Add APPL and LP Catalog Tables and Menus
-- Description: Creates catalog tables for APPL and LP items (Drugs and Non-Drugs) with AI-powered Excel import support
-- Date: 2026-01-14

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- APPL Drugs Catalog Table
CREATE TABLE IF NOT EXISTS public.appl_drugs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_code text NOT NULL,
    item_name text NOT NULL,
    packaging_description text,
    price numeric(10, 2),
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    
    -- Unique constraint: item_code must be unique per hospital
    CONSTRAINT appl_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code)
);

-- APPL Non-Drugs Catalog Table
CREATE TABLE IF NOT EXISTS public.appl_non_drugs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_code text NOT NULL,
    item_name text NOT NULL,
    packaging_description text,
    price numeric(10, 2),
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    
    CONSTRAINT appl_non_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code)
);

-- LP Drugs Catalog Table
CREATE TABLE IF NOT EXISTS public.lp_drugs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_code text NOT NULL,
    item_name text NOT NULL,
    packaging_description text,
    price numeric(10, 2),
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    
    CONSTRAINT lp_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code)
);

-- LP Non-Drugs Catalog Table
CREATE TABLE IF NOT EXISTS public.lp_non_drugs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_code text NOT NULL,
    item_name text NOT NULL,
    packaging_description text,
    price numeric(10, 2),
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    
    CONSTRAINT lp_non_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code)
);

-- =====================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- APPL Drugs Indexes
CREATE INDEX IF NOT EXISTS idx_appl_drugs_hospital_id ON public.appl_drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appl_drugs_item_code ON public.appl_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_appl_drugs_item_name ON public.appl_drugs(item_name);
CREATE INDEX IF NOT EXISTS idx_appl_drugs_status ON public.appl_drugs(status);

-- APPL Non-Drugs Indexes
CREATE INDEX IF NOT EXISTS idx_appl_non_drugs_hospital_id ON public.appl_non_drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appl_non_drugs_item_code ON public.appl_non_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_appl_non_drugs_item_name ON public.appl_non_drugs(item_name);
CREATE INDEX IF NOT EXISTS idx_appl_non_drugs_status ON public.appl_non_drugs(status);

-- LP Drugs Indexes
CREATE INDEX IF NOT EXISTS idx_lp_drugs_hospital_id ON public.lp_drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lp_drugs_item_code ON public.lp_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_lp_drugs_item_name ON public.lp_drugs(item_name);
CREATE INDEX IF NOT EXISTS idx_lp_drugs_status ON public.lp_drugs(status);

-- LP Non-Drugs Indexes
CREATE INDEX IF NOT EXISTS idx_lp_non_drugs_hospital_id ON public.lp_non_drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lp_non_drugs_item_code ON public.lp_non_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_lp_non_drugs_item_name ON public.lp_non_drugs(item_name);
CREATE INDEX IF NOT EXISTS idx_lp_non_drugs_status ON public.lp_non_drugs(status);

-- =====================================================
-- PART 3: ADD MENU ENTRIES
-- =====================================================

DO $$
DECLARE
    pharmacy_dept_id uuid;
    appl_catalog_parent_id uuid;
    lp_catalog_parent_id uuid;
BEGIN
    -- Get Pharmacy Logistics Department ID
    SELECT id INTO pharmacy_dept_id 
    FROM public.departments 
    WHERE department_code = 'PHARMACY_LOGISTICS';

    IF pharmacy_dept_id IS NOT NULL THEN
        
        -- =====================================================
        -- APPL CATALOG MENU STRUCTURE
        -- =====================================================
        
        -- Insert APPL Catalog Parent Menu
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'APPL Catalog', '/pharmacy/catalog/appl', 'Package', NULL, 4, true, pharmacy_dept_id, 'appl_catalog')
        ON CONFLICT (path) DO NOTHING
        RETURNING id INTO appl_catalog_parent_id;

        -- If APPL Catalog already exists, get its ID
        IF appl_catalog_parent_id IS NULL THEN
            SELECT id INTO appl_catalog_parent_id FROM public.menus WHERE path = '/pharmacy/catalog/appl';
        END IF;

        -- Insert APPL Catalog Submenus
        IF appl_catalog_parent_id IS NOT NULL THEN
            -- APPL Drugs Submenu
            INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
            VALUES (gen_random_uuid(), 'APPL Drugs', '/pharmacy/catalog/appl-drugs', 'Pill', appl_catalog_parent_id, 1, true, pharmacy_dept_id, 'appl_drugs')
            ON CONFLICT (path) DO NOTHING;

            -- APPL Non-Drugs Submenu
            INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
            VALUES (gen_random_uuid(), 'APPL Non-Drugs', '/pharmacy/catalog/appl-non-drugs', 'Box', appl_catalog_parent_id, 2, true, pharmacy_dept_id, 'appl_non_drugs')
            ON CONFLICT (path) DO NOTHING;
        END IF;

        -- =====================================================
        -- LP CATALOG MENU STRUCTURE
        -- =====================================================
        
        -- Insert LP Catalog Parent Menu
        INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (gen_random_uuid(), 'LP Catalog', '/pharmacy/catalog/lp', 'Package', NULL, 5, true, pharmacy_dept_id, 'lp_catalog')
        ON CONFLICT (path) DO NOTHING
        RETURNING id INTO lp_catalog_parent_id;

        -- If LP Catalog already exists, get its ID
        IF lp_catalog_parent_id IS NULL THEN
            SELECT id INTO lp_catalog_parent_id FROM public.menus WHERE path = '/pharmacy/catalog/lp';
        END IF;

        -- Insert LP Catalog Submenus
        IF lp_catalog_parent_id IS NOT NULL THEN
            -- LP Drugs Submenu
            INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
            VALUES (gen_random_uuid(), 'LP Drugs', '/pharmacy/catalog/lp-drugs', 'Pill', lp_catalog_parent_id, 1, true, pharmacy_dept_id, 'lp_drugs')
            ON CONFLICT (path) DO NOTHING;

            -- LP Non-Drugs Submenu
            INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
            VALUES (gen_random_uuid(), 'LP Non-Drugs', '/pharmacy/catalog/lp-non-drugs', 'Box', lp_catalog_parent_id, 2, true, pharmacy_dept_id, 'lp_non_drugs')
            ON CONFLICT (path) DO NOTHING;
        END IF;

    ELSE
        RAISE NOTICE 'Pharmacy Logistics department not found. Menu entries not created.';
    END IF;

END $$;

-- =====================================================
-- PART 4: ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.appl_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appl_non_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_non_drugs ENABLE ROW LEVEL SECURITY;

-- APPL Drugs Policies
CREATE POLICY "Users can view APPL drugs from their hospital"
    ON public.appl_drugs FOR SELECT
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert APPL drugs to their hospital"
    ON public.appl_drugs FOR INSERT
    WITH CHECK (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update APPL drugs from their hospital"
    ON public.appl_drugs FOR UPDATE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete APPL drugs from their hospital"
    ON public.appl_drugs FOR DELETE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

-- APPL Non-Drugs Policies
CREATE POLICY "Users can view APPL non-drugs from their hospital"
    ON public.appl_non_drugs FOR SELECT
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert APPL non-drugs to their hospital"
    ON public.appl_non_drugs FOR INSERT
    WITH CHECK (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update APPL non-drugs from their hospital"
    ON public.appl_non_drugs FOR UPDATE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete APPL non-drugs from their hospital"
    ON public.appl_non_drugs FOR DELETE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

-- LP Drugs Policies
CREATE POLICY "Users can view LP drugs from their hospital"
    ON public.lp_drugs FOR SELECT
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert LP drugs to their hospital"
    ON public.lp_drugs FOR INSERT
    WITH CHECK (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update LP drugs from their hospital"
    ON public.lp_drugs FOR UPDATE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete LP drugs from their hospital"
    ON public.lp_drugs FOR DELETE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

-- LP Non-Drugs Policies
CREATE POLICY "Users can view LP non-drugs from their hospital"
    ON public.lp_non_drugs FOR SELECT
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert LP non-drugs to their hospital"
    ON public.lp_non_drugs FOR INSERT
    WITH CHECK (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update LP non-drugs from their hospital"
    ON public.lp_non_drugs FOR UPDATE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete LP non-drugs from their hospital"
    ON public.lp_non_drugs FOR DELETE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

-- =====================================================
-- PART 5: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.appl_drugs IS 'APPL Catalog - Drug items with AI-powered Excel import support';
COMMENT ON TABLE public.appl_non_drugs IS 'APPL Catalog - Non-drug items with AI-powered Excel import support';
COMMENT ON TABLE public.lp_drugs IS 'LP Catalog - Drug items with AI-powered Excel import support';
COMMENT ON TABLE public.lp_non_drugs IS 'LP Catalog - Non-drug items with AI-powered Excel import support';

COMMENT ON COLUMN public.appl_drugs.item_code IS 'Unique item code per hospital (maps to "item code" or "kod item" in Excel)';
COMMENT ON COLUMN public.appl_drugs.item_name IS 'Item name (maps to "item nama" or "item name" in Excel)';
COMMENT ON COLUMN public.appl_drugs.packaging_description IS 'Packaging description (maps to "deskripsi pembungkusan" in Excel)';
COMMENT ON COLUMN public.appl_drugs.price IS 'Item price in RM (maps to "Harga (RM)" in Excel)';
COMMENT ON COLUMN public.appl_drugs.notes IS 'Additional notes (maps to "catatan" in Excel)';
