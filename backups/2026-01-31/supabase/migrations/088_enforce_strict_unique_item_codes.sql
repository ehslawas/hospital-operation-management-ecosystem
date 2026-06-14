-- Migration: Enforce Strict Unique Item Codes and Clean Up Duplicates
-- Description: Reverts unique constraints to (hospital_id, item_code) and removes existing duplicates.
-- Date: 2026-01-15

-- =====================================================
-- PART 1: CLEAN UP DUPLICATES (Keeping only the latest)
-- =====================================================

-- 1. APPL Drugs
DELETE FROM public.appl_drugs a
WHERE a.id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY hospital_id, item_code ORDER BY updated_at DESC, created_at DESC) as row_num
        FROM public.appl_drugs
    ) s WHERE s.row_num = 1
);

-- 2. APPL Non-Drugs
DELETE FROM public.appl_non_drugs a
WHERE a.id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY hospital_id, item_code ORDER BY updated_at DESC, created_at DESC) as row_num
        FROM public.appl_non_drugs
    ) s WHERE s.row_num = 1
);

-- 3. LP Drugs
DELETE FROM public.lp_drugs a
WHERE a.id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY hospital_id, item_code ORDER BY updated_at DESC, created_at DESC) as row_num
        FROM public.lp_drugs
    ) s WHERE s.row_num = 1
);

-- 4. LP Non-Drugs
DELETE FROM public.lp_non_drugs a
WHERE a.id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY hospital_id, item_code ORDER BY updated_at DESC, created_at DESC) as row_num
        FROM public.lp_non_drugs
    ) s WHERE s.row_num = 1
);

-- =====================================================
-- PART 2: RESTORE UNIQUE CONSTRAINTS
-- =====================================================

-- 1. APPL Drugs
ALTER TABLE public.appl_drugs DROP CONSTRAINT IF EXISTS appl_drugs_hospital_item_code_price_unique;
ALTER TABLE public.appl_drugs DROP CONSTRAINT IF EXISTS appl_drugs_hospital_item_code_unique;
ALTER TABLE public.appl_drugs ADD CONSTRAINT appl_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code);

-- 2. APPL Non-Drugs
ALTER TABLE public.appl_non_drugs DROP CONSTRAINT IF EXISTS appl_non_drugs_hospital_item_code_price_unique;
ALTER TABLE public.appl_non_drugs DROP CONSTRAINT IF EXISTS appl_non_drugs_hospital_item_code_unique;
ALTER TABLE public.appl_non_drugs ADD CONSTRAINT appl_non_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code);

-- 3. LP Drugs
ALTER TABLE public.lp_drugs DROP CONSTRAINT IF EXISTS lp_drugs_hospital_item_code_price_unique;
ALTER TABLE public.lp_drugs DROP CONSTRAINT IF EXISTS lp_drugs_hospital_item_code_unique;
ALTER TABLE public.lp_drugs ADD CONSTRAINT lp_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code);

-- 4. LP Non-Drugs
ALTER TABLE public.lp_non_drugs DROP CONSTRAINT IF EXISTS lp_non_drugs_hospital_item_code_price_unique;
ALTER TABLE public.lp_non_drugs DROP CONSTRAINT IF EXISTS lp_non_drugs_hospital_item_code_unique;
ALTER TABLE public.lp_non_drugs ADD CONSTRAINT lp_non_drugs_hospital_item_code_unique UNIQUE (hospital_id, item_code);

-- Update comments
COMMENT ON CONSTRAINT appl_drugs_hospital_item_code_unique ON public.appl_drugs IS 'Enforces one row per item code per hospital';
COMMENT ON CONSTRAINT appl_non_drugs_hospital_item_code_unique ON public.appl_non_drugs IS 'Enforces one row per item code per hospital';
COMMENT ON CONSTRAINT lp_drugs_hospital_item_code_unique ON public.lp_drugs IS 'Enforces one row per item code per hospital';
COMMENT ON CONSTRAINT lp_non_drugs_hospital_item_code_unique ON public.lp_non_drugs IS 'Enforces one row per item code per hospital';
