-- Audit Logs Table
-- This table tracks all system actions for audit and compliance purposes

-- ============================================
-- 1. Create audit_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for common queries (user + module + date)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_module_date 
  ON audit_logs(user_id, module, created_at DESC);

-- ============================================
-- 3. Add updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER update_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS Policies (if RLS is enabled)
-- ============================================

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "system_admin_full_access_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "hospital_admin_view_hospital_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "authenticated_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "service_role_full_access_audit_logs" ON audit_logs;

-- Policy: System Admin can view all audit logs
CREATE POLICY "system_admin_full_access_audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin' LIMIT 1)
        AND users.status = 'active'
    )
  );

-- Policy: Hospital Admin can view audit logs for their hospital
CREATE POLICY "hospital_admin_view_hospital_audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin' LIMIT 1)
        AND u.status = 'active'
        AND (
          -- If entity_id is a user_id, check if that user belongs to same hospital
          (audit_logs.entity_type = 'user' AND EXISTS (
            SELECT 1 FROM users target_user
            WHERE target_user.id::TEXT = audit_logs.entity_id
              AND target_user.hospital_id = u.hospital_id
          ))
          OR
          -- If entity_id is a hospital_id, check if it matches
          (audit_logs.entity_type = 'hospital' AND audit_logs.entity_id = u.hospital_id::TEXT)
          OR
          -- If user_id matches a user in same hospital
          EXISTS (
            SELECT 1 FROM users target_user
            WHERE target_user.id = audit_logs.user_id
              AND target_user.hospital_id = u.hospital_id
          )
        )
    )
  );

-- Policy: Users can view their own audit logs (only if user_id is not null)
CREATE POLICY "users_view_own_audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Policy: Allow inserts (for system logging)
-- All authenticated users can insert audit logs (the application will log actions)
CREATE POLICY "authenticated_insert_audit_logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Service role has full access
CREATE POLICY "service_role_full_access_audit_logs"
  ON audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Verification
-- ============================================

-- Verify table was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) THEN
    RAISE EXCEPTION 'Failed to create audit_logs table';
  END IF;
  
  RAISE NOTICE 'audit_logs table created successfully';
END $$;

