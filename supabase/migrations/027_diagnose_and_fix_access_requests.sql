-- Migration: Diagnose and fix access_requests RLS policy issue
-- This will check existing policies and create the correct one

-- First, let's see what policies exist
-- (This is just for reference - you can run this separately to check)
-- SELECT policyname, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'access_requests';

-- Drop ALL existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON access_requests;

-- IMPORTANT: Create the policy with explicit role specification
-- Make sure 'anon' is included in the roles
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify it was created (this query will show if it worked)
DO $$
DECLARE
  policy_exists BOOLEAN;
  has_anon_role BOOLEAN;
BEGIN
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests'
  ) INTO policy_exists;
  
  -- Check if anon role is in the policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests'
    AND 'anon' = ANY(roles)
  ) INTO has_anon_role;
  
  IF NOT policy_exists THEN
    RAISE EXCEPTION 'Policy was not created!';
  END IF;
  
  IF NOT has_anon_role THEN
    RAISE EXCEPTION 'Policy exists but anon role is missing!';
  END IF;
  
  RAISE NOTICE 'Policy created successfully with anon role';
END $$;

-- Add comment
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests';

