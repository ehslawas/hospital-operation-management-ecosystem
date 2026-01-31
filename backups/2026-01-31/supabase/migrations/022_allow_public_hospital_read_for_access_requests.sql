-- Migration: Allow public read access to active hospitals and departments for access requests
-- This allows unauthenticated users to see which hospitals and departments they can request access to

-- ============================================
-- 1. Hospitals Table - Public Read Access
-- ============================================

-- Policy: Allow anyone (including unauthenticated users) to view active hospitals
-- This is needed for the access request form where users need to select a hospital
CREATE POLICY "public_read_active_hospitals"
  ON hospitals
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Add comment
COMMENT ON POLICY "public_read_active_hospitals" ON hospitals IS 
  'Allows public read access to active hospitals for access request forms';

-- ============================================
-- 2. Departments Table - Public Read Access
-- ============================================

-- Enable RLS on departments if not already enabled
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (including unauthenticated users) to view active departments
-- This is needed for the access request form where users need to select a department
CREATE POLICY "public_read_active_departments"
  ON departments
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Add comment
COMMENT ON POLICY "public_read_active_departments" ON departments IS 
  'Allows public read access to active departments for access request forms';

