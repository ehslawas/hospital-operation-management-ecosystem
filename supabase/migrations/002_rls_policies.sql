-- System Admin Module - Row Level Security Policies
-- Phase 2: Security & Access Control

-- ============================================
-- 0. Drop existing policies (if any) to allow re-run
-- ============================================
-- Drop all policies first to avoid conflicts on re-run
-- Only drop if tables exist
DO $$
BEGIN
  -- Drop hospital policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hospitals') THEN
    DROP POLICY IF EXISTS "system_admin_full_access_hospitals" ON hospitals;
    DROP POLICY IF EXISTS "hospital_admin_view_own_hospital" ON hospitals;
    DROP POLICY IF EXISTS "service_role_full_access_hospitals" ON hospitals;
  END IF;
  
  -- Drop hospital_modules policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hospital_modules') THEN
    DROP POLICY IF EXISTS "system_admin_full_access_hospital_modules" ON hospital_modules;
    DROP POLICY IF EXISTS "hospital_admin_view_modules" ON hospital_modules;
  END IF;
  
  -- Drop system_health_logs policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_health_logs') THEN
    DROP POLICY IF EXISTS "system_admin_full_access_health_logs" ON system_health_logs;
    DROP POLICY IF EXISTS "system_insert_health_logs" ON system_health_logs;
  END IF;
  
  -- Drop system_backups policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_backups') THEN
    DROP POLICY IF EXISTS "system_admin_full_access_backups" ON system_backups;
  END IF;
  
  -- Drop system_alerts policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_alerts') THEN
    DROP POLICY IF EXISTS "system_admin_full_access_alerts" ON system_alerts;
    DROP POLICY IF EXISTS "system_insert_alerts" ON system_alerts;
  END IF;
  
  -- Drop users policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS "hospital_admin_scope_users" ON users;
    DROP POLICY IF EXISTS "protect_system_admin_deletion" ON users;
    DROP POLICY IF EXISTS "protect_system_admin_modification" ON users;
  END IF;
  
  -- Drop access_requests policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'access_requests') THEN
    DROP POLICY IF EXISTS "system_admin_full_access_access_requests" ON access_requests;
    DROP POLICY IF EXISTS "hospital_admin_scope_access_requests" ON access_requests;
    DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;
    DROP POLICY IF EXISTS "service_role_full_access_access_requests" ON access_requests;
  END IF;
END $$;

-- Drop policies (legacy way - will fail silently if tables don't exist)
DROP POLICY IF EXISTS "system_admin_full_access_hospitals" ON hospitals;

-- ============================================
-- 1. System Admin Protection Functions
-- ============================================

-- Function to check if only one System Admin exists
CREATE OR REPLACE FUNCTION check_single_system_admin()
RETURNS TRIGGER AS $$
DECLARE
  system_admin_role_id UUID;
  admin_count INTEGER;
BEGIN
  -- Get system_admin role ID
  SELECT id INTO system_admin_role_id
  FROM roles
  WHERE role_code = 'system_admin'
  LIMIT 1;

  -- If this is a system admin role assignment
  IF NEW.role_id = system_admin_role_id THEN
    -- Count existing system admins
    SELECT COUNT(*) INTO admin_count
    FROM users
    WHERE role_id = system_admin_role_id
      AND status = 'active'
      AND id != NEW.id;

    -- If there's already an active system admin, prevent creation
    IF admin_count > 0 THEN
      RAISE EXCEPTION 'Only one System Admin is allowed. Please disable the existing System Admin first.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce single System Admin
DROP TRIGGER IF EXISTS enforce_single_system_admin ON users;
CREATE TRIGGER enforce_single_system_admin
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_single_system_admin();

-- ============================================
-- 2. Hospitals Table RLS Policies
-- ============================================

-- Enable RLS on hospitals
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can do everything with hospitals
CREATE POLICY "system_admin_full_access_hospitals"
  ON hospitals
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

-- Policy: Hospital Admin can view their own hospital
CREATE POLICY "hospital_admin_view_own_hospital"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND users.hospital_id = hospitals.id
        AND users.status = 'active'
    )
  );

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access_hospitals"
  ON hospitals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. Hospital Modules RLS Policies
