-- Migration: Final fix for access_requests RLS - Allow anonymous inserts
-- This is a comprehensive fix that ensures the policy works correctly

-- Step 1: Drop ALL existing policies on access_requests to start fresh
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
  END LOOP;
END $$;

-- Step 2: Create the public insert policy FIRST (most permissive)
-- This MUST be created first and MUST include 'anon' role
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 3: Create admin policies for SELECT/UPDATE/DELETE (these won't affect INSERT)
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

-- Step 4: Service role policy (for admin operations)
CREATE POLICY "service_role_full_access_access_requests"
  ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Verify the public insert policy was created correctly
DO $$
DECLARE
  policy_count INTEGER;
  has_anon BOOLEAN;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests';
  
  -- Check if anon role exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'public_insert_access_requests'
      AND 'anon' = ANY(roles)
  ) INTO has_anon;
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'CRITICAL: Policy public_insert_access_requests was NOT created!';
  END IF;
  
  IF NOT has_anon THEN
    RAISE EXCEPTION 'CRITICAL: Policy exists but anon role is missing! Roles: %', 
      (SELECT array_agg(unnest(roles))::text FROM pg_policies 
       WHERE schemaname = 'public' 
         AND tablename = 'access_requests' 
         AND policyname = 'public_insert_access_requests');
  END IF;
  
  RAISE NOTICE 'SUCCESS: Policy created correctly with anon role';
END $$;

-- Add comments
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests - MUST include anon role';

