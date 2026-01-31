-- Migration: Fix access_requests RLS policy to allow anonymous users to insert
-- The access request form should be accessible to unauthenticated users

-- Drop the existing policy
DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;

-- Create new policy that allows both authenticated and anonymous users to insert
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests';