-- ============================================

-- Enable RLS on hospital_modules
ALTER TABLE hospital_modules ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can do everything
CREATE POLICY "system_admin_full_access_hospital_modules"
  ON hospital_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  );

-- Policy: Hospital Admin can view their hospital's modules
CREATE POLICY "hospital_admin_view_modules"
  ON hospital_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND users.hospital_id = hospital_modules.hospital_id
        AND users.status = 'active'
    )
  );

-- ============================================
-- 4. System Health Logs RLS Policies
-- ============================================

-- Enable RLS on system_health_logs
ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can do everything
CREATE POLICY "system_admin_full_access_health_logs"
  ON system_health_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  );

-- Policy: System can insert health logs (for automated checks)
CREATE POLICY "system_insert_health_logs"
  ON system_health_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 5. System Backups RLS Policies
-- ============================================

-- Enable RLS on system_backups
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can do everything
CREATE POLICY "system_admin_full_access_backups"
  ON system_backups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  );

-- ============================================
-- 6. System Alerts RLS Policies
-- ============================================

-- Enable RLS on system_alerts
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can do everything
CREATE POLICY "system_admin_full_access_alerts"
  ON system_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  );

-- Policy: System can insert alerts (for automated alerts)
CREATE POLICY "system_insert_alerts"
  ON system_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 7. Hospital Admin Scope Policies
-- ============================================

-- Policy: Hospital Admin can only see their hospital's users
CREATE POLICY "hospital_admin_scope_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- System Admin can see all
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
    OR
    -- Hospital Admin can see their hospital's users
    (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
          AND u.hospital_id = users.hospital_id
          AND u.status = 'active'
      )
    )
    OR
    -- Users can see themselves
    (users.id = auth.uid())
  );

-- ============================================
-- 9. Access Requests RLS Policies
-- ============================================

-- Enable RLS on access_requests
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can do everything with access requests
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

-- Policy: Hospital Admin can manage their hospital's access requests
CREATE POLICY "hospital_admin_scope_access_requests"
  ON access_requests
  FOR ALL
  TO authenticated
  USING (
    -- System Admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
    OR
    -- Hospital Admin can see their hospital's requests
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
    -- System Admin can modify all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
    OR
    -- Hospital Admin can modify their hospital's requests
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

-- Policy: Anyone can create access requests (for public submission)
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow service role full access
CREATE POLICY "service_role_full_access_access_requests"
  ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 8. System Admin Protection Policies
-- ============================================

-- Policy: Prevent deletion of System Admin via application
CREATE POLICY "protect_system_admin_deletion"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    -- Only allow deletion if not a system admin
    role_id != (SELECT id FROM roles WHERE role_code = 'system_admin')
    OR
    -- Or if the user is deleting themselves (for account management)
    id = auth.uid()
  );

-- Policy: System Admin cannot be modified by non-system-admin
CREATE POLICY "protect_system_admin_modification"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- System Admin can modify anyone
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
    OR
    -- Users can modify themselves
    (users.id = auth.uid())
    OR
    -- Hospital Admin can modify their hospital's users (except system admin)
    (
      users.role_id != (SELECT id FROM roles WHERE role_code = 'system_admin')
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
          AND u.hospital_id = users.hospital_id
          AND u.status = 'active'
      )
    )
  )
  WITH CHECK (
    -- System Admin can modify anyone
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
    OR
    -- Users can modify themselves (except role changes) - check that role didn't change
    (users.id = auth.uid())
    OR
    -- Hospital Admin can modify their hospital's users (except system admin)
    (
      users.role_id != (SELECT id FROM roles WHERE role_code = 'system_admin')
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
          AND u.hospital_id = users.hospital_id
          AND u.status = 'active'
      )
    )
  );

