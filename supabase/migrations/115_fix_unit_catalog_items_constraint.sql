-- Migration: Fix Unit Catalog Items Check Constraint
-- Description: Relax the check constraint to allow drug_id/non_drug_id to be NULL
--              when item has an external source (contract_id, appl_item_id, or lp_item_id).

ALTER TABLE pharmacy_unit_catalog_items 
DROP CONSTRAINT IF EXISTS check_item_source;

ALTER TABLE pharmacy_unit_catalog_items
ADD CONSTRAINT check_item_source 
CHECK (
  (drug_id IS NOT NULL) OR 
  (non_drug_id IS NOT NULL) OR 
  (contract_id IS NOT NULL) OR 
  (appl_item_id IS NOT NULL) OR 
  (lp_item_id IS NOT NULL)
);

COMMENT ON CONSTRAINT check_item_source ON pharmacy_unit_catalog_items 
IS 'Ensures item has either a drug_id, a non_drug_id or an external source (contract/appl/lp).';
