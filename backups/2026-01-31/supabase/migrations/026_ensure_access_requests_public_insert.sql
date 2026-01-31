-- Migration: Ensure access_requests allows anonymous inserts
-- This fixes the RLS policy to allow unauthenticated users to submit access requests

-- Drop ALL existing insert policies on access_requests to avoid conflicts
DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON access_requests;

-- Create a single, clear policy that allows both anon and authenticated users
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify the policy was created (this will show an error if it fails, which is helpful)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests'
    AND roles::text LIKE '%anon%'
  ) THEN
    RAISE EXCEPTION 'Policy creation failed - anon role not found in policy';
  END IF;
END $$;

-- Add comment
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests';

