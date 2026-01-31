-- Migration: Allow public read access to hospital modules
-- Description: Allows unauthenticated users to see enabled modules to filter departments in access request flow

-- Enable RLS on hospital_modules if not already enabled
ALTER TABLE hospital_modules ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (including unauthenticated users) to view enabled modules
CREATE POLICY "public_read_enabled_hospital_modules"
  ON hospital_modules
  FOR SELECT
  TO anon, authenticated
  USING (is_enabled = true);

-- Add comment
COMMENT ON POLICY "public_read_enabled_hospital_modules" ON hospital_modules IS 
  'Allows public read access to enabled modules for access request department filtering';
