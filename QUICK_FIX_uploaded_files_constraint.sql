-- =====================================================
-- QUICK FIX: Update uploaded_files catalog_type constraint
-- Run this SQL in Supabase SQL Editor to fix the issue immediately
-- =====================================================

-- Step 1: Drop the old constraint
ALTER TABLE uploaded_files 
  DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;

-- Step 2: Add the new constraint that includes 'contract'
ALTER TABLE uploaded_files 
  ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'contract'));

-- Verify it worked (this should return 0 rows if the constraint is correct)
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'uploaded_files'::regclass
  AND conname = 'uploaded_files_catalog_type_check';
