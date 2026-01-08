-- Migration: Ensure anonymous users can insert access requests
-- This fixes the RLS policy violation for unauthenticated users submitting access requests

-- Step 1: Drop ALL existing policies on access_requests to start completely fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'access_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON access_requests', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the public insert policy FIRST and MOST PERMISSIVE
-- This MUST allow both anon and authenticated roles
CREATE POLICY "allow_public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "allow_public_insert_access_requests" ON access_requests IS 
  'Allows anonymous and authenticated users to create access requests - required for public form submission';

-- Step 4: Create admin policies for SELECT/UPDATE/DELETE operations
-- These won't affect INSERT operations

-- System Admin full access
CREATE POLICY "system_admin_full_access_access_requests"
  ON access_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  );

-- Hospital Admin scope access (for their hospital only)
CREATE POLICY "hospital_admin_scope_access_requests"
  ON access_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
          AND users.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
          AND users.hospital_id = access_requests.hospital_id
          AND users.status = 'active'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
          AND users.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
          AND users.hospital_id = access_requests.hospital_id
          AND users.status = 'active'
      )
    )
  );

-- Service role full access (for backend operations)
CREATE POLICY "service_role_full_access_access_requests"
  ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Verify the policies were created correctly
DO $$
DECLARE
  policy_count INTEGER;
  insert_policy_exists BOOLEAN;
  has_anon_role BOOLEAN;
BEGIN
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'access_requests';
  
  -- Check if insert policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'allow_public_insert_access_requests'
      AND cmd = 'INSERT'
  ) INTO insert_policy_exists;
  
  -- Check if anon role is included in the insert policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'allow_public_insert_access_requests'
      AND 'anon' = ANY(roles)
  ) INTO has_anon_role;
  
  IF NOT insert_policy_exists THEN
    RAISE EXCEPTION 'CRITICAL: Insert policy was NOT created!';
  END IF;
  
  IF NOT has_anon_role THEN
    RAISE EXCEPTION 'CRITICAL: Insert policy exists but anon role is missing!';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Policies created correctly. Total policies: %, Insert policy: %, Has anon role: %', 
    policy_count, insert_policy_exists, has_anon_role;
END $$;

