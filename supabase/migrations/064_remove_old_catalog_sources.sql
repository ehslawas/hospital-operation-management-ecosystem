-- Migration: 064_remove_old_catalog_sources.sql
-- Removes legacy catalog source ambiguity (old MyWarrant Contract Catalog / Facility Catalog)
-- Establishes drugs, non_drugs, and facility_drug_inventory as the SINGLE SOURCE OF TRUTH
-- for all drug and non-drug management under the MyInventory module.

-- Ensure primary catalog tables have complete documentation & indexes
COMMENT ON TABLE drugs IS 'Primary Drug Inventory Catalog (Single Source of Truth under MyInventory)';
COMMENT ON TABLE non_drugs IS 'Primary Non-Drug Inventory Catalog (Single Source of Truth under MyInventory)';
COMMENT ON TABLE facility_drug_inventory IS 'Facility-specific Drug Inventory overrides (MyInventory)';

-- Clean up any obsolete uploaded_files tracking for old catalog imports if present
ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;

ALTER TABLE uploaded_files ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'inventory'));

-- Verify indexes on drugs and non_drugs for fast query execution in MyInventory
CREATE INDEX IF NOT EXISTS idx_drugs_vote_status ON drugs(hospital_id, procurement_vote, status);
CREATE INDEX IF NOT EXISTS idx_non_drugs_vote_status ON non_drugs(hospital_id, procurement_vote, status);
