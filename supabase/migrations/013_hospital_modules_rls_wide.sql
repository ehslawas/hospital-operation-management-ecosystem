-- Hospital Modules RLS Fix
-- Some users are getting 406 Not Acceptable when querying hospital_modules.
-- This migration adds a broad read policy so all authenticated users can
-- read hospital_modules, while keeping existing more restrictive policies.

-- Ensure RLS is enabled
ALTER TABLE hospital_modules ENABLE ROW LEVEL SECURITY;

-- Drop existing broad read policy if it exists (idempotent)
DROP POLICY IF EXISTS "authenticated_read_hospital_modules" ON hospital_modules;

-- Allow all authenticated users to SELECT from hospital_modules.
-- This is safe because module configuration is not sensitive data,
-- and it simplifies UI logic (no 406 errors when checking module status).
CREATE POLICY "authenticated_read_hospital_modules"
  ON hospital_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep existing policies:
-- - "system_admin_full_access_hospital_modules" (ALL for system_admin)
-- - "hospital_admin_view_modules" (SELECT scoped to their hospital)


