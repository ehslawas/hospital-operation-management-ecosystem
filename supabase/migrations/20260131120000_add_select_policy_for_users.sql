-- Allow authenticated users to view user records
-- This is required for dropdowns like "Responsible Person" to work correctly

CREATE POLICY "allow_authenticated_select_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "allow_authenticated_select_users" ON users IS
  'Allows authenticated users to view basic user information for dropdowns and lists';
