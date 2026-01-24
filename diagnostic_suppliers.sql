-- Diagnostic SQL: Check suppliers table RLS and policies
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if RLS is enabled on suppliers table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'suppliers';

-- 2. Check all policies on suppliers table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'suppliers';

-- 3. Check if there are any constraints that might be causing delays
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'suppliers'::regclass;

-- 4. Check for triggers on suppliers table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'suppliers';

-- 5. Try a manual insert to see if it works
-- IMPORTANT: Replace with your actual hospital_id
INSERT INTO suppliers (
  hospital_id,
  supplier_code,
  company_name,
  status,
  supplier_type
) VALUES (
  '85bb6adc-b868-428b-83f4-e5af2f5cf904',
  'TEST-DIAG-001',
  'Test Diagnostic Supplier',
  'active',
  'both'
)
RETURNING *;

-- 6. Clean up test record
DELETE FROM suppliers WHERE supplier_code = 'TEST-DIAG-001';
