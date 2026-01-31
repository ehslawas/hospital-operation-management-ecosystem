-- Hospital Logs Table
-- This table stores activity logs for each hospital
-- Used by both System Admin (all hospitals) and Hospital Admin (their hospital only)

-- ============================================
-- 1. Create Hospital Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS hospital_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hospital and User References
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Log Classification
  category TEXT NOT NULL CHECK (category IN ('authentication', 'user_activity', 'administrative', 'security', 'system')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Log Details
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  module TEXT,
  
  -- Entity Tracking (for tracking what was affected)
  entity_type TEXT,
  entity_id TEXT,
  
  -- Request Metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Additional Data (JSONB for flexibility)
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Create Indexes
-- ============================================
-- Index for hospital-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_hospital_logs_hospital_id ON hospital_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_logs_created_at ON hospital_logs(created_at DESC);

-- Index for user-based queries
CREATE INDEX IF NOT EXISTS idx_hospital_logs_user_id ON hospital_logs(user_id) WHERE user_id IS NOT NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_hospital_logs_category ON hospital_logs(category);
CREATE INDEX IF NOT EXISTS idx_hospital_logs_severity ON hospital_logs(severity);
CREATE INDEX IF NOT EXISTS idx_hospital_logs_module ON hospital_logs(module) WHERE module IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hospital_logs_action ON hospital_logs(action);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_hospital_logs_hospital_created ON hospital_logs(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_logs_hospital_category ON hospital_logs(hospital_id, category);

-- ============================================
-- 3. Apply Updated At Trigger
-- ============================================
-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hospital_logs
DROP TRIGGER IF EXISTS update_hospital_logs_updated_at ON hospital_logs;
CREATE TRIGGER update_hospital_logs_updated_at
  BEFORE UPDATE ON hospital_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================
-- Enable RLS on hospital_logs
ALTER TABLE hospital_logs ENABLE ROW LEVEL SECURITY;

-- Policy: System Admin can view all logs
CREATE POLICY "system_admin_full_access_hospital_logs"
  ON hospital_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
  );

-- Policy: Hospital Admin can view their hospital's logs
CREATE POLICY "hospital_admin_view_own_hospital_logs"
  ON hospital_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND users.hospital_id = hospital_logs.hospital_id
        AND users.status = 'active'
    )
  );

-- Policy: Users can view their own logs
CREATE POLICY "users_view_own_logs"
  ON hospital_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = hospital_logs.hospital_id
        AND users.status = 'active'
    )
  );

-- Policy: System can insert logs (for automated logging)
-- This allows the application to insert logs without authentication
CREATE POLICY "system_insert_hospital_logs"
  ON hospital_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access_hospital_logs"
  ON hospital_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON hospital_logs TO authenticated;
GRANT INSERT ON hospital_logs TO authenticated;

