-- Hospital Health Metrics Table
-- Hospital Admin Module - For monitoring hospital system health
-- This migration should run after hospitals table is created

-- ============================================
-- 1. Hospital Health Metrics Table
-- ============================================
CREATE TABLE IF NOT EXISTS hospital_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('active_sessions', 'database', 'storage', 'api_latency', 'error_rate')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  threshold_warning NUMERIC NOT NULL,
  threshold_critical NUMERIC NOT NULL,
  message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hospital_health_metrics_hospital_id ON hospital_health_metrics(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_health_metrics_check_type ON hospital_health_metrics(check_type);
CREATE INDEX IF NOT EXISTS idx_hospital_health_metrics_status ON hospital_health_metrics(status);
CREATE INDEX IF NOT EXISTS idx_hospital_health_metrics_checked_at ON hospital_health_metrics(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_health_metrics_hospital_checked ON hospital_health_metrics(hospital_id, checked_at DESC);

-- ============================================
-- 3. Updated At Trigger
-- ============================================
-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hospital_health_metrics
DROP TRIGGER IF EXISTS update_hospital_health_metrics_updated_at ON hospital_health_metrics;
CREATE TRIGGER update_hospital_health_metrics_updated_at
  BEFORE UPDATE ON hospital_health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE hospital_health_metrics ENABLE ROW LEVEL SECURITY;

-- System Admin: Full access
CREATE POLICY "System Admin can manage all health metrics"
  ON hospital_health_metrics
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

-- Hospital Admin: Manage metrics for their hospital
CREATE POLICY "Hospital Admin can manage health metrics for their hospital"
  ON hospital_health_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.role_code = 'hospital_admin'
      AND u.hospital_id = hospital_health_metrics.hospital_id
    )
  );

-- Users: Can view metrics for their hospital
CREATE POLICY "Users can view health metrics for their hospital"
  ON hospital_health_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = hospital_health_metrics.hospital_id
    )
  );

-- ============================================
-- 5. Comments
-- ============================================
COMMENT ON TABLE hospital_health_metrics IS 'Tracks health metrics for hospital systems (sessions, database, storage, API latency, error rate)';
COMMENT ON COLUMN hospital_health_metrics.check_type IS 'Type of health check: active_sessions, database, storage, api_latency, or error_rate';
COMMENT ON COLUMN hospital_health_metrics.status IS 'Health status: healthy, warning, or critical';
COMMENT ON COLUMN hospital_health_metrics.value IS 'Current metric value';
COMMENT ON COLUMN hospital_health_metrics.unit IS 'Unit of measurement (e.g., sessions, %, GB, ms)';
COMMENT ON COLUMN hospital_health_metrics.threshold_warning IS 'Value threshold that triggers warning status';
COMMENT ON COLUMN hospital_health_metrics.threshold_critical IS 'Value threshold that triggers critical status';

