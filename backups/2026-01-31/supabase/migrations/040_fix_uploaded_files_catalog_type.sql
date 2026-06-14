-- Migration: Fix uploaded_files catalog_type constraint to include 'contract'
-- Quick fix to allow contract catalog type in uploaded_files table
-- This is a standalone migration that can be run immediately

-- Drop the old constraint
ALTER TABLE uploaded_files 
  DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;

-- Add the new constraint that includes 'contract'
ALTER TABLE uploaded_files 
  ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'contract'));

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✓ Updated uploaded_files catalog_type constraint to include contract';
END $$;
