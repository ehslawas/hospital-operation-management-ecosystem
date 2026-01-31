-- Add hospital_id column to system_backups table
-- This allows backups to be associated with specific hospitals
-- System-wide backups can have NULL hospital_id

-- ============================================
-- 1. Add hospital_id column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'system_backups'
        AND column_name = 'hospital_id'
    ) THEN
        ALTER TABLE system_backups ADD COLUMN hospital_id UUID REFERENCES hospitals(id);
        COMMENT ON COLUMN system_backups.hospital_id IS 'Associated hospital for the backup. NULL for system-wide backups.';
    END IF;
END $$;

-- ============================================
-- 2. Update RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view backups for their hospital" ON system_backups;
CREATE POLICY "Users can view backups for their hospital"
  ON system_backups
  FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    OR
    (SELECT role_code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = auth.uid()) = 'system_admin'
  );

DROP POLICY IF EXISTS "System Admin can manage all backups" ON system_backups;
CREATE POLICY "System Admin can manage all backups"
  ON system_backups
  FOR ALL
  TO authenticated
  USING (
    (SELECT role_code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = auth.uid()) = 'system_admin'
  );
