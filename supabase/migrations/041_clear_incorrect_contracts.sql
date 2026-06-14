-- Migration: Clear Incorrect Contracts
-- This migration provides SQL to clear incorrect contract data if needed
-- Run this manually after reviewing the data, or use the DELETE statement below

-- ============================================
-- OPTION 1: Clear ALL contracts for a hospital
-- ============================================
-- Replace 'YOUR_HOSPITAL_ID' with actual hospital ID before running
-- Uncomment and run:
/*
DELETE FROM contracts 
WHERE hospital_id = 'YOUR_HOSPITAL_ID';
*/

-- ============================================
-- OPTION 2: Clear contracts with missing critical fields
-- ============================================
-- This will only delete contracts that are clearly wrong (missing item_name or contract_number)
/*
DELETE FROM contracts 
WHERE hospital_id = 'YOUR_HOSPITAL_ID'
  AND (
    item_name IS NULL 
    OR item_name = '' 
    OR contract_number IS NULL 
    OR contract_number = ''
    OR item_name LIKE '%,,%'  -- Likely misaligned data
    OR contract_number LIKE '%,,%'  -- Likely misaligned data
  );
*/

-- ============================================
-- OPTION 3: Find and review incorrect contracts
-- ============================================
-- Run this first to see what needs to be fixed:
/*
SELECT 
  id,
  item_name,
  contract_number,
  start_date,
  end_date,
  supplier_name,
  unit,
  unit_price,
  status
FROM contracts
WHERE hospital_id = 'YOUR_HOSPITAL_ID'
  AND (
    item_name IS NULL 
    OR item_name = '' 
    OR contract_number IS NULL 
    OR contract_number = ''
    OR item_name LIKE '%,,%'
    OR contract_number LIKE '%,,%'
  )
ORDER BY created_at DESC;
*/

-- ============================================
-- Migration Note
-- ============================================
-- This migration is optional and provides cleanup utilities
-- It does NOT automatically delete any data - you must uncomment and run manually

