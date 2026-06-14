-- Sensitive Data Requests Table
-- Hospital Admin Module - For managing access requests to sensitive patient data
-- This migration should run after users and hospitals tables are created

-- ============================================
-- 1. Sensitive Data Requests Table
-- ============================================
CREATE TABLE IF NOT EXISTS sensitive_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  requestor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_ic TEXT NOT NULL,
  data_category TEXT NOT NULL CHECK (data_category IN ('phi', 'financial', 'contact', 'all')),
  justification TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'revoked')),
  access_duration_hours INTEGER NOT NULL DEFAULT 1,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  access_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_hospital_id ON sensitive_data_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_requestor_id ON sensitive_data_requests(requestor_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_status ON sensitive_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_urgency ON sensitive_data_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_approved_by ON sensitive_data_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_created_at ON sensitive_data_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_requests_patient_id ON sensitive_data_requests(patient_id);

-- ============================================
-- 3. Sensitive Data Access Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS sensitive_data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES sensitive_data_requests(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'export')),
  data_category TEXT NOT NULL CHECK (data_category IN ('phi', 'financial', 'contact', 'all')),
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. Indexes for Access Logs
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sensitive_data_access_logs_request_id ON sensitive_data_access_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_access_logs_accessed_by ON sensitive_data_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_access_logs_accessed_at ON sensitive_data_access_logs(accessed_at DESC);

-- ============================================
-- 5. Updated At Trigger
-- ============================================
-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sensitive_data_requests
DROP TRIGGER IF EXISTS update_sensitive_data_requests_updated_at ON sensitive_data_requests;
CREATE TRIGGER update_sensitive_data_requests_updated_at
  BEFORE UPDATE ON sensitive_data_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE sensitive_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data_access_logs ENABLE ROW LEVEL SECURITY;

-- System Admin: Full access
CREATE POLICY "System Admin can manage all sensitive data requests"
  ON sensitive_data_requests
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

-- Hospital Admin: Manage requests for their hospital
CREATE POLICY "Hospital Admin can manage sensitive data requests for their hospital"
  ON sensitive_data_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.role_code = 'hospital_admin'
      AND u.hospital_id = sensitive_data_requests.hospital_id
    )
  );

-- Users: Can view and create requests for their hospital
CREATE POLICY "Users can view sensitive data requests for their hospital"
  ON sensitive_data_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = sensitive_data_requests.hospital_id
    )
  );

CREATE POLICY "Users can create sensitive data requests for their hospital"
  ON sensitive_data_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = sensitive_data_requests.hospital_id
      AND u.id = sensitive_data_requests.requestor_id
    )
  );

-- Users: Can update their own pending requests
CREATE POLICY "Users can update their own pending requests"
  ON sensitive_data_requests
  FOR UPDATE
  TO authenticated
  USING (
    requestor_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    requestor_id = auth.uid()
    AND status = 'pending'
  );

-- Access Logs: System Admin and Hospital Admin can view all logs
CREATE POLICY "System Admin can view all access logs"
  ON sensitive_data_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.role_code = 'system_admin'
    )
  );

CREATE POLICY "Hospital Admin can view access logs for their hospital"
  ON sensitive_data_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN sensitive_data_requests sdr ON sdr.id = sensitive_data_access_logs.request_id
      WHERE u.id = auth.uid()
      AND r.role_code = 'hospital_admin'
      AND u.hospital_id = sdr.hospital_id
    )
  );

-- Users: Can view logs for requests they created
CREATE POLICY "Users can view logs for their requests"
  ON sensitive_data_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sensitive_data_requests sdr
      WHERE sdr.id = sensitive_data_access_logs.request_id
      AND sdr.requestor_id = auth.uid()
    )
  );

-- Users: Can insert logs when accessing data
CREATE POLICY "Users can log data access"
  ON sensitive_data_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    accessed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sensitive_data_requests sdr
      WHERE sdr.id = sensitive_data_access_logs.request_id
      AND sdr.status = 'approved'
      AND (sdr.access_expires_at IS NULL OR sdr.access_expires_at > NOW())
    )
  );

-- ============================================
-- 7. Comments
-- ============================================
COMMENT ON TABLE sensitive_data_requests IS 'Tracks requests for access to sensitive patient data';
COMMENT ON TABLE sensitive_data_access_logs IS 'Audit log of all sensitive data access events';
COMMENT ON COLUMN sensitive_data_requests.data_category IS 'Type of data requested: phi (protected health info), financial, contact, or all';
COMMENT ON COLUMN sensitive_data_requests.urgency IS 'Request urgency: routine, urgent, or emergency';
COMMENT ON COLUMN sensitive_data_requests.status IS 'Request status: pending, approved, denied, expired, or revoked';
COMMENT ON COLUMN sensitive_data_requests.access_duration_hours IS 'How long access is granted (in hours)';
COMMENT ON COLUMN sensitive_data_access_logs.access_type IS 'Type of access: view, download, or export';

