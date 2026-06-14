-- Migration: Refactor APPL/LP columns in Unit Catalog Items
-- Description: Renames appl_item_id -> appl_drug_id (and LP) and adds non_drug_id columns to support foreign keys correctly.
-- Date: 2026-01-31

-- 1. Rename existing columns (assuming they contain Drug IDs or are empty)
ALTER TABLE public.pharmacy_unit_catalog_items 
RENAME COLUMN appl_item_id TO appl_drug_id;

ALTER TABLE public.pharmacy_unit_catalog_items 
RENAME COLUMN lp_item_id TO lp_drug_id;

-- 2. Add new columns for Non-Drugs with correct Foreign Keys
ALTER TABLE public.pharmacy_unit_catalog_items 
ADD COLUMN appl_non_drug_id uuid REFERENCES public.appl_non_drugs(id),
ADD COLUMN lp_non_drug_id uuid REFERENCES public.lp_non_drugs(id);

-- 3. Rename existing FK constraints for consistency
-- Note: Requires checking if constraints exist, but we assume they do from previous steps.
ALTER TABLE public.pharmacy_unit_catalog_items
RENAME CONSTRAINT pharmacy_unit_catalog_items_appl_item_id_fkey TO pharmacy_unit_catalog_items_appl_drug_id_fkey;

ALTER TABLE public.pharmacy_unit_catalog_items
RENAME CONSTRAINT pharmacy_unit_catalog_items_lp_item_id_fkey TO pharmacy_unit_catalog_items_lp_drug_id_fkey;

-- 4. Update the Check Constraint
ALTER TABLE public.pharmacy_unit_catalog_items 
DROP CONSTRAINT check_item_type_drug;

ALTER TABLE public.pharmacy_unit_catalog_items 
ADD CONSTRAINT check_item_type_drug CHECK (
  (item_type = 'drug' AND (
    drug_id IS NOT NULL 
    OR contract_id IS NOT NULL 
    OR appl_drug_id IS NOT NULL 
    OR lp_drug_id IS NOT NULL
  ))
  OR
  (item_type = 'non_drug' AND (
    non_drug_id IS NOT NULL 
    OR contract_id IS NOT NULL 
    OR appl_non_drug_id IS NOT NULL 
    OR lp_non_drug_id IS NOT NULL
  ))
);

COMMENT ON CONSTRAINT check_item_type_drug ON public.pharmacy_unit_catalog_items IS 'Ensures items have a valid source ID corresponding to their type (Drug vs Non-Drug).';
