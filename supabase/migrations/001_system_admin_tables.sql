-- System Admin Module - Database Migrations
-- Phase 2: Database Schema Setup

-- ============================================
-- 1. Hospital Modules Table
-- ============================================
CREATE TABLE IF NOT EXISTS hospital_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  enabled_by UUID REFERENCES users(id),
  disabled_at TIMESTAMP WITH TIME ZONE,
  disabled_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per hospital-module combination
  UNIQUE(hospital_id, module_code)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_hospital_modules_hospital_id ON hospital_modules(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_modules_module_code ON hospital_modules(module_code);
CREATE INDEX IF NOT EXISTS idx_hospital_modules_enabled ON hospital_modules(is_enabled) WHERE is_enabled = true;

-- ============================================
-- 2. System Health Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS system_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL CHECK (check_type IN ('cpu', 'memory', 'database', 'api', 'storage', 'network')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_health_logs_check_type ON system_health_logs(check_type);
CREATE INDEX IF NOT EXISTS idx_health_logs_status ON system_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_health_logs_checked_at ON system_health_logs(checked_at DESC);

-- ============================================
-- 3. System Backups Table
-- ============================================
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('scheduled', 'manual', 'pre_update')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_path TEXT,
  file_size BIGINT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  initiated_by UUID REFERENCES users(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_type ON system_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON system_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_initiated_by ON system_backups(initiated_by);

-- ============================================
-- 4. System Alerts Table
-- ============================================
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('error', 'warning', 'critical', 'info')),
  category TEXT NOT NULL CHECK (category IN ('security', 'performance', 'backup', 'system', 'module')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_category ON system_alerts(category);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON system_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON system_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON system_alerts(created_at DESC);

-- ============================================
-- 5. Update Hospitals Table
-- ============================================
-- Add admin_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hospitals' AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN admin_id UUID REFERENCES users(id) UNIQUE;
  END IF;
END $$;

-- Add license_valid_until column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hospitals' AND column_name = 'license_valid_until'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN license_valid_until DATE;
  END IF;
END $$;

-- Add max_users column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hospitals' AND column_name = 'max_users'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN max_users INTEGER DEFAULT 100;
  END IF;
END $$;

-- Add subscription_tier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hospitals' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN subscription_tier TEXT DEFAULT 'basic';
  END IF;
END $$;

-- ============================================
-- 6. Update Timestamps Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_hospital_modules_updated_at
  BEFORE UPDATE ON hospital_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_backups_updated_at
  BEFORE UPDATE ON system_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

