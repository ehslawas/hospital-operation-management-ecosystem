-- Migration: Allow Duplicate Catalog Items with Different Prices
-- Description: Updates unique constraints for APPL and LP catalog tables to include price in the uniqueness check.
-- Date: 2026-01-15

-- 1. APPL Drugs
ALTER TABLE public.appl_drugs DROP CONSTRAINT IF EXISTS appl_drugs_hospital_item_code_unique;
ALTER TABLE public.appl_drugs DROP CONSTRAINT IF EXISTS appl_drugs_hospital_item_code_price_unique;
ALTER TABLE public.appl_drugs ADD CONSTRAINT appl_drugs_hospital_item_code_price_unique UNIQUE (hospital_id, item_code, price);

-- 2. APPL Non-Drugs
ALTER TABLE public.appl_non_drugs DROP CONSTRAINT IF EXISTS appl_non_drugs_hospital_item_code_unique;
ALTER TABLE public.appl_non_drugs DROP CONSTRAINT IF EXISTS appl_non_drugs_hospital_item_code_price_unique;
ALTER TABLE public.appl_non_drugs ADD CONSTRAINT appl_non_drugs_hospital_item_code_price_unique UNIQUE (hospital_id, item_code, price);

-- 3. LP Drugs
ALTER TABLE public.lp_drugs DROP CONSTRAINT IF EXISTS lp_drugs_hospital_item_code_unique;
ALTER TABLE public.lp_drugs DROP CONSTRAINT IF EXISTS lp_drugs_hospital_item_code_price_unique;
ALTER TABLE public.lp_drugs ADD CONSTRAINT lp_drugs_hospital_item_code_price_unique UNIQUE (hospital_id, item_code, price);

-- 4. LP Non-Drugs
ALTER TABLE public.lp_non_drugs DROP CONSTRAINT IF EXISTS lp_non_drugs_hospital_item_code_unique;
ALTER TABLE public.lp_non_drugs DROP CONSTRAINT IF EXISTS lp_non_drugs_hospital_item_code_price_unique;
ALTER TABLE public.lp_non_drugs ADD CONSTRAINT lp_non_drugs_hospital_item_code_price_unique UNIQUE (hospital_id, item_code, price);

-- Add comments for documentation
COMMENT ON CONSTRAINT appl_drugs_hospital_item_code_price_unique ON public.appl_drugs IS 'Allows same item code with different prices per hospital';
COMMENT ON CONSTRAINT appl_non_drugs_hospital_item_code_price_unique ON public.appl_non_drugs IS 'Allows same item code with different prices per hospital';
COMMENT ON CONSTRAINT lp_drugs_hospital_item_code_price_unique ON public.lp_drugs IS 'Allows same item code with different prices per hospital';
COMMENT ON CONSTRAINT lp_non_drugs_hospital_item_code_price_unique ON public.lp_non_drugs IS 'Allows same item code with different prices per hospital';
