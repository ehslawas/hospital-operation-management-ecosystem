-- System Settings Table
-- This table stores global system configuration settings
-- There should only be one row with id = 'system-settings'

-- ============================================
-- 1. Create System Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'system-settings',
  
  -- Application Info
  app_name TEXT NOT NULL DEFAULT 'HOME',
  app_version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Maintenance
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT,
  
  -- Session & Security
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Password Policy
  password_min_length INTEGER NOT NULL DEFAULT 8,
  password_require_uppercase BOOLEAN NOT NULL DEFAULT true,
  password_require_lowercase BOOLEAN NOT NULL DEFAULT true,
  password_require_numbers BOOLEAN NOT NULL DEFAULT true,
  password_require_special BOOLEAN NOT NULL DEFAULT false,
  password_expiry_days INTEGER NOT NULL DEFAULT 90,
  
  -- User Management
  require_email_verification BOOLEAN NOT NULL DEFAULT false,
  allow_registration BOOLEAN NOT NULL DEFAULT false,
  default_user_role TEXT,
  
  -- Backup Settings
  backup_enabled BOOLEAN NOT NULL DEFAULT true,
  backup_frequency_hours INTEGER NOT NULL DEFAULT 24,
  backup_retention_days INTEGER NOT NULL DEFAULT 30,
  log_retention_days INTEGER NOT NULL DEFAULT 90,
  
  -- Email Settings
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_from_address TEXT NOT NULL DEFAULT 'noreply@home.gov.my',
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_encryption TEXT CHECK (smtp_encryption IN ('tls', 'ssl', 'none')) DEFAULT 'tls',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Insert Default Settings
-- ============================================
INSERT INTO system_settings (
  id,
  app_name,
  app_version,
  maintenance_mode,
  session_timeout_minutes,
  max_login_attempts,
  lockout_duration_minutes,
  password_min_length,
  password_require_uppercase,
  password_require_lowercase,
  password_require_numbers,
  password_require_special,
  password_expiry_days,
  require_email_verification,
  allow_registration,
  backup_enabled,
  backup_frequency_hours,
  backup_retention_days,
  log_retention_days,
  email_enabled,
  email_from_address,
  smtp_port,
  smtp_encryption
) VALUES (
  'system-settings',
  'HOME',
  '1.0.0',
  false,
  60,
  5,
  30,
  8,
  true,
  true,
  true,
  false,
  90,
  false,
  false,
  true,
  24,
  30,
  90,
  true,
  'noreply@home.gov.my',
  587,
  'tls'
)
ON CONFLICT (id) DO NOTHING;

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

-- Create trigger for system_settings
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================
-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only System Admins can view and modify settings
CREATE POLICY "system_admin_full_access_system_settings"
  ON system_settings
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

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access_system_settings"
  ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anonymous users to read settings (for public pages like maintenance mode)
-- This allows the app to check maintenance_mode without authentication
CREATE POLICY "anon_read_system_settings"
  ON system_settings
  FOR SELECT
  TO anon
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON system_settings TO anon;
GRANT SELECT ON system_settings TO authenticated;

