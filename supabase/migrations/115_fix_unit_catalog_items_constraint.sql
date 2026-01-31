-- Migration: Fix Unit Catalog Items Check Constraint
-- Description: Relax the check constraint to allow drug_id/non_drug_id to be NULL 
--              when item has an external source (contract_id, appl_item_id, or lp_item_id)
-- Date: 2026-01-31

-- Drop the existing constraint
ALTER TABLE public.pharmacy_unit_catalog_items 
DROP CONSTRAINT IF EXISTS check_item_type_drug;

-- Add the new relaxed constraint
-- For drug items: drug_id can be NULL if there's a contract_id, appl_item_id, or lp_item_id
-- For non_drug items: non_drug_id can be NULL if there's a contract_id, appl_item_id, or lp_item_id
ALTER TABLE public.pharmacy_unit_catalog_items 
ADD CONSTRAINT check_item_type_drug CHECK (
  (item_type = 'drug' AND (
    drug_id IS NOT NULL 
    OR contract_id IS NOT NULL 
    OR appl_item_id IS NOT NULL 
    OR lp_item_id IS NOT NULL
  ))
  OR
  (item_type = 'non_drug' AND (
    non_drug_id IS NOT NULL 
    OR contract_id IS NOT NULL 
    OR appl_item_id IS NOT NULL 
    OR lp_item_id IS NOT NULL
  ))
);

COMMENT ON CONSTRAINT check_item_type_drug ON public.pharmacy_unit_catalog_items IS 
'Ensures that drug items have either a drug_id or an external source (contract/appl/lp), and non_drug items have either a non_drug_id or an external source';
