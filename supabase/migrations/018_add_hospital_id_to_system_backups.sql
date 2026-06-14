-- Add hospital_id column to system_backups table
-- This allows backups to be associated with specific hospitals
-- System-wide backups can have NULL hospital_id

-- ============================================
-- 1. Add hospital_id column
-- ============================================
DO $$
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'system_backups' 
    AND column_name = 'hospital_id'
  ) THEN
    -- Add hospital_id column (nullable - allows system-wide backups)
    ALTER TABLE system_backups 
    ADD COLUMN hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_system_backups_hospital_id ON system_backups(hospital_id);
    
    RAISE NOTICE 'Added hospital_id column to system_backups table';
  ELSE
    RAISE NOTICE 'hospital_id column already exists in system_backups table';
  END IF;
END $$;

-- ============================================
-- 2. Update RLS Policies
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System Admin can manage all backups" ON system_backups;
DROP POLICY IF EXISTS "Hospital Admin can view backups for their hospital" ON system_backups;
DROP POLICY IF EXISTS "Users can view backups for their hospital" ON system_backups;

-- System Admin: Full access (can see all backups including system-wide)
CREATE POLICY "System Admin can manage all backups"
  ON system_backups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.role_code = 'system_admin'
    )
  );

-- Hospital Admin: Can view and manage backups for their hospital
CREATE POLICY "Hospital Admin can manage backups for their hospital"
  ON system_backups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.role_code = 'hospital_admin'
      AND (
        system_backups.hospital_id IS NULL 
        OR u.hospital_id = system_backups.hospital_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.role_code = 'hospital_admin'
      AND (
        system_backups.hospital_id IS NULL 
        OR u.hospital_id = system_backups.hospital_id
      )
    )
  );

-- Users: Can view backups for their hospital
CREATE POLICY "Users can view backups for their hospital"
  ON system_backups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        system_backups.hospital_id IS NULL 
        OR u.hospital_id = system_backups.hospital_id
      )
    )
  );

-- ============================================
-- 3. Comments
-- ============================================
COMMENT ON COLUMN system_backups.hospital_id IS 'Hospital ID for hospital-specific backups. NULL for system-wide backups.';





