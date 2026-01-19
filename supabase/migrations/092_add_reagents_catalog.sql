-- Migration: Add Reagents Catalog Table
-- Description: Creates a dedicated table for laboratory reagents and testing supplies
-- Date: 2026-01-17

-- =====================================================
-- PART 1: CREATE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reagents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_code text NOT NULL,
    item_name text NOT NULL,
    packaging_description text,
    price numeric(10, 2),
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    category_id uuid REFERENCES public.non_drug_categories(id),
    supplier_id uuid REFERENCES public.suppliers(id),
    procurement_vote text CHECK (procurement_vote IN ('appl', 'cc', 'dp', 'lp')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    
    -- Unique constraint: item_code must be unique per hospital
    CONSTRAINT reagents_hospital_item_code_unique UNIQUE (hospital_id, item_code)
);

-- =====================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reagents_hospital_id ON public.reagents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_reagents_item_code ON public.reagents(item_code);
CREATE INDEX IF NOT EXISTS idx_reagents_item_name ON public.reagents(item_name);
CREATE INDEX IF NOT EXISTS idx_reagents_status ON public.reagents(status);

-- =====================================================
-- PART 3: ROW-LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.reagents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reagents from their hospital"
    ON public.reagents FOR SELECT
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert reagents to their hospital"
    ON public.reagents FOR INSERT
    WITH CHECK (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update reagents from their hospital"
    ON public.reagents FOR UPDATE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete reagents from their hospital"
    ON public.reagents FOR DELETE
    USING (hospital_id IN (
        SELECT hospital_id FROM public.users WHERE id = auth.uid()
    ));

-- =====================================================
-- PART 4: COMMENTS
-- =====================================================

COMMENT ON TABLE public.reagents IS 'Reagents Catalog - Laboratory reagents and testing supplies';
COMMENT ON COLUMN public.reagents.item_code IS 'Unique reagent code per hospital';
COMMENT ON COLUMN public.reagents.item_name IS 'Reagent/Testing supply name';
