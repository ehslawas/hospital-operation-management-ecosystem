-- =========================================================
-- CONSOLIDATED SUPABASE SCHEMA MIGRATIONS (001 - 20260813_distribution_indent.sql)
-- Generated at: 2026-08-30T14:14:03.422Z
-- =========================================================


-- >>>>>>>>>>>>>>> FILE: 000_base_tables.sql <<<<<<<<<<<<<<<
-- Base Tables - Core System Tables
-- This file should be run FIRST before other migrations
-- These tables are required for the system to function

-- ============================================
-- 1. Hospitals Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_code TEXT NOT NULL UNIQUE,
  hospital_name TEXT NOT NULL,
  address TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for hospitals
CREATE INDEX IF NOT EXISTS idx_hospitals_code ON hospitals(hospital_code);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(hospital_name);

-- ============================================
-- 2. Roles Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  role_code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(role_code);
CREATE INDEX IF NOT EXISTS idx_roles_hospital_id ON roles(hospital_id);

-- ============================================
-- 3. Departments Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_code TEXT NOT NULL,
  department_name TEXT NOT NULL,
  description TEXT,
  head_of_department_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, department_code)
);

-- Indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_hospital_id ON departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

-- ============================================
-- 4. Users Table (if not exists)
-- ============================================
-- Note: Supabase has auth.users in auth schema, we need public.users
-- If it doesn't exist, create it with these columns:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      employee_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      ic_number TEXT NOT NULL,
      phone_number TEXT,
      profile_photo_url TEXT,
      date_of_birth DATE,
      gender TEXT CHECK (gender IN ('male', 'female')),
      address TEXT,
      role_id UUID NOT NULL REFERENCES roles(id),
      department_id UUID REFERENCES departments(id),
      hospital_id UUID REFERENCES hospitals(id),
      jawatan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      last_failed_login TIMESTAMP WITH TIME ZONE,
      account_locked_until TIMESTAMP WITH TIME ZONE,
      last_login TIMESTAMP WITH TIME ZONE,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    -- Indexes for users
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_employee_id ON users(employee_id);
    CREATE INDEX idx_users_role_id ON users(role_id);
    CREATE INDEX idx_users_department_id ON users(department_id);
    CREATE INDEX idx_users_hospital_id ON users(hospital_id);
    CREATE INDEX idx_users_status ON users(status);
  END IF;
END $$;

-- ============================================
-- 5. Access Requests Table
-- ============================================
-- Create table first without the reviewed_by foreign key (will add it later)
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  ic_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  address TEXT,
  profile_photo_url TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  jawatan TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID, -- Will add foreign key constraint after users table is confirmed to exist
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for access_requests
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_ic_number ON access_requests(ic_number);
CREATE INDEX IF NOT EXISTS idx_access_requests_hospital_id ON access_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_department_id ON access_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_reviewed_by ON access_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);

-- Add foreign key constraint for reviewed_by (only if users table exists)
DO $$
BEGIN
  -- Check if users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'access_requests_reviewed_by_fkey'
    ) THEN
      ALTER TABLE access_requests 
      ADD CONSTRAINT access_requests_reviewed_by_fkey 
      FOREIGN KEY (reviewed_by) REFERENCES users(id);
    END IF;
  END IF;
END $$;

-- ============================================
-- 6. Update Timestamps Function (if not exists)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers for access_requests
DROP TRIGGER IF EXISTS update_access_requests_updated_at ON access_requests;
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at triggers for base tables if they don't exist
DO $$
BEGIN
  -- Hospitals trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_hospitals_updated_at'
  ) THEN
    CREATE TRIGGER update_hospitals_updated_at
      BEFORE UPDATE ON hospitals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Departments trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_departments_updated_at'
  ) THEN
    CREATE TRIGGER update_departments_updated_at
      BEFORE UPDATE ON departments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Roles trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_roles_updated_at
      BEFORE UPDATE ON roles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Users trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;




-- >>>>>>>>>>>>>>> FILE: 001_system_admin_tables.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 002_rls_policies.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 003_seed_system_admin.sql <<<<<<<<<<<<<<<
-- System Admin Module - Initial System Admin Seed
-- Phase 2: System Admin Initialization
-- 
-- IMPORTANT: This script should be run manually during initial setup
-- The System Admin credentials should be stored securely offline
-- 
-- Usage:
-- 1. Replace 'system.admin@home.gov.my' with actual email
-- 2. Replace 'SecurePassword123!' with a strong password
-- 3. Run this script in Supabase SQL Editor
-- 4. Store credentials securely offline
-- 5. Delete or comment out this file after initial setup

-- ============================================
-- 1. Create System Admin User in Auth
-- ============================================
-- Note: This requires Supabase Admin API or manual creation via Supabase Dashboard
-- 
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Enter email: system.admin@home.gov.my
-- 4. Enter password: [STRONG_PASSWORD]
-- 5. Set "Auto Confirm User" to true
-- 6. Copy the user ID from the created user

-- ============================================
-- 2. Create System Admin User Record
-- ============================================
-- After creating the auth user, run this with the actual user ID:

/*
DO $$
DECLARE
  system_admin_user_id UUID := 'REPLACE_WITH_AUTH_USER_ID';
  system_admin_role_id UUID;
  admin_department_id UUID;
BEGIN
  -- Get system_admin role ID
  SELECT id INTO system_admin_role_id
  FROM roles
  WHERE role_code = 'system_admin'
  LIMIT 1;

  IF system_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'System Admin role not found. Please create the role first.';
  END IF;

  -- Get or create admin department (optional, can be NULL)
  SELECT id INTO admin_department_id
  FROM departments
  WHERE department_code = 'ADM'
  LIMIT 1;

  -- Create user record
  INSERT INTO users (
    id,
    email,
    employee_id,
    full_name,
    ic_number,
    phone_number,
    role_id,
    department_id,
    hospital_id,
    jawatan,
    status,
    failed_login_attempts
  ) VALUES (
    system_admin_user_id,
    'system.admin@home.gov.my',
    'SYS001',
    'System Administrator',
    '000000000000', -- Placeholder IC
    '0123456789',   -- Placeholder phone
    system_admin_role_id,
    admin_department_id,
    NULL, -- System Admin doesn't belong to a hospital
    'System Administrator',
    'active',
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'System Admin user created successfully with ID: %', system_admin_user_id;
END $$;
*/

-- ============================================
-- 3. Verification Query
-- ============================================
-- Run this to verify System Admin was created correctly:

/*
SELECT 
  u.id,
  u.email,
  u.employee_id,
  u.full_name,
  u.status,
  r.role_name,
  r.role_code
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.role_code = 'system_admin';
*/

-- ============================================
-- 4. Security Checklist
-- ============================================
-- After creating System Admin:
-- [ ] Change password on first login (enforce in application)
-- [ ] Enable 2FA (if available)
-- [ ] Document credentials securely offline
-- [ ] Delete this seed file or comment out sensitive parts
-- [ ] Verify RLS policies are working
-- [ ] Test System Admin access
-- [ ] Verify only one System Admin can exist

-- ============================================
-- 5. Password Reset (if needed)
-- ============================================
-- To reset System Admin password:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find the System Admin user
-- 3. Click "..." > "Reset Password"
-- 4. Or use Supabase Admin API:
--    POST /auth/v1/admin/users/{user_id}
--    { "password": "new_password" }




-- >>>>>>>>>>>>>>> FILE: 004_database_functions.sql <<<<<<<<<<<<<<<
-- System Admin Module - Database Functions & Triggers
-- Phase 2: Automation & Helpers

-- ============================================
-- 1. Auto-create Alert on Critical Health Check
-- ============================================
CREATE OR REPLACE FUNCTION auto_alert_on_critical_health()
RETURNS TRIGGER AS $$
BEGIN
  -- If health check is critical, create an alert
  IF NEW.status = 'critical' THEN
    INSERT INTO system_alerts (
      alert_type,
      category,
      title,
      message,
      metadata
    ) VALUES (
      'critical',
      'system',
      'Critical System Health Issue: ' || NEW.check_type,
      NEW.message || ' (Value: ' || NEW.value || ' ' || NEW.unit || ')',
      jsonb_build_object(
        'check_type', NEW.check_type,
        'value', NEW.value,
        'unit', NEW.unit,
        'health_log_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create alerts
DROP TRIGGER IF EXISTS trigger_alert_on_critical_health ON system_health_logs;
CREATE TRIGGER trigger_alert_on_critical_health
  AFTER INSERT ON system_health_logs
  FOR EACH ROW
  WHEN (NEW.status = 'critical')
  EXECUTE FUNCTION auto_alert_on_critical_health();

-- ============================================
-- 2. Auto-create Alert on Backup Failure
-- ============================================
CREATE OR REPLACE FUNCTION auto_alert_on_backup_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- If backup failed, create an alert
  IF NEW.status = 'failed' THEN
    INSERT INTO system_alerts (
      alert_type,
      category,
      title,
      message,
      metadata
    ) VALUES (
      'error',
      'backup',
      'Backup Failed: ' || NEW.backup_type,
      COALESCE(NEW.error_message, 'Backup operation failed'),
      jsonb_build_object(
        'backup_id', NEW.id,
        'backup_type', NEW.backup_type,
        'initiated_by', NEW.initiated_by
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create alerts on backup failure
DROP TRIGGER IF EXISTS trigger_alert_on_backup_failure ON system_backups;
CREATE TRIGGER trigger_alert_on_backup_failure
  AFTER UPDATE ON system_backups
  FOR EACH ROW
  WHEN (NEW.status = 'failed' AND OLD.status != 'failed')
  EXECUTE FUNCTION auto_alert_on_backup_failure();

-- ============================================
-- 3. Function to Get System Statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_system_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_hospitals', (SELECT COUNT(*) FROM hospitals),
    'active_hospitals', (SELECT COUNT(*) FROM hospitals WHERE status = 'active'),
    'inactive_hospitals', (SELECT COUNT(*) FROM hospitals WHERE status = 'inactive'),
    'pending_setup_hospitals', (
      SELECT COUNT(*) FROM hospitals 
      WHERE status = 'active' AND admin_id IS NULL
    ),
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users', (SELECT COUNT(*) FROM users WHERE status = 'active'),
    'pending_users', (SELECT COUNT(*) FROM users WHERE status = 'pending'),
    'suspended_users', (SELECT COUNT(*) FROM users WHERE status = 'suspended'),
    'inactive_users', (SELECT COUNT(*) FROM users WHERE status = 'inactive'),
    'module_usage', (
      SELECT jsonb_object_agg(
        module_code,
        jsonb_build_object(
          'count', COUNT(*),
          'percentage', ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM hospitals WHERE status = 'active'), 0), 2)
        )
      )
      FROM hospital_modules
      WHERE is_enabled = true
    ),
    'system_health', (
      SELECT jsonb_build_object(
        'overall_status', (
          CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'critical') > 0 THEN 'critical'
            WHEN COUNT(*) FILTER (WHERE status = 'warning') > 0 THEN 'warning'
            ELSE 'healthy'
          END
        ),
        'checks', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'check_type', check_type,
              'status', status,
              'value', value,
              'unit', unit,
              'message', message,
              'checked_at', checked_at
            )
          )
          FROM (
            SELECT DISTINCT ON (check_type) *
            FROM system_health_logs
            ORDER BY check_type, checked_at DESC
          ) latest_checks
        )
      )
      FROM system_health_logs
      WHERE checked_at > NOW() - INTERVAL '1 hour'
    ),
    'recent_alerts', (
      SELECT jsonb_build_object(
        'critical', COUNT(*) FILTER (WHERE alert_type = 'critical' AND is_resolved = false),
        'warning', COUNT(*) FILTER (WHERE alert_type = 'warning' AND is_resolved = false),
        'info', COUNT(*) FILTER (WHERE alert_type = 'info' AND is_resolved = false)
      )
      FROM system_alerts
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'last_backup', (
      SELECT jsonb_build_object(
        'id', id,
        'backup_type', backup_type,
        'status', status,
        'file_path', file_path,
        'file_size', file_size,
        'completed_at', completed_at
      )
      FROM system_backups
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_system_statistics() TO authenticated;

-- ============================================
-- 4. Function to Clean Old Health Logs
-- ============================================
CREATE OR REPLACE FUNCTION clean_old_health_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete health logs older than 30 days (configurable)
  DELETE FROM system_health_logs
  WHERE checked_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Function to Clean Old Alerts
-- ============================================
CREATE OR REPLACE FUNCTION clean_old_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete resolved alerts older than 90 days
  DELETE FROM system_alerts
  WHERE is_resolved = true
    AND resolved_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Function to Get Module Usage Statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_module_usage_stats()
RETURNS TABLE (
  module_code TEXT,
  enabled_count BIGINT,
  total_hospitals BIGINT,
  usage_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.module_code,
    COUNT(*) FILTER (WHERE m.is_enabled = true) as enabled_count,
    (SELECT COUNT(*) FROM hospitals WHERE status = 'active') as total_hospitals,
    ROUND(
      COUNT(*) FILTER (WHERE m.is_enabled = true) * 100.0 / 
      NULLIF((SELECT COUNT(*) FROM hospitals WHERE status = 'active'), 0),
      2
    ) as usage_percentage
  FROM hospital_modules m
  GROUP BY m.module_code
  ORDER BY m.module_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_module_usage_stats() TO authenticated;




-- >>>>>>>>>>>>>>> FILE: 005_pharmacy_catalog_tables.sql <<<<<<<<<<<<<<<
-- Pharmacy Catalog Tables
-- This migration creates tables for drug and non-drug catalog management
-- Run this after base tables (000_base_tables.sql)

-- ============================================
-- 1. Uploaded Files Tracking Table
-- ============================================
-- Tracks uploaded files to prevent duplicates
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 hash of file content
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- 'excel', 'pdf', 'image'
  catalog_type TEXT NOT NULL CHECK (catalog_type IN ('drug', 'non_drug')),
  upload_status TEXT NOT NULL DEFAULT 'completed' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
  items_imported INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, file_hash) -- Prevent duplicate file uploads
);

-- Indexes for uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_hospital_id ON uploaded_files(hospital_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_hash ON uploaded_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_catalog_type ON uploaded_files(catalog_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);

-- ============================================
-- 2. Drug Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS drug_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  parent_category_id UUID REFERENCES drug_categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, category_code)
);

-- Indexes for drug_categories
CREATE INDEX IF NOT EXISTS idx_drug_categories_hospital_id ON drug_categories(hospital_id);
CREATE INDEX IF NOT EXISTS idx_drug_categories_code ON drug_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_drug_categories_parent ON drug_categories(parent_category_id);

-- ============================================
-- 3. Non-Drug Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS non_drug_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  parent_category_id UUID REFERENCES non_drug_categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, category_code)
);

-- Indexes for non_drug_categories
CREATE INDEX IF NOT EXISTS idx_non_drug_categories_hospital_id ON non_drug_categories(hospital_id);
CREATE INDEX IF NOT EXISTS idx_non_drug_categories_code ON non_drug_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_non_drug_categories_parent ON non_drug_categories(parent_category_id);

-- ============================================
-- 4. Suppliers Table
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  registration_number TEXT,
  bank_account TEXT,
  bank_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, supplier_code)
);

-- Indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_hospital_id ON suppliers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- ============================================
-- 5. Drugs Table
-- ============================================
CREATE TABLE IF NOT EXISTS drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  drug_code TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  generic_name TEXT,
  brand_name TEXT,
  dosage_form TEXT NOT NULL CHECK (dosage_form IN ('tablet', 'capsule', 'injection', 'syrup', 'suspension', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 'powder', 'solution', 'other')),
  strength TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  category_id UUID REFERENCES drug_categories(id) ON DELETE SET NULL,
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  storage_conditions TEXT,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  -- Catalog-specific fields
  sku TEXT,
  pku TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  procurement_vote TEXT CHECK (procurement_vote IN ('appl', 'cc', 'dp', 'lp')),
  price DECIMAL(10,2),
  packaging_description TEXT,
  item_sub_class TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, drug_code)
);

-- Indexes for drugs
CREATE INDEX IF NOT EXISTS idx_drugs_hospital_id ON drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_drugs_code ON drugs(drug_code);
CREATE INDEX IF NOT EXISTS idx_drugs_category_id ON drugs(category_id);
CREATE INDEX IF NOT EXISTS idx_drugs_supplier_id ON drugs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_drugs_status ON drugs(status);
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(drug_name);
CREATE INDEX IF NOT EXISTS idx_drugs_sku ON drugs(sku);
CREATE INDEX IF NOT EXISTS idx_drugs_pku ON drugs(pku);

-- ============================================
-- 6. Non-Drugs Table
-- ============================================
CREATE TABLE IF NOT EXISTS non_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES non_drug_categories(id) ON DELETE SET NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  -- Catalog-specific fields
  sku TEXT,
  pku TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  procurement_vote TEXT CHECK (procurement_vote IN ('appl', 'cc', 'dp', 'lp')),
  price DECIMAL(10,2),
  packaging_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, item_code)
);

-- Indexes for non_drugs
CREATE INDEX IF NOT EXISTS idx_non_drugs_hospital_id ON non_drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_non_drugs_code ON non_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_non_drugs_category_id ON non_drugs(category_id);
CREATE INDEX IF NOT EXISTS idx_non_drugs_supplier_id ON non_drugs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_non_drugs_status ON non_drugs(status);
CREATE INDEX IF NOT EXISTS idx_non_drugs_name ON non_drugs(item_name);
CREATE INDEX IF NOT EXISTS idx_non_drugs_sku ON non_drugs(sku);
CREATE INDEX IF NOT EXISTS idx_non_drugs_pku ON non_drugs(pku);

-- ============================================
-- 7. Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_categories_updated_at
  BEFORE UPDATE ON drug_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_drug_categories_updated_at
  BEFORE UPDATE ON non_drug_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at
  BEFORE UPDATE ON drugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_drugs_updated_at
  BEFORE UPDATE ON non_drugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Helper Function: Check File Hash
-- ============================================
-- Function to check if a file with the same hash has been uploaded
CREATE OR REPLACE FUNCTION check_file_duplicate(
  p_hospital_id UUID,
  p_file_hash TEXT
)
RETURNS TABLE (
  file_id UUID,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  items_imported INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.id,
    uf.file_name,
    uf.uploaded_at,
    uf.items_imported
  FROM uploaded_files uf
  WHERE uf.hospital_id = p_hospital_id
    AND uf.file_hash = p_file_hash
    AND uf.upload_status = 'completed'
  ORDER BY uf.uploaded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Helper Function: Get or Create Category
-- ============================================
-- Function to get or create a drug category
CREATE OR REPLACE FUNCTION get_or_create_drug_category(
  p_hospital_id UUID,
  p_category_name TEXT,
  p_category_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_category_id UUID;
  v_code TEXT;
BEGIN
  -- Generate code if not provided
  v_code := COALESCE(p_category_code, UPPER(SUBSTRING(REGEXP_REPLACE(p_category_name, '[^a-zA-Z0-9]', '', 'g'), 1, 20)));
  
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM drug_categories
  WHERE hospital_id = p_hospital_id
    AND (category_name = p_category_name OR category_code = v_code)
  LIMIT 1;
  
  -- If not found, create new
  IF v_category_id IS NULL THEN
    INSERT INTO drug_categories (hospital_id, category_code, category_name)
    VALUES (p_hospital_id, v_code, p_category_name)
    RETURNING id INTO v_category_id;
  END IF;
  
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a non-drug category
CREATE OR REPLACE FUNCTION get_or_create_non_drug_category(
  p_hospital_id UUID,
  p_category_name TEXT,
  p_category_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_category_id UUID;
  v_code TEXT;
BEGIN
  -- Generate code if not provided
  v_code := COALESCE(p_category_code, UPPER(SUBSTRING(REGEXP_REPLACE(p_category_name, '[^a-zA-Z0-9]', '', 'g'), 1, 20)));
  
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM non_drug_categories
  WHERE hospital_id = p_hospital_id
    AND (category_name = p_category_name OR category_code = v_code)
  LIMIT 1;
  
  -- If not found, create new
  IF v_category_id IS NULL THEN
    INSERT INTO non_drug_categories (hospital_id, category_code, category_name)
    VALUES (p_hospital_id, v_code, p_category_name)
    RETURNING id INTO v_category_id;
  END IF;
  
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Comments
-- ============================================
COMMENT ON TABLE uploaded_files IS 'Tracks uploaded catalog files to prevent duplicate uploads';
COMMENT ON TABLE drug_categories IS 'Drug categories for catalog organization';
COMMENT ON TABLE non_drug_categories IS 'Non-drug categories for catalog organization';
COMMENT ON TABLE suppliers IS 'Suppliers for procurement';
COMMENT ON TABLE drugs IS 'Drug catalog items';
COMMENT ON TABLE non_drugs IS 'Non-drug catalog items';
COMMENT ON FUNCTION check_file_duplicate IS 'Checks if a file with the same hash has been uploaded before';
COMMENT ON FUNCTION get_or_create_drug_category IS 'Gets existing or creates new drug category';
COMMENT ON FUNCTION get_or_create_non_drug_category IS 'Gets existing or creates new non-drug category';




-- >>>>>>>>>>>>>>> FILE: 006_login_rls_fix.sql <<<<<<<<<<<<<<<
-- Login RLS Fix - Allow anonymous users to lookup users by employee_id for login
-- This is required because the login flow needs to query the users table BEFORE authentication
-- to find the user's email address for Supabase Auth

-- ============================================
-- 1. Enable RLS on users table (if not already)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing login policy if exists
-- ============================================
DROP POLICY IF EXISTS "anon_user_lookup_for_login" ON users;
DROP POLICY IF EXISTS "service_role_full_access_users" ON users;

-- ============================================
-- 3. Add policy for anonymous user lookup during login
-- ============================================
-- This policy allows anonymous (unauthenticated) users to SELECT
-- from the users table. This is necessary for the login flow where
-- we need to find a user by employee_id to get their email before
-- authenticating with Supabase Auth.
--
-- Security note: This only allows SELECT and the application should
-- only query by employee_id. Consider using a Supabase Edge Function
-- for production to further restrict what data is returned.

CREATE POLICY "anon_user_lookup_for_login"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- 4. Add service role full access for admin operations
-- ============================================
CREATE POLICY "service_role_full_access_users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Grant necessary permissions to anon role
-- ============================================
GRANT SELECT ON users TO anon;
GRANT SELECT ON roles TO anon;
GRANT SELECT ON departments TO anon;
GRANT SELECT ON hospitals TO anon;




-- >>>>>>>>>>>>>>> FILE: 007_rollback_users_rls_for_login_debug.sql <<<<<<<<<<<<<<<
-- Roll back custom RLS on users table to debug login issues
-- This migration restores the simpler behaviour where RLS is disabled
-- for the users table. This is safe for local development while we
-- diagnose Supabase 500 errors on /rest/v1/users.

-- 1. Drop the custom policies added in 006_login_rls_fix (if they exist)
DROP POLICY IF EXISTS "anon_user_lookup_for_login" ON users;
DROP POLICY IF EXISTS "service_role_full_access_users" ON users;

-- 2. Disable Row Level Security on users table for now
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note:
-- In Supabase, disabling RLS on a table makes it fully accessible to
-- clients that have privileges (anon / authenticated). For local
-- development this is acceptable and will avoid RLS-related 500 errors
-- during login. Once everything is stable, we can re‑introduce a
-- minimal, well‑tested RLS policy specifically for login.





-- >>>>>>>>>>>>>>> FILE: 008_system_settings_table.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 009_hospital_logs_table.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 010_fix_roles_rls.sql <<<<<<<<<<<<<<<
-- Fix RLS Policies for Roles Table
-- This migration ensures roles table is accessible for system operations

-- ============================================
-- Roles Table RLS Policies
-- ============================================

-- Check if RLS is enabled, if so, add policies
DO $$
BEGIN
  -- Check if RLS is enabled on roles table
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'roles'
  ) THEN
    -- Enable RLS if not already enabled
    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "authenticated_users_can_read_roles" ON roles;
    DROP POLICY IF EXISTS "system_admin_full_access_roles" ON roles;
    DROP POLICY IF EXISTS "public_read_roles" ON roles;
    
    -- Policy: All authenticated users can read roles (needed for role lookups)
    -- This is safe because roles don't contain sensitive data - they're public metadata
    CREATE POLICY "authenticated_users_can_read_roles"
      ON roles
      FOR SELECT
      TO authenticated
      USING (true);
    
    -- Policy: Allow service role full access (for migrations and admin operations)
    -- Service role bypasses RLS, but we add this for explicit clarity
    CREATE POLICY "service_role_full_access_roles"
      ON roles
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    -- Note: For INSERT/UPDATE/DELETE on roles, we rely on service_role or
    -- application-level permissions. Roles should only be modified by system admins
    -- through the application, not directly via API.
  END IF;
END $$;




-- >>>>>>>>>>>>>>> FILE: 011_seed_system_roles.sql <<<<<<<<<<<<<<<
-- Seed Essential System Roles
-- This migration creates the required system roles that the application depends on
-- Run this after 000_base_tables.sql and before creating any users

-- ============================================
-- 1. System Roles
-- ============================================

-- Insert system_admin role (if not exists)
INSERT INTO roles (
  role_name,
  role_code,
  description,
  is_system_role,
  hospital_id,
  created_at,
  updated_at
)
SELECT 
  'System Administrator',
  'system_admin',
  'Full system access across all hospitals',
  true,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_code = 'system_admin'
);

-- Insert hospital_admin role (if not exists)
INSERT INTO roles (
  role_name,
  role_code,
  description,
  is_system_role,
  hospital_id,
  created_at,
  updated_at
)
SELECT 
  'Hospital Administrator',
  'hospital_admin',
  'Full access to a specific hospital',
  true,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_code = 'hospital_admin'
);

-- ============================================
-- 2. Verification
-- ============================================

-- Verify roles were created
DO $$
DECLARE
  system_admin_count INTEGER;
  hospital_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO system_admin_count
  FROM roles
  WHERE role_code = 'system_admin';
  
  SELECT COUNT(*) INTO hospital_admin_count
  FROM roles
  WHERE role_code = 'hospital_admin';
  
  IF system_admin_count = 0 THEN
    RAISE EXCEPTION 'Failed to create system_admin role';
  END IF;
  
  IF hospital_admin_count = 0 THEN
    RAISE EXCEPTION 'Failed to create hospital_admin role';
  END IF;
  
  RAISE NOTICE 'Successfully created system roles: system_admin (%), hospital_admin (%)', 
    system_admin_count, hospital_admin_count;
END $$;

-- ============================================
-- 3. Query to verify (for manual checking)
-- ============================================

-- Run this to see all system roles:
-- SELECT id, role_code, role_name, is_system_role, created_at
-- FROM roles
-- WHERE is_system_role = true
-- ORDER BY role_code;




-- >>>>>>>>>>>>>>> FILE: 012_create_audit_logs_table.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 013_hospital_modules_rls_wide.sql <<<<<<<<<<<<<<<
-- Hospital Modules RLS Fix
-- Some users are getting 406 Not Acceptable when querying hospital_modules.
-- This migration adds a broad read policy so all authenticated users can
-- read hospital_modules, while keeping existing more restrictive policies.

-- Ensure RLS is enabled
ALTER TABLE hospital_modules ENABLE ROW LEVEL SECURITY;

-- Drop existing broad read policy if it exists (idempotent)
DROP POLICY IF EXISTS "authenticated_read_hospital_modules" ON hospital_modules;

-- Allow all authenticated users to SELECT from hospital_modules.
-- This is safe because module configuration is not sensitive data,
-- and it simplifies UI logic (no 406 errors when checking module status).
CREATE POLICY "authenticated_read_hospital_modules"
  ON hospital_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep existing policies:
-- - "system_admin_full_access_hospital_modules" (ALL for system_admin)
-- - "hospital_admin_view_modules" (SELECT scoped to their hospital)





-- >>>>>>>>>>>>>>> FILE: 014_fix_audit_logs_user_id_nullable.sql <<<<<<<<<<<<<<<
-- Fix audit_logs table: Make user_id nullable to support ON DELETE SET NULL
-- This allows audit logs to be preserved even when users are deleted

-- ============================================
-- 1. Drop the NOT NULL constraint on user_id
-- ============================================

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) THEN
    -- Drop the foreign key constraint first (if it exists)
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'audit_logs_user_id_fkey'
    ) THEN
      ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
    END IF;
    
    -- Make user_id nullable
    ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;
    
    -- Re-add the foreign key with ON DELETE SET NULL
    ALTER TABLE audit_logs 
      ADD CONSTRAINT audit_logs_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Fixed audit_logs.user_id to be nullable';
  ELSE
    RAISE NOTICE 'audit_logs table does not exist yet - this migration will be applied when table is created';
  END IF;
END $$;




-- >>>>>>>>>>>>>>> FILE: 015_create_memos_table.sql <<<<<<<<<<<<<<<
-- Memos Table
-- This table stores hospital memos, announcements, policies, and communications
-- Part of the Hospital Admin Module

-- ============================================
-- 1. Create memos table
-- ============================================

CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  memo_type TEXT NOT NULL CHECK (memo_type IN ('announcement', 'policy', 'event', 'emergency', 'maintenance')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'archived')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  target_departments UUID[] DEFAULT ARRAY[]::UUID[],
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_memos_hospital_id ON memos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_by ON memos(created_by);
CREATE INDEX IF NOT EXISTS idx_memos_approved_by ON memos(approved_by);
CREATE INDEX IF NOT EXISTS idx_memos_status ON memos(status);
CREATE INDEX IF NOT EXISTS idx_memos_memo_type ON memos(memo_type);
CREATE INDEX IF NOT EXISTS idx_memos_priority ON memos(priority);
CREATE INDEX IF NOT EXISTS idx_memos_publish_date ON memos(publish_date);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);

-- Composite index for common queries (hospital + status + date)
CREATE INDEX IF NOT EXISTS idx_memos_hospital_status_date 
  ON memos(hospital_id, status, created_at DESC);

-- Index for filtering by publish date (for published memos)
CREATE INDEX IF NOT EXISTS idx_memos_published 
  ON memos(hospital_id, status, publish_date DESC) 
  WHERE status = 'published';

-- ============================================
-- 3. Add updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_memos_updated_at ON memos;
CREATE TRIGGER update_memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "system_admin_full_access_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_view_own_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_create_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_update_own_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_delete_own_draft_memos" ON memos;
DROP POLICY IF EXISTS "users_view_published_memos" ON memos;
DROP POLICY IF EXISTS "service_role_full_access_memos" ON memos;

-- System Admin: Full access to all memos
CREATE POLICY "system_admin_full_access_memos"
  ON memos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'system_admin'
        )
    )
  );

-- Hospital Admin: View memos for their hospital
CREATE POLICY "hospital_admin_view_own_memos"
  ON memos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
    )
  );

-- Hospital Admin: Create memos for their hospital
CREATE POLICY "hospital_admin_create_memos"
  ON memos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
        AND users.id = memos.created_by
    )
  );

-- Hospital Admin: Update memos they created (only draft or pending_approval)
CREATE POLICY "hospital_admin_update_own_memos"
  ON memos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
        AND memos.created_by = auth.uid()
        AND memos.status IN ('draft', 'pending_approval')
    )
  );

-- Hospital Admin: Delete only draft memos they created
CREATE POLICY "hospital_admin_delete_own_draft_memos"
  ON memos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
        AND memos.created_by = auth.uid()
        AND memos.status = 'draft'
    )
  );

-- All authenticated users: View published memos for their hospital
CREATE POLICY "users_view_published_memos"
  ON memos
  FOR SELECT
  TO authenticated
  USING (
    memos.status = 'published'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
    )
  );

-- Service role: Full access (for backend operations)
CREATE POLICY "service_role_full_access_memos"
  ON memos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Comments for documentation
-- ============================================

COMMENT ON TABLE memos IS 'Stores hospital memos, announcements, policies, and communications';
COMMENT ON COLUMN memos.hospital_id IS 'The hospital this memo belongs to';
COMMENT ON COLUMN memos.title IS 'Title of the memo';
COMMENT ON COLUMN memos.content IS 'Full content/body of the memo';
COMMENT ON COLUMN memos.memo_type IS 'Type of memo: announcement, policy, event, emergency, maintenance';
COMMENT ON COLUMN memos.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN memos.status IS 'Current status: draft, pending_approval, approved, rejected, published, archived';
COMMENT ON COLUMN memos.created_by IS 'User who created the memo';
COMMENT ON COLUMN memos.approved_by IS 'User who approved/rejected the memo';
COMMENT ON COLUMN memos.target_departments IS 'Array of department IDs this memo is targeted to (empty = all departments)';
COMMENT ON COLUMN memos.attachments IS 'Array of file URLs/paths for memo attachments';




-- >>>>>>>>>>>>>>> FILE: 016_create_sensitive_data_requests_table.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 017_create_hospital_health_metrics_table.sql <<<<<<<<<<<<<<<
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




-- >>>>>>>>>>>>>>> FILE: 018_add_hospital_id_to_system_backups.sql <<<<<<<<<<<<<<<
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








-- >>>>>>>>>>>>>>> FILE: 019_sync_modules_to_departments.sql <<<<<<<<<<<<<<<
-- Migration: Sync existing enabled modules to departments
-- This ensures all enabled hospital modules have corresponding departments

-- Function to sync a single module to department
CREATE OR REPLACE FUNCTION sync_module_to_department(
  p_hospital_id UUID,
  p_module_code TEXT,
  p_module_name TEXT,
  p_module_description TEXT,
  p_is_enabled BOOLEAN
) RETURNS VOID AS $$
BEGIN
  IF p_is_enabled THEN
    -- Insert or update department
    INSERT INTO departments (
      hospital_id,
      department_code,
      department_name,
      description,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_hospital_id,
      p_module_code,
      p_module_name,
      p_module_description,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (hospital_id, department_code) 
    DO UPDATE SET
      department_name = EXCLUDED.department_name,
      description = EXCLUDED.description,
      status = 'active',
      updated_at = NOW();
  ELSE
    -- Deactivate department if module is disabled
    UPDATE departments
    SET 
      status = 'inactive',
      updated_at = NOW()
    WHERE 
      hospital_id = p_hospital_id 
      AND department_code = p_module_code;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get module name and description
CREATE OR REPLACE FUNCTION get_module_info(p_module_code TEXT)
RETURNS TABLE(module_name TEXT, module_description TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE p_module_code
      WHEN 'pharmacy_logistics' THEN 'Pharmacy Logistics'::TEXT
      WHEN 'pharmacy_substore' THEN 'Pharmacy Substore'::TEXT
      WHEN 'pharmacy_outpatient' THEN 'Pharmacy Outpatient'::TEXT
      WHEN 'pharmacy_emergency' THEN 'Pharmacy Emergency'::TEXT
      WHEN 'pharmacy_inpatient' THEN 'Pharmacy In Patient'::TEXT
      WHEN 'pharmacy_galenical' THEN 'Pharmacy Galenical & Prepacking'::TEXT
      WHEN 'general_ward' THEN 'General Ward'::TEXT
      WHEN 'paediatric_ward' THEN 'Paediatric Ward'::TEXT
      WHEN 'maternity_ward' THEN 'Maternity Ward'::TEXT
      WHEN 'emergency_trauma' THEN 'Emergency & Trauma'::TEXT
      WHEN 'laboratory' THEN 'Laboratory'::TEXT
      WHEN 'operation_theater' THEN 'Operation Theater'::TEXT
      WHEN 'cssu_cssd' THEN 'CSSU/CSSD'::TEXT
      WHEN 'radiology' THEN 'Radiology & Radiography'::TEXT
      WHEN 'klinik_pakar' THEN 'Klinik Pakar'::TEXT
      WHEN 'haemodialysis' THEN 'Haemodialysis'::TEXT
      WHEN 'driver_room' THEN 'Driver Room'::TEXT
      WHEN 'hospital_office' THEN 'Hospital Office'::TEXT
      WHEN 'front_desk' THEN 'Front Desk'::TEXT
      WHEN 'billing' THEN 'Financial & Billing'::TEXT
      WHEN 'hr' THEN 'Human Resources'::TEXT
      WHEN 'asset' THEN 'Asset Management'::TEXT
      WHEN 'reports' THEN 'Advanced Reports'::TEXT
      ELSE p_module_code::TEXT
    END AS module_name,
    CASE p_module_code
      WHEN 'pharmacy_logistics' THEN 'Central pharmacy logistics, inventory, procurement, and distribution'::TEXT
      WHEN 'pharmacy_substore' THEN 'Substore inventory and stock management'::TEXT
      WHEN 'pharmacy_outpatient' THEN 'Outpatient dispensing and prescription management'::TEXT
      WHEN 'pharmacy_emergency' THEN 'Emergency pharmacy operations'::TEXT
      WHEN 'pharmacy_inpatient' THEN 'Inpatient medication management'::TEXT
      WHEN 'pharmacy_galenical' THEN 'Extemporaneous preparation and prepacking'::TEXT
      WHEN 'general_ward' THEN 'General ward patient management'::TEXT
      WHEN 'paediatric_ward' THEN 'Paediatric patient care and management'::TEXT
      WHEN 'maternity_ward' THEN 'Maternity and obstetrics care'::TEXT
      WHEN 'emergency_trauma' THEN 'Emergency and trauma department management'::TEXT
      WHEN 'laboratory' THEN 'Laboratory tests and results management'::TEXT
      WHEN 'operation_theater' THEN 'Operation theater scheduling and management'::TEXT
      WHEN 'cssu_cssd' THEN 'Central Sterile Supply Unit management'::TEXT
      WHEN 'radiology' THEN 'Imaging and radiology services'::TEXT
      WHEN 'klinik_pakar' THEN 'Specialist clinic management'::TEXT
      WHEN 'haemodialysis' THEN 'Haemodialysis unit management'::TEXT
      WHEN 'driver_room' THEN 'Driver and transport management'::TEXT
      WHEN 'hospital_office' THEN 'Hospital administration office'::TEXT
      WHEN 'front_desk' THEN 'Reception and registration'::TEXT
      WHEN 'billing' THEN 'Manage billing and financial operations'::TEXT
      WHEN 'hr' THEN 'Manage HR operations and employee data'::TEXT
      WHEN 'asset' THEN 'Manage hospital assets and equipment'::TEXT
      WHEN 'reports' THEN 'Access advanced reporting and analytics'::TEXT
      ELSE ''::TEXT
    END AS module_description;
END;
$$ LANGUAGE plpgsql;

-- Sync all existing enabled modules to departments
DO $$
DECLARE
  module_record RECORD;
  module_info RECORD;
BEGIN
  -- Loop through all enabled hospital modules
  FOR module_record IN 
    SELECT 
      hospital_id,
      module_code,
      is_enabled
    FROM hospital_modules
    WHERE is_enabled = true
  LOOP
    -- Get module info
    SELECT * INTO module_info FROM get_module_info(module_record.module_code);
    
    IF module_info.module_name IS NOT NULL THEN
      -- Sync to department
      PERFORM sync_module_to_department(
        module_record.hospital_id,
        module_record.module_code,
        module_info.module_name,
        module_info.module_description,
        module_record.is_enabled
      );
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to automatically sync departments when modules are enabled/disabled
CREATE OR REPLACE FUNCTION trigger_sync_module_to_department()
RETURNS TRIGGER AS $$
DECLARE
  module_info RECORD;
BEGIN
  -- Get module info
  SELECT * INTO module_info FROM get_module_info(NEW.module_code);
  
  IF module_info.module_name IS NOT NULL THEN
    -- Sync to department
    PERFORM sync_module_to_department(
      NEW.hospital_id,
      NEW.module_code,
      module_info.module_name,
      module_info.module_description,
      NEW.is_enabled
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_module_to_department_trigger ON hospital_modules;
CREATE TRIGGER sync_module_to_department_trigger
  AFTER INSERT OR UPDATE OF is_enabled ON hospital_modules
  FOR EACH ROW
  WHEN (NEW.is_enabled IS NOT NULL)
  EXECUTE FUNCTION trigger_sync_module_to_department();

-- Comment
COMMENT ON FUNCTION sync_module_to_department IS 'Syncs a hospital module to its corresponding department';
COMMENT ON FUNCTION trigger_sync_module_to_department IS 'Trigger function to automatically sync modules to departments when enabled/disabled';




-- >>>>>>>>>>>>>>> FILE: 020_add_departments_head_of_department_fkey.sql <<<<<<<<<<<<<<<
-- Migration: Add foreign key constraint for departments.head_of_department_id
-- This allows Supabase to properly resolve the relationship between departments and users

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'departments_head_of_department_id_fkey'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE departments
    ADD CONSTRAINT departments_head_of_department_id_fkey
    FOREIGN KEY (head_of_department_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_departments_head_of_department_id 
    ON departments(head_of_department_id);
  END IF;
END $$;

-- Comment
COMMENT ON CONSTRAINT departments_head_of_department_id_fkey ON departments IS 
'Foreign key to users table for the head of department';




-- >>>>>>>>>>>>>>> FILE: 021_create_permissions_system.sql <<<<<<<<<<<<<<<
-- Migration: Create Permissions and Role Permissions System
-- This creates the tables needed for granular permission management

-- ============================================
-- 1. Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  module TEXT NOT NULL,
  feature TEXT, -- Specific feature within module (e.g., 'inventory_view', 'inventory_edit')
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_feature ON permissions(feature);

-- ============================================
-- 2. Role Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_by ON role_permissions(granted_by);

-- ============================================
-- 3. Updated_at Triggers
-- ============================================
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Seed Default Permissions
-- ============================================
-- Pharmacy Logistics Permissions
INSERT INTO permissions (permission_code, permission_name, module, feature, description) VALUES
-- Inventory Management
('pharmacy_logistics.inventory.view', 'View Inventory', 'pharmacy_logistics', 'inventory', 'View inventory items and stock levels'),
('pharmacy_logistics.inventory.create', 'Create Inventory Item', 'pharmacy_logistics', 'inventory', 'Add new inventory items'),
('pharmacy_logistics.inventory.edit', 'Edit Inventory Item', 'pharmacy_logistics', 'inventory', 'Modify existing inventory items'),
('pharmacy_logistics.inventory.delete', 'Delete Inventory Item', 'pharmacy_logistics', 'inventory', 'Remove inventory items'),
('pharmacy_logistics.inventory.adjust', 'Adjust Stock', 'pharmacy_logistics', 'inventory', 'Adjust stock quantities'),
-- Drug Catalog
('pharmacy_logistics.drug_catalog.view', 'View Drug Catalog', 'pharmacy_logistics', 'drug_catalog', 'View drug catalog'),
('pharmacy_logistics.drug_catalog.create', 'Add Drug', 'pharmacy_logistics', 'drug_catalog', 'Add new drugs to catalog'),
('pharmacy_logistics.drug_catalog.edit', 'Edit Drug', 'pharmacy_logistics', 'drug_catalog', 'Modify drug information'),
('pharmacy_logistics.drug_catalog.delete', 'Delete Drug', 'pharmacy_logistics', 'drug_catalog', 'Remove drugs from catalog'),
-- Non-Drug Catalog
('pharmacy_logistics.non_drug_catalog.view', 'View Non-Drug Catalog', 'pharmacy_logistics', 'non_drug_catalog', 'View non-drug items catalog'),
('pharmacy_logistics.non_drug_catalog.create', 'Add Non-Drug Item', 'pharmacy_logistics', 'non_drug_catalog', 'Add new non-drug items'),
('pharmacy_logistics.non_drug_catalog.edit', 'Edit Non-Drug Item', 'pharmacy_logistics', 'non_drug_catalog', 'Modify non-drug items'),
('pharmacy_logistics.non_drug_catalog.delete', 'Delete Non-Drug Item', 'pharmacy_logistics', 'non_drug_catalog', 'Remove non-drug items'),
-- Purchase Orders
('pharmacy_logistics.purchase_order.view', 'View Purchase Orders', 'pharmacy_logistics', 'purchase_order', 'View purchase orders'),
('pharmacy_logistics.purchase_order.create', 'Create Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Create new purchase orders'),
('pharmacy_logistics.purchase_order.edit', 'Edit Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Modify purchase orders'),
('pharmacy_logistics.purchase_order.approve', 'Approve Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Approve purchase orders'),
('pharmacy_logistics.purchase_order.delete', 'Delete Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Delete purchase orders'),
-- Goods Receipt
('pharmacy_logistics.goods_receipt.view', 'View Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'View goods receipts'),
('pharmacy_logistics.goods_receipt.create', 'Create Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'Create goods receipts'),
('pharmacy_logistics.goods_receipt.edit', 'Edit Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'Modify goods receipts'),
('pharmacy_logistics.goods_receipt.approve', 'Approve Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'Approve goods receipts'),
-- Distribution
('pharmacy_logistics.distribution.view', 'View Distribution', 'pharmacy_logistics', 'distribution', 'View distribution records'),
('pharmacy_logistics.distribution.create', 'Create Distribution', 'pharmacy_logistics', 'distribution', 'Create distribution records'),
('pharmacy_logistics.distribution.edit', 'Edit Distribution', 'pharmacy_logistics', 'distribution', 'Modify distribution records'),
('pharmacy_logistics.distribution.approve', 'Approve Distribution', 'pharmacy_logistics', 'distribution', 'Approve distribution requests'),
-- Reports
('pharmacy_logistics.reports.view', 'View Reports', 'pharmacy_logistics', 'reports', 'View pharmacy logistics reports'),
('pharmacy_logistics.reports.export', 'Export Reports', 'pharmacy_logistics', 'reports', 'Export reports to various formats'),
-- Dashboard
('pharmacy_logistics.dashboard.view', 'View Dashboard', 'pharmacy_logistics', 'dashboard', 'Access pharmacy logistics dashboard')
ON CONFLICT (permission_code) DO NOTHING;

-- General Administration Permissions
INSERT INTO permissions (permission_code, permission_name, module, feature, description) VALUES
-- Users
('admin.users.view', 'View Users', 'admin', 'users', 'View user list and details'),
('admin.users.create', 'Create User', 'admin', 'users', 'Create new users'),
('admin.users.edit', 'Edit User', 'admin', 'users', 'Modify user information'),
('admin.users.delete', 'Delete User', 'admin', 'users', 'Remove users'),
('admin.users.activate', 'Activate/Deactivate User', 'admin', 'users', 'Change user status'),
-- Departments
('admin.departments.view', 'View Departments', 'admin', 'departments', 'View department list'),
('admin.departments.create', 'Create Department', 'admin', 'departments', 'Create new departments'),
('admin.departments.edit', 'Edit Department', 'admin', 'departments', 'Modify departments'),
('admin.departments.delete', 'Delete Department', 'admin', 'departments', 'Remove departments'),
-- Roles & Permissions
('admin.roles.view', 'View Roles', 'admin', 'roles', 'View role list'),
('admin.roles.create', 'Create Role', 'admin', 'roles', 'Create new roles'),
('admin.roles.edit', 'Edit Role', 'admin', 'roles', 'Modify roles'),
('admin.roles.delete', 'Delete Role', 'admin', 'roles', 'Remove roles'),
('admin.roles.manage_permissions', 'Manage Permissions', 'admin', 'roles', 'Assign permissions to roles'),
-- Access Requests
('admin.access_requests.view', 'View Access Requests', 'admin', 'access_requests', 'View access request list'),
('admin.access_requests.approve', 'Approve Access Requests', 'admin', 'access_requests', 'Approve or reject access requests'),
-- Memos
('admin.memos.view', 'View Memos', 'admin', 'memos', 'View memo list'),
('admin.memos.create', 'Create Memo', 'admin', 'memos', 'Create new memos'),
('admin.memos.edit', 'Edit Memo', 'admin', 'memos', 'Modify memos'),
('admin.memos.approve', 'Approve Memo', 'admin', 'memos', 'Approve memo submissions'),
('admin.memos.delete', 'Delete Memo', 'admin', 'memos', 'Remove memos'),
-- Sensitive Data Requests
('admin.sensitive_data.view', 'View Sensitive Data Requests', 'admin', 'sensitive_data', 'View sensitive data access requests'),
('admin.sensitive_data.approve', 'Approve Sensitive Data Requests', 'admin', 'sensitive_data', 'Approve or deny sensitive data access')
ON CONFLICT (permission_code) DO NOTHING;

-- Comments
COMMENT ON TABLE permissions IS 'System permissions for controlling access to features and pages';
COMMENT ON TABLE role_permissions IS 'Mapping of permissions to roles';
COMMENT ON COLUMN permissions.module IS 'Module name (e.g., pharmacy_logistics, admin)';
COMMENT ON COLUMN permissions.feature IS 'Specific feature within module (e.g., inventory, purchase_order)';




-- >>>>>>>>>>>>>>> FILE: 022_allow_public_hospital_read_for_access_requests.sql <<<<<<<<<<<<<<<
-- Migration: Allow public read access to active hospitals and departments for access requests
-- This allows unauthenticated users to see which hospitals and departments they can request access to

-- ============================================
-- 1. Hospitals Table - Public Read Access
-- ============================================

-- Policy: Allow anyone (including unauthenticated users) to view active hospitals
-- This is needed for the access request form where users need to select a hospital
CREATE POLICY "public_read_active_hospitals"
  ON hospitals
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Add comment
COMMENT ON POLICY "public_read_active_hospitals" ON hospitals IS 
  'Allows public read access to active hospitals for access request forms';

-- ============================================
-- 2. Departments Table - Public Read Access
-- ============================================

-- Enable RLS on departments if not already enabled
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (including unauthenticated users) to view active departments
-- This is needed for the access request form where users need to select a department
CREATE POLICY "public_read_active_departments"
  ON departments
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Add comment
COMMENT ON POLICY "public_read_active_departments" ON departments IS 
  'Allows public read access to active departments for access request forms';




-- >>>>>>>>>>>>>>> FILE: 023_fix_access_requests_public_insert.sql <<<<<<<<<<<<<<<
-- Migration: Fix access_requests RLS policy to allow anonymous users to insert
-- The access request form should be accessible to unauthenticated users

-- Drop the existing policy
DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;

-- Create new policy that allows both authenticated and anonymous users to insert
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests';




-- >>>>>>>>>>>>>>> FILE: 024_create_avatars_storage_bucket.sql <<<<<<<<<<<<<<<
-- Migration: Create avatar storage bucket for profile photos
-- This bucket stores user profile photos and access request photos
-- Note: The bucket name is 'avatar' (singular), not 'avatars'

-- IMPORTANT: Storage buckets and policies must be created via Supabase Dashboard
-- SQL migrations cannot create buckets or modify storage.objects policies directly
-- if you don't have superuser/postgres role permissions.

-- ============================================
-- MANUAL SETUP REQUIRED:
-- ============================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket named 'avatar'
-- 3. Set it to Public (recommended for profile photos)
-- 4. After creating the bucket, run the policies below OR create them via Dashboard
--
-- To create policies via Dashboard:
-- - Go to Storage → avatar bucket → Policies
-- - Add the policies listed below manually
-- ============================================

-- ============================================
-- RLS Policies for avatars bucket
-- ============================================
-- IMPORTANT: If you get permission errors running this migration,
-- you need to create the storage policies manually via Supabase Dashboard:
--
-- 1. Go to Supabase Dashboard → Storage → avatar bucket → Policies
-- 2. Create the following policies manually:
--
-- Policy 1: "Anyone can upload access request photos"
--   - Operation: INSERT
--   - Target roles: anon, authenticated
--   - WITH CHECK expression:
--     bucket_id = 'avatar' AND (storage.foldername(name))[1] = 'access-requests'
--
-- Policy 2: "Users can upload their own avatar"
--   - Operation: INSERT
--   - Target roles: authenticated
--   - WITH CHECK expression:
--     bucket_id = 'avatar' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 3: "Public can read avatars"
--   - Operation: SELECT
--   - Target roles: anon, authenticated
--   - USING expression:
--     bucket_id = 'avatar'
--
-- Policy 4: "Users can update their own avatar"
--   - Operation: UPDATE
--   - Target roles: authenticated
--   - USING expression:
--     bucket_id = 'avatar' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 5: "Users can delete their own avatar"
--   - Operation: DELETE
--   - Target roles: authenticated
--   - USING expression:
--     bucket_id = 'avatar' AND auth.uid()::text = (storage.foldername(name))[1]
-- ============================================

-- Try to create policies (will fail gracefully if no permissions)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can upload access request photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors when dropping policies
    NULL;
END $$;

-- Create policies (will fail if no permissions - create manually via Dashboard)
DO $$
BEGIN
  CREATE POLICY "Anyone can upload access request photos"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      bucket_id = 'avatar' AND
      (storage.foldername(name))[1] = 'access-requests'
    );

  CREATE POLICY "Users can upload their own avatar"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatar' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "Public can read avatars"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'avatars');

  CREATE POLICY "Users can update their own avatar"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatar' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "Users can delete their own avatar"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatar' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Cannot create storage policies via migration. Please create them manually via Supabase Dashboard (see instructions above).';
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating storage policies: %. Please create them manually via Supabase Dashboard.', SQLERRM;
END $$;




-- >>>>>>>>>>>>>>> FILE: 025_fix_avatar_storage_policy.sql <<<<<<<<<<<<<<<
-- Migration: Fix avatar storage bucket policy
-- Run this in Supabase SQL Editor to create the storage policy

-- Drop existing policies for avatar bucket
DROP POLICY IF EXISTS "Anyone can upload access request photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- Create a simple policy that allows all uploads to avatar bucket
-- This is the simplest policy that should work
CREATE POLICY "Allow all uploads to avatar bucket"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'avatar');

-- Also allow public read access
CREATE POLICY "Public can read avatar bucket"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatar');

-- Add comments
COMMENT ON POLICY "Allow all uploads to avatar bucket" ON storage.objects IS 
  'Allows anonymous and authenticated users to upload files to the avatar bucket';
COMMENT ON POLICY "Public can read avatar bucket" ON storage.objects IS 
  'Allows public read access to files in the avatar bucket';




-- >>>>>>>>>>>>>>> FILE: 026_ensure_access_requests_public_insert.sql <<<<<<<<<<<<<<<
-- Migration: Ensure access_requests allows anonymous inserts
-- This fixes the RLS policy to allow unauthenticated users to submit access requests

-- Drop ALL existing insert policies on access_requests to avoid conflicts
DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON access_requests;

-- Create a single, clear policy that allows both anon and authenticated users
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify the policy was created (this will show an error if it fails, which is helpful)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests'
    AND roles::text LIKE '%anon%'
  ) THEN
    RAISE EXCEPTION 'Policy creation failed - anon role not found in policy';
  END IF;
END $$;

-- Add comment
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests';




-- >>>>>>>>>>>>>>> FILE: 027_diagnose_and_fix_access_requests.sql <<<<<<<<<<<<<<<
-- Migration: Diagnose and fix access_requests RLS policy issue
-- This will check existing policies and create the correct one

-- First, let's see what policies exist
-- (This is just for reference - you can run this separately to check)
-- SELECT policyname, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'access_requests';

-- Drop ALL existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "public_insert_access_requests" ON access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON access_requests;

-- IMPORTANT: Create the policy with explicit role specification
-- Make sure 'anon' is included in the roles
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify it was created (this query will show if it worked)
DO $$
DECLARE
  policy_exists BOOLEAN;
  has_anon_role BOOLEAN;
BEGIN
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests'
  ) INTO policy_exists;
  
  -- Check if anon role is in the policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests'
    AND 'anon' = ANY(roles)
  ) INTO has_anon_role;
  
  IF NOT policy_exists THEN
    RAISE EXCEPTION 'Policy was not created!';
  END IF;
  
  IF NOT has_anon_role THEN
    RAISE EXCEPTION 'Policy exists but anon role is missing!';
  END IF;
  
  RAISE NOTICE 'Policy created successfully with anon role';
END $$;

-- Add comment
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests';




-- >>>>>>>>>>>>>>> FILE: 028_final_fix_access_requests_rls.sql <<<<<<<<<<<<<<<
-- Migration: Final fix for access_requests RLS - Allow anonymous inserts
-- This is a comprehensive fix that ensures the policy works correctly

-- Step 1: Drop ALL existing policies on access_requests to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'access_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON access_requests', r.policyname);
  END LOOP;
END $$;

-- Step 2: Create the public insert policy FIRST (most permissive)
-- This MUST be created first and MUST include 'anon' role
CREATE POLICY "public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 3: Create admin policies for SELECT/UPDATE/DELETE (these won't affect INSERT)
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

CREATE POLICY "hospital_admin_scope_access_requests"
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
    OR
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
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
    OR
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

-- Step 4: Service role policy (for admin operations)
CREATE POLICY "service_role_full_access_access_requests"
  ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Verify the public insert policy was created correctly
DO $$
DECLARE
  policy_count INTEGER;
  has_anon BOOLEAN;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'access_requests' 
    AND policyname = 'public_insert_access_requests';
  
  -- Check if anon role exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'public_insert_access_requests'
      AND 'anon' = ANY(roles)
  ) INTO has_anon;
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'CRITICAL: Policy public_insert_access_requests was NOT created!';
  END IF;
  
  IF NOT has_anon THEN
    RAISE EXCEPTION 'CRITICAL: Policy exists but anon role is missing! Roles: %', 
      (SELECT array_agg(unnest(roles))::text FROM pg_policies 
       WHERE schemaname = 'public' 
         AND tablename = 'access_requests' 
         AND policyname = 'public_insert_access_requests');
  END IF;
  
  RAISE NOTICE 'SUCCESS: Policy created correctly with anon role';
END $$;

-- Add comments
COMMENT ON POLICY "public_insert_access_requests" ON access_requests IS 
  'Allows both authenticated and anonymous users to create access requests - MUST include anon role';




-- >>>>>>>>>>>>>>> FILE: 029_ensure_anonymous_access_requests_insert.sql <<<<<<<<<<<<<<<
-- Migration: Ensure anonymous users can insert access requests
-- This fixes the RLS policy violation for unauthenticated users submitting access requests

-- Step 1: Drop ALL existing policies on access_requests to start completely fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'access_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON access_requests', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the public insert policy FIRST and MOST PERMISSIVE
-- This MUST allow both anon and authenticated roles
CREATE POLICY "allow_public_insert_access_requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "allow_public_insert_access_requests" ON access_requests IS 
  'Allows anonymous and authenticated users to create access requests - required for public form submission';

-- Step 4: Create admin policies for SELECT/UPDATE/DELETE operations
-- These won't affect INSERT operations

-- System Admin full access
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

-- Hospital Admin scope access (for their hospital only)
CREATE POLICY "hospital_admin_scope_access_requests"
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
    OR
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
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND users.status = 'active'
    )
    OR
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

-- Service role full access (for backend operations)
CREATE POLICY "service_role_full_access_access_requests"
  ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Verify the policies were created correctly
DO $$
DECLARE
  policy_count INTEGER;
  insert_policy_exists BOOLEAN;
  has_anon_role BOOLEAN;
BEGIN
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'access_requests';
  
  -- Check if insert policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'allow_public_insert_access_requests'
      AND cmd = 'INSERT'
  ) INTO insert_policy_exists;
  
  -- Check if anon role is included in the insert policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'allow_public_insert_access_requests'
      AND 'anon' = ANY(roles)
  ) INTO has_anon_role;
  
  IF NOT insert_policy_exists THEN
    RAISE EXCEPTION 'CRITICAL: Insert policy was NOT created!';
  END IF;
  
  IF NOT has_anon_role THEN
    RAISE EXCEPTION 'CRITICAL: Insert policy exists but anon role is missing!';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Policies created correctly. Total policies: %, Insert policy: %, Has anon role: %', 
    policy_count, insert_policy_exists, has_anon_role;
END $$;




-- >>>>>>>>>>>>>>> FILE: 030_add_hospital_admin_insert_users_policy.sql <<<<<<<<<<<<<<<
-- Migration: Add INSERT policy for Hospital Admins to create users
-- This allows Hospital Admins to create new users when approving access requests for their hospital

-- ============================================
-- 1. Enable RLS on users table (if not already)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing INSERT policy if exists
-- ============================================
DROP POLICY IF EXISTS "hospital_admin_insert_users" ON users;
DROP POLICY IF EXISTS "system_admin_insert_users" ON users;

-- ============================================
-- 3. Policy: System Admin can insert any user
-- ============================================
CREATE POLICY "system_admin_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
  );

-- ============================================
-- 4. Policy: Hospital Admin can insert users for their hospital
-- ============================================
-- This allows Hospital Admins to create new users when approving access requests
-- The user being created must belong to the same hospital as the Hospital Admin
CREATE POLICY "hospital_admin_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Hospital Admin can only create users in their own hospital
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = users.hospital_id
        AND u.status = 'active'
    )
    -- Ensure the new user is not a system admin (only System Admin can create system admins)
    AND users.role_id != (SELECT id FROM roles WHERE role_code = 'system_admin')
  );

-- Add comment
COMMENT ON POLICY "hospital_admin_insert_users" ON users IS 
  'Allows Hospital Admins to create new users in their hospital when approving access requests';




-- >>>>>>>>>>>>>>> FILE: 031_create_emergency_contacts_table.sql <<<<<<<<<<<<<<<
-- Migration: Create emergency_contacts table
-- This table stores emergency contact information for users

-- ============================================
-- 1. Emergency Contacts Table
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for emergency_contacts
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_phone_primary ON emergency_contacts(phone_primary);

-- ============================================
-- 2. Updated_at Trigger
-- ============================================
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Policy: Users can view their own emergency contacts
CREATE POLICY "users_view_own_emergency_contacts"
  ON emergency_contacts
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own emergency contacts
    user_id = auth.uid()
    OR
    -- System Admin can see all
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
    OR
    -- Hospital Admin can see emergency contacts for users in their hospital
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN users target_user ON target_user.id = emergency_contacts.user_id
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = target_user.hospital_id
        AND u.status = 'active'
    )
  );

-- Policy: System Admin can insert/update/delete any emergency contact
CREATE POLICY "system_admin_manage_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
  );

-- Policy: Hospital Admin can insert/update/delete emergency contacts for users in their hospital
CREATE POLICY "hospital_admin_manage_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN users target_user ON target_user.id = emergency_contacts.user_id
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = target_user.hospital_id
        AND u.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN users target_user ON target_user.id = emergency_contacts.user_id
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = target_user.hospital_id
        AND u.status = 'active'
    )
  );

-- Policy: Users can manage their own emergency contacts
CREATE POLICY "users_manage_own_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE emergency_contacts IS 'Emergency contact information for users';
COMMENT ON COLUMN emergency_contacts.relationship IS 'Relationship to the user (e.g., parent, spouse, sibling, other)';
COMMENT ON COLUMN emergency_contacts.phone_primary IS 'Primary phone number for emergency contact';
COMMENT ON COLUMN emergency_contacts.phone_secondary IS 'Secondary phone number (optional)';




-- >>>>>>>>>>>>>>> FILE: 032_add_password_to_access_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add password fields to access_requests table
-- This allows users to set their password during access request submission

-- ============================================
-- 1. Add password_hash column (for verification/backup)
-- ============================================
ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ============================================
-- 2. Add password_encrypted column (for Supabase Auth account creation)
-- ============================================
-- Note: This stores the password encrypted so it can be used to create Supabase Auth account
-- The password is encrypted using a server-side key and will be deleted after account creation
ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS password_encrypted TEXT;

-- Add comments
COMMENT ON COLUMN access_requests.password_hash IS 
  'PBKDF2 hashed password for verification/backup purposes';

COMMENT ON COLUMN access_requests.password_encrypted IS 
  'Encrypted plain password (temporary, for Supabase Auth account creation). Should be deleted after approval.';




-- >>>>>>>>>>>>>>> FILE: 033_fix_system_admin_id_mismatch.sql <<<<<<<<<<<<<<<
-- Migration: Fix System Admin ID Mismatch
-- This migration updates public.users.id to match auth.users.id for System Admin
-- 
-- PROBLEM: System Admin has mismatched IDs:
--   - public.users.id: 72e8e8b4-63c0-4973-9055-b3590b468bb8
--   - auth.users.id: d2967f42-41f1-4bea-80fc-eeed0959723e
--
-- SOLUTION: Update public.users.id to match auth.users.id
-- This requires updating all foreign key references

DO $$
DECLARE
  old_user_id UUID := '72e8e8b4-63c0-4973-9055-b3590b468bb8';
  new_user_id UUID := 'd2967f42-41f1-4bea-80fc-eeed0959723e';
  system_admin_email TEXT := 'amri.amit77@gmail.com';
  affected_rows INTEGER;
BEGIN
  -- Verify the auth user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = new_user_id AND email = system_admin_email) THEN
    RAISE EXCEPTION 'Auth user with ID % and email % does not exist. Cannot proceed with migration.', new_user_id, system_admin_email;
  END IF;

  -- Verify the public user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = old_user_id AND email = system_admin_email) THEN
    RAISE EXCEPTION 'Public user with ID % and email % does not exist. Cannot proceed with migration.', old_user_id, system_admin_email;
  END IF;

  -- Check if new_user_id already exists in public.users (should not)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = new_user_id) THEN
    RAISE EXCEPTION 'User ID % already exists in public.users. Cannot update. Please resolve manually.', new_user_id;
  END IF;

  RAISE NOTICE 'Starting System Admin ID migration from % to %', old_user_id, new_user_id;

  -- Update all foreign key references
  -- Note: We update in dependency order to avoid constraint violations

  -- 1. Update audit_logs
  UPDATE audit_logs SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % audit_logs records', affected_rows;

  -- 2. Update access_requests
  UPDATE access_requests SET reviewed_by = new_user_id WHERE reviewed_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % access_requests records', affected_rows;

  -- 3. Update departments
  UPDATE departments SET head_of_department_id = new_user_id WHERE head_of_department_id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % departments records', affected_rows;

  -- 4. Update emergency_contacts
  UPDATE emergency_contacts SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % emergency_contacts records', affected_rows;

  -- 5. Update hospital_logs
  UPDATE hospital_logs SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % hospital_logs records', affected_rows;

  -- 6. Update hospital_modules (enabled_by)
  UPDATE hospital_modules SET enabled_by = new_user_id WHERE enabled_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % hospital_modules.enabled_by records', affected_rows;

  -- 7. Update hospital_modules (disabled_by)
  UPDATE hospital_modules SET disabled_by = new_user_id WHERE disabled_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % hospital_modules.disabled_by records', affected_rows;

  -- 8. Update hospitals
  UPDATE hospitals SET admin_id = new_user_id WHERE admin_id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % hospitals records', affected_rows;

  -- 9. Update memos (created_by)
  UPDATE memos SET created_by = new_user_id WHERE created_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % memos.created_by records', affected_rows;

  -- 10. Update memos (approved_by)
  UPDATE memos SET approved_by = new_user_id WHERE approved_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % memos.approved_by records', affected_rows;

  -- 11. Update role_permissions
  UPDATE role_permissions SET granted_by = new_user_id WHERE granted_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % role_permissions records', affected_rows;

  -- 12. Update sensitive_data_access_logs
  UPDATE sensitive_data_access_logs SET accessed_by = new_user_id WHERE accessed_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % sensitive_data_access_logs records', affected_rows;

  -- 13. Update sensitive_data_requests (requestor_id)
  UPDATE sensitive_data_requests SET requestor_id = new_user_id WHERE requestor_id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % sensitive_data_requests.requestor_id records', affected_rows;

  -- 14. Update sensitive_data_requests (approved_by)
  UPDATE sensitive_data_requests SET approved_by = new_user_id WHERE approved_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % sensitive_data_requests.approved_by records', affected_rows;

  -- 15. Update system_alerts
  UPDATE system_alerts SET resolved_by = new_user_id WHERE resolved_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % system_alerts records', affected_rows;

  -- 16. Update system_backups
  UPDATE system_backups SET initiated_by = new_user_id WHERE initiated_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % system_backups records', affected_rows;

  -- 17. Update uploaded_files
  UPDATE uploaded_files SET uploaded_by = new_user_id WHERE uploaded_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % uploaded_files records', affected_rows;

  -- 18. Update users (created_by) - self-reference
  UPDATE users SET created_by = new_user_id WHERE created_by = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % users.created_by records', affected_rows;

  -- FINALLY: Update the users.id itself (this must be last)
  UPDATE users SET id = new_user_id WHERE id = old_user_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows = 1 THEN
    RAISE NOTICE '✅ Successfully updated System Admin user ID from % to %', old_user_id, new_user_id;
    RAISE NOTICE 'Migration completed successfully. System Admin can now log in.';
  ELSE
    RAISE EXCEPTION 'Failed to update users.id. Expected 1 row, but updated % rows.', affected_rows;
  END IF;

END $$;

-- Verification query (run this after migration to confirm)
-- SELECT 
--   u.id as public_users_id,
--   u.email,
--   a.id as auth_users_id,
--   CASE WHEN u.id = a.id THEN 'MATCH ✅' ELSE 'MISMATCH ❌' END as status
-- FROM public.users u
-- JOIN auth.users a ON u.email = a.email
-- WHERE u.email = 'amri.amit77@gmail.com';




-- >>>>>>>>>>>>>>> FILE: 034_extend_suppliers_for_catalog.sql <<<<<<<<<<<<<<<
-- Extend suppliers table with additional catalog fields
-- - supplier_type: drug / non_drug / both
-- - contact_person_phone: direct phone for person in charge (PIC)
-- - account_number: supplier bank account number
-- - account_document_url: URL to uploaded bank/account document (PDF)
-- - mof_certificate_url: URL to uploaded MOF certificate (PDF)
-- Also seed core Malaysian suppliers used by the Pharmacy Logistics module.

-- ================================
-- 1. New Columns
-- ================================

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS supplier_type TEXT CHECK (supplier_type IN ('drug', 'non_drug', 'both')),
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_document_url TEXT,
ADD COLUMN IF NOT EXISTS mof_certificate_url TEXT;

-- Helpful index for filtering by supplier_type
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_type ON suppliers(supplier_type);

COMMENT ON COLUMN suppliers.supplier_type IS 'Type of supplier: drug, non_drug, or both';
COMMENT ON COLUMN suppliers.contact_person_phone IS 'Direct phone number of the main person in charge (PIC)';
COMMENT ON COLUMN suppliers.account_number IS 'Primary bank account number for payments';
COMMENT ON COLUMN suppliers.account_document_url IS 'Storage URL of supporting document that confirms account number (PDF)';
COMMENT ON COLUMN suppliers.mof_certificate_url IS 'Storage URL of supplier MOF certificate (PDF)';

-- ================================
-- 2. Seed Core Malaysian Suppliers
-- ================================
-- NOTE:
-- - These records are seeded with NULL hospital_id so they can be
--   reused across hospitals.
-- - If the record already exists (matched by company_name), it will
--   NOT be duplicated.

INSERT INTO suppliers (
  hospital_id,
  supplier_code,
  company_name,
  contact_person,
  contact_person_phone,
  email,
  phone,
  address,
  registration_number,
  bank_account,
  bank_name,
  supplier_type,
  status,
  performance_rating,
  notes
)
SELECT
  NULL AS hospital_id,
  s.supplier_code,
  s.company_name,
  s.contact_person,
  s.contact_person_phone,
  s.email,
  s.phone,
  s.address,
  s.registration_number,
  s.bank_account,
  s.bank_name,
  s.supplier_type,
  'active' AS status,
  s.performance_rating,
  s.notes
FROM (
  VALUES
    -- Drug-focused suppliers
    ('SUP-PHARMA-PLB', 'Pharmaniaga Logistics Sdn Bhd', 'Corporate Sales Team', '+60-3-3342-9999', 'info@pharmaniaga.com', '+60-3-3342-9999',
     'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
     'ROC-000001', '8600-000000-01', 'Maybank', 'drug', 4.6, 'National drug distribution and logistics partner for MOH hospitals'),
    ('SUP-PHARMA-MSALLY', 'MS Ally Pharma Sdn Bhd', 'Sales Manager', '+60-3-0000-0000', 'sales@msally.com.my', '+60-3-0000-0000',
     'Petaling Jaya, Selangor, Malaysia',
     'ROC-000002', NULL, NULL, 'drug', 4.0, 'Regional pharmaceutical wholesaler and distributor'),
    ('SUP-PHARMA-BORNEO', 'Borneo Pharmacy Sdn Bhd', 'Key Account Manager', '+60-82-000000', 'info@borneopharmacy.com', '+60-82-000000',
     'Kuching, Sarawak, Malaysia',
     'ROC-000003', NULL, NULL, 'drug', 4.0, 'Drug and medical supplies distributor serving East Malaysia'),
    ('SUP-PHARMA-TERAJU', 'Teraju Farma Sdn Bhd', 'Business Development', '+60-3-0000-0001', 'info@terajufarma.com', '+60-3-0000-0001',
     'Shah Alam, Selangor, Malaysia',
     'ROC-000004', NULL, NULL, 'drug', 3.9, 'Supplier of oral and injectable medicines'),
    ('SUP-PHARMA-WIJA', 'Wija Pharma Sdn Bhd', 'Operations Manager', '+60-3-0000-0002', 'info@wijapharma.com', '+60-3-0000-0002',
     'Kuala Lumpur, Malaysia',
     'ROC-000005', NULL, NULL, 'drug', 3.9, 'General pharmaceutical and hospital supply company'),
    ('SUP-PHARMA-DUO', 'Duopharma (M) Sdn Bhd', 'Key Account Manager', '+60-3-6156-1234', 'info@duopharma.com', '+60-3-6156-1234',
     'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
     'ROC-234567', NULL, NULL, 'drug', 4.2, 'Local manufacturer and supplier of generic pharmaceuticals'),
    ('SUP-PHARMA-HANAN', 'Hanan Medicare Sdn Bhd', 'Sales Executive', '+60-3-0000-0003', 'sales@hananmedicare.com', '+60-3-0000-0003',
     'Selangor, Malaysia',
     'ROC-000006', NULL, NULL, 'drug', 3.8, 'Supplier of pharmacy and ward medicines'),
    ('SUP-PHARMA-2K', '2K Medicare Sdn Bhd', 'Sales Manager', '+60-3-0000-0004', 'info@2kmedicare.com', '+60-3-0000-0004',
     'Klang Valley, Selangor, Malaysia',
     'ROC-000007', NULL, NULL, 'drug', 3.8, 'Drug and consumable distributor to government facilities'),
    ('SUP-PHARMA-MEDIL', 'Mediliance Sdn Bhd', 'Tender & Contract Team', '+60-3-0000-0005', 'tender@mediliance.com', '+60-3-0000-0005',
     'Kuala Lumpur, Malaysia',
     'ROC-000008', NULL, NULL, 'both', 4.0, 'Panel supplier for selected APPL and MOF items'),
    ('SUP-PHARMA-QR', 'Quality Reputation Sdn Bhd', 'Account Manager', '+60-3-0000-0006', 'info@qualityreputation.com', '+60-3-0000-0006',
     'Selangor, Malaysia',
     'ROC-000009', NULL, NULL, 'both', 3.9, 'Supplier of pharmaceuticals and selected non-drug consumables'),

    -- Non-drug / medical device / oxygen suppliers
    ('SUP-ND-HOSPITECH', 'Hospitech Resources Sdn Bhd', 'Hospital Sales', '+60-3-0000-0010', 'sales@hospitech.com.my', '+60-3-0000-0010',
     'Selangor, Malaysia',
     'ROC-000010', NULL, NULL, 'non_drug', 4.1, 'Medical devices, consumables and ward equipment'),
    ('SUP-ND-AUREU', 'Aureumeux Sdn Bhd', 'Product Specialist', '+60-3-0000-0011', 'info@aureumeux.com', '+60-3-0000-0011',
     'Kuala Lumpur, Malaysia',
     'ROC-000011', NULL, NULL, 'non_drug', 3.8, 'Medical consumables and devices supplier'),
    ('SUP-ND-TEEPHAM', 'Teepham Medical Sdn Bhd', 'Sales Manager', '+60-3-0000-0012', 'sales@teepham.com', '+60-3-0000-0012',
     'Penang, Malaysia',
     'ROC-000012', NULL, NULL, 'non_drug', 3.9, 'Supplier of medical and surgical instruments'),
    ('SUP-ND-SMHEALTH', 'SM Health Care Sdn Bhd', 'Key Account Manager', '+60-3-0000-0013', 'info@smhealth.com.my', '+60-3-0000-0013',
     'Selangor, Malaysia',
     'ROC-000013', NULL, NULL, 'non_drug', 4.0, 'Surgical and ward consumables supplier'),
    ('SUP-ND-VONIC', 'Vonic Healthcare Sdn Bhd', 'Customer Service', '+60-3-0000-0014', 'info@vonic.com.my', '+60-3-0000-0014',
     'Selangor, Malaysia',
     'ROC-000014', NULL, NULL, 'non_drug', 3.8, 'Medical devices and rehabilitation equipment'),
    ('SUP-ND-LINDE', 'Linde Malaysia Sdn Bhd (Medical Oxygen)', 'Healthcare Segment', '+60-3-0000-0020', 'healthcare.my@linde.com', '+60-3-0000-0020',
     'Petaling Jaya, Selangor, Malaysia',
     'ROC-000015', NULL, NULL, 'non_drug', 4.5, 'Bulk and cylinder medical oxygen supplier'),
    ('SUP-ND-PRIMABUMI', 'Primabumi Sdn Bhd', 'Operations Manager', '+60-3-0000-0021', 'info@primabumi.com', '+60-3-0000-0021',
     'Selangor, Malaysia',
     'ROC-000016', NULL, NULL, 'non_drug', 3.9, 'Supplier of consumables and minor medical equipment'),
    ('SUP-ND-FUSION', 'Fusion Medic Sdn Bhd', 'Sales & Marketing', '+60-3-0000-0022', 'info@fusionmedic.com', '+60-3-0000-0022',
     'Kuala Lumpur, Malaysia',
     'ROC-000017', NULL, NULL, 'non_drug', 3.9, 'Diagnostic and clinical equipment supplier'),
    ('SUP-ND-MEDISARB', 'Medisarb Sdn Bhd', 'Product Specialist', '+60-3-0000-0023', 'info@medisarb.com', '+60-3-0000-0023',
     'Klang Valley, Malaysia',
     'ROC-000018', NULL, NULL, 'non_drug', 3.8, 'Non-drug medical consumables and equipment')
) AS s (
  supplier_code,
  company_name,
  contact_person,
  contact_person_phone,
  email,
  phone,
  address,
  registration_number,
  bank_account,
  bank_name,
  supplier_type,
  performance_rating,
  notes
)
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers existing
  WHERE existing.company_name = s.company_name
);





-- >>>>>>>>>>>>>>> FILE: 035_pharmacy_supplier_penalties.sql <<<<<<<<<<<<<<<
-- 035_pharmacy_supplier_penalties.sql

CREATE TABLE IF NOT EXISTS pharmacy_supplier_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    supplier_id UUID REFERENCES suppliers(id),
    po_id UUID REFERENCES pharmacy_purchase_orders(id),
    gr_id UUID REFERENCES pharmacy_goods_receipts(id),
    lpo_id UUID,
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('late_delivery', 'quality_issue', 'incomplete_delivery')),
    penalty_amount DECIMAL(15,2),
    penalty_percentage DECIMAL(5,2),
    days_delayed INTEGER DEFAULT 0,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'enforced', 'waived')),
    enforced_by UUID REFERENCES users(id),
    enforced_at TIMESTAMPTZ,
    waiver_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for pharmacy_supplier_penalties
ALTER TABLE pharmacy_supplier_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for hospital staff on penalties"
ON pharmacy_supplier_penalties FOR SELECT
USING (hospital_id IN (
  SELECT hospital_id FROM user_hospitals WHERE user_id = auth.uid()
));

CREATE POLICY "Enable insert for hospital staff on penalties"
ON pharmacy_supplier_penalties FOR INSERT
WITH CHECK (hospital_id IN (
  SELECT hospital_id FROM user_hospitals WHERE user_id = auth.uid()
));

CREATE POLICY "Enable update for hospital staff on penalties"
ON pharmacy_supplier_penalties FOR UPDATE
USING (hospital_id IN (
  SELECT hospital_id FROM user_hospitals WHERE user_id = auth.uid()
));

-- Alter credit note items to add item details
ALTER TABLE pharmacy_credit_note_items
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS item_code TEXT;



-- >>>>>>>>>>>>>>> FILE: 036_create_oxygen_return_documents.sql <<<<<<<<<<<<<<<
-- 036_create_oxygen_return_documents.sql
-- Migration to support return documents for medical oxygen cylinders

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_return_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  returned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  remarks TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, document_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_return_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_document_id UUID NOT NULL REFERENCES pharmacy_oxygen_return_documents(id) ON DELETE CASCADE,
  cylinder_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(return_document_id, cylinder_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_docs_hospital_id ON pharmacy_oxygen_return_documents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_docs_supplier_id ON pharmacy_oxygen_return_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_docs_created_at ON pharmacy_oxygen_return_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_doc_items_doc_id ON pharmacy_oxygen_return_document_items(return_document_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_doc_items_cylinder_id ON pharmacy_oxygen_return_document_items(cylinder_id);

-- Trigger for updated_at on pharmacy_oxygen_return_documents
CREATE TRIGGER update_pharmacy_oxygen_return_documents_updated_at
  BEFORE UPDATE ON pharmacy_oxygen_return_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE pharmacy_oxygen_return_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_return_document_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_oxygen_return_documents
CREATE POLICY "Users can manage return documents for their hospital"
  ON pharmacy_oxygen_return_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_return_documents.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_return_documents.hospital_id
    )
  );

-- Policies for pharmacy_oxygen_return_document_items
CREATE POLICY "Users can manage return document items for their hospital"
  ON pharmacy_oxygen_return_document_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_return_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_return_document_items.return_document_id
      AND u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_return_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_return_document_items.return_document_id
      AND u.id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pharmacy_oxygen_return_documents IS 'Documents sent to suppliers when returning empty cylinders';
COMMENT ON TABLE pharmacy_oxygen_return_document_items IS 'Cylinders included in return documents';



-- >>>>>>>>>>>>>>> FILE: 037_alter_reception_status_constraint.sql <<<<<<<<<<<<<<<
-- 037_alter_reception_status_constraint.sql
-- Alter status CHECK constraint for pharmacy_oxygen_reception_records to support UI statuses

ALTER TABLE pharmacy_oxygen_reception_records 
DROP CONSTRAINT IF EXISTS pharmacy_oxygen_reception_records_status_check;

ALTER TABLE pharmacy_oxygen_reception_records
ADD CONSTRAINT pharmacy_oxygen_reception_records_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'pending_invoice', 'outstanding_po'));

-- Make cylinder_id nullable in pharmacy_oxygen_reception_items
ALTER TABLE pharmacy_oxygen_reception_items 
ALTER COLUMN cylinder_id DROP NOT NULL;




-- >>>>>>>>>>>>>>> FILE: 038_backfill_return_documents.sql <<<<<<<<<<<<<<<
-- 038_backfill_return_documents.sql
-- Migration to backfill return documents and items from historical cylinder movements of type 'sent_to_supplier'

DO $$
DECLARE
  supplier_record_id UUID;
  hospital_record_id UUID := '85bb6adc-b868-428b-83f4-e5af2f5cf904';
  default_user_id UUID := '88dc2fa7-e943-45ba-a889-8756c0265b48'; -- User who recorded the movements
  doc_id UUID;
  item_row record;
  current_doc_num TEXT;
  prev_batch_id INT := -1;
BEGIN
  -- Get Supplier ID for LINDE
  SELECT id INTO supplier_record_id 
  FROM suppliers 
  WHERE company_name = 'LINDE EOX SDN BHD (CAW. MIRI)' 
  LIMIT 1;

  IF supplier_record_id IS NULL THEN
    RAISE NOTICE 'Supplier LINDE EOX SDN BHD not found, cannot backfill return documents.';
    RETURN;
  END IF;

  -- Temporary table to calculate batches of movements within 5 minutes of each other
  CREATE TEMP TABLE temp_movement_batches AS
  WITH ordered_movements AS (
    SELECT 
      id as movement_id,
      hospital_id,
      cylinder_id,
      moved_by,
      moved_at,
      remarks,
      LAG(moved_at) OVER (ORDER BY moved_at) as prev_moved_at
    FROM pharmacy_oxygen_cylinder_movements
    WHERE movement_type = 'sent_to_supplier'
  ),
  marked_batches AS (
    SELECT 
      *,
      CASE 
        WHEN prev_moved_at IS NULL OR moved_at - prev_moved_at > INTERVAL '5 minutes' THEN 1
        ELSE 0
      END as is_new_batch
    FROM ordered_movements
  ),
  numbered_batches AS (
    SELECT 
      *,
      SUM(is_new_batch) OVER (ORDER BY moved_at) as batch_id
    FROM marked_batches
  )
  SELECT * FROM numbered_batches;

  -- Loop through each cylinder movement in our batches and construct return documents + items
  FOR item_row IN (
    SELECT * FROM temp_movement_batches ORDER BY batch_id, moved_at
  ) LOOP
    -- When a new batch is encountered, create the parent document
    IF item_row.batch_id <> prev_batch_id THEN
      prev_batch_id := item_row.batch_id;
      doc_id := gen_random_uuid();
      
      -- Format: O2-RET-YYYYMMDD-batch_id
      current_doc_num := 'O2-RET-' || to_char(item_row.moved_at, 'YYYYMMDD') || '-' || LPAD(item_row.batch_id::text, 4, '0');
      
      INSERT INTO pharmacy_oxygen_return_documents (
        id,
        hospital_id,
        document_number,
        supplier_id,
        status,
        returned_date,
        remarks,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        doc_id,
        item_row.hospital_id,
        current_doc_num,
        supplier_record_id,
        'completed',
        item_row.moved_at,
        item_row.remarks,
        COALESCE(item_row.moved_by, default_user_id),
        item_row.moved_at,
        item_row.moved_at
      );
    END IF;

    -- Insert the document item
    INSERT INTO pharmacy_oxygen_return_document_items (
      return_document_id,
      cylinder_id,
      created_at
    ) VALUES (
      doc_id,
      item_row.cylinder_id,
      item_row.moved_at
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  DROP TABLE IF EXISTS temp_movement_batches;
END $$;



-- >>>>>>>>>>>>>>> FILE: 039_create_oxygen_request_documents.sql <<<<<<<<<<<<<<<
-- 039_create_oxygen_request_documents.sql
-- Migration to support request documents for medical oxygen cylinders

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_request_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  remarks TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, document_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_request_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_document_id UUID NOT NULL REFERENCES pharmacy_oxygen_request_documents(id) ON DELETE CASCADE,
  size_code TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  usage_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oxygen_req_docs_hospital_id ON pharmacy_oxygen_request_documents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_req_docs_supplier_id ON pharmacy_oxygen_request_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_req_docs_created_at ON pharmacy_oxygen_request_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oxygen_req_doc_items_doc_id ON pharmacy_oxygen_request_document_items(request_document_id);

-- Trigger for updated_at on pharmacy_oxygen_request_documents
CREATE OR REPLACE TRIGGER update_pharmacy_oxygen_request_documents_updated_at
  BEFORE UPDATE ON pharmacy_oxygen_request_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE pharmacy_oxygen_request_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_request_document_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_oxygen_request_documents
CREATE POLICY "Users can manage request documents for their hospital"
  ON pharmacy_oxygen_request_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_request_documents.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_request_documents.hospital_id
    )
  );

-- Policies for pharmacy_oxygen_request_document_items
CREATE POLICY "Users can manage request document items for their hospital"
  ON pharmacy_oxygen_request_document_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_request_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_request_document_items.request_document_id
      AND u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_request_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_request_document_items.request_document_id
      AND u.id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pharmacy_oxygen_request_documents IS 'Documents sent to suppliers when requesting cylinder refills or supplies';
COMMENT ON TABLE pharmacy_oxygen_request_document_items IS 'Cylinders size codes and quantities requested in request documents';



-- >>>>>>>>>>>>>>> FILE: 040_create_cylinder_dispatch_requests.sql <<<<<<<<<<<<<<<
-- 040_create_cylinder_dispatch_requests.sql
-- Migration to support internal medical cylinder requests and dispatch

CREATE TABLE IF NOT EXISTS pharmacy_cylinder_dispatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('manual_issue', 'unit_request')),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  issuer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_date TIMESTAMP WITH TIME ZONE,
  issued_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  rejection_reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, request_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_cylinder_dispatch_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_request_id UUID NOT NULL REFERENCES pharmacy_cylinder_dispatch_requests(id) ON DELETE CASCADE,
  size_code TEXT NOT NULL,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_issued INTEGER DEFAULT 0 CHECK (quantity_issued >= 0),
  usage_notes TEXT,
  cylinder_id UUID REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_hospital_id ON pharmacy_cylinder_dispatch_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_dept_id ON pharmacy_cylinder_dispatch_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_status ON pharmacy_cylinder_dispatch_requests(status);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_req_date ON pharmacy_cylinder_dispatch_requests(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_items_req_id ON pharmacy_cylinder_dispatch_request_items(dispatch_request_id);

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_pharmacy_cylinder_dispatch_requests_updated_at
  BEFORE UPDATE ON pharmacy_cylinder_dispatch_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE pharmacy_cylinder_dispatch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_cylinder_dispatch_request_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_cylinder_dispatch_requests
CREATE POLICY "Users can manage dispatch requests for their hospital"
  ON pharmacy_cylinder_dispatch_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_cylinder_dispatch_requests.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_cylinder_dispatch_requests.hospital_id
    )
  );

-- Policies for pharmacy_cylinder_dispatch_request_items
CREATE POLICY "Users can manage dispatch request items for their hospital"
  ON pharmacy_cylinder_dispatch_request_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_cylinder_dispatch_requests r
      JOIN users u ON u.hospital_id = r.hospital_id
      WHERE r.id = pharmacy_cylinder_dispatch_request_items.dispatch_request_id
      AND u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_cylinder_dispatch_requests r
      JOIN users u ON u.hospital_id = r.hospital_id
      WHERE r.id = pharmacy_cylinder_dispatch_request_items.dispatch_request_id
      AND u.id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pharmacy_cylinder_dispatch_requests IS 'Requests and dispatches of cylinders to departments';
COMMENT ON TABLE pharmacy_cylinder_dispatch_request_items IS 'Items included in each cylinder dispatch request';



-- >>>>>>>>>>>>>>> FILE: 041_add_qr_tagging_to_cylinders.sql <<<<<<<<<<<<<<<
-- 041_add_qr_tagging_to_cylinders.sql
-- Migration to support cylinder QR code tagging and monitoring

DO $$
BEGIN
    -- Alter pharmacy_oxygen_cylinders table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinders') THEN
        ALTER TABLE pharmacy_oxygen_cylinders 
        ADD COLUMN IF NOT EXISTS qr_code_value VARCHAR(255) UNIQUE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_by UUID REFERENCES users(id) DEFAULT NULL;
    END IF;

    -- Alter pharmacy_oxygen_cylinder_inventory table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_inventory') THEN
        ALTER TABLE pharmacy_oxygen_cylinder_inventory 
        ADD COLUMN IF NOT EXISTS qr_code_value VARCHAR(255) UNIQUE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_by UUID REFERENCES users(id) DEFAULT NULL;
    END IF;
END $$;

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_cylinders_qr_code_value ON pharmacy_oxygen_cylinders(qr_code_value);
CREATE INDEX IF NOT EXISTS idx_cylinders_inventory_qr_code_value ON pharmacy_oxygen_cylinder_inventory(qr_code_value);



-- >>>>>>>>>>>>>>> FILE: 042_create_mysuhu_tables.sql <<<<<<<<<<<<<<<
-- Migration: Create MySuhu Tables (lokasi, unit_pemantauan, ambang_suhu, bacaan_suhu)
-- Part of MySuhu Temperature Monitoring Submodule

-- ============================================
-- 1. Create lokasi Table
-- ============================================
CREATE TABLE IF NOT EXISTS lokasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod_lokasi TEXT NOT NULL UNIQUE,
  nama_lokasi TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  deskripsi TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lokasi_hospital_id ON lokasi(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lokasi_status ON lokasi(status);
CREATE INDEX IF NOT EXISTS idx_lokasi_kod ON lokasi(kod_lokasi);

-- ============================================
-- 2. Create unit_pemantauan Table
-- ============================================
CREATE TABLE IF NOT EXISTS unit_pemantauan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lokasi_id UUID NOT NULL REFERENCES lokasi(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL UNIQUE,
  nama_unit TEXT NOT NULL,
  jenis_unit TEXT NOT NULL CHECK (jenis_unit IN ('freezer', 'refrigerator', 'ambient', 'incubator', 'other')),
  nota TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unit_pemantauan_lokasi_id ON unit_pemantauan(lokasi_id);
CREATE INDEX IF NOT EXISTS idx_unit_pemantauan_status ON unit_pemantauan(status);
CREATE INDEX IF NOT EXISTS idx_unit_pemantauan_id ON unit_pemantauan(unit_id);

-- ============================================
-- 3. Create ambang_suhu Table
-- ============================================
CREATE TABLE IF NOT EXISTS ambang_suhu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES unit_pemantauan(id) ON DELETE CASCADE,
  min_suhu DECIMAL(5,2) NOT NULL,
  max_suhu DECIMAL(5,2) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_temp_range CHECK (min_suhu < max_suhu)
);

CREATE INDEX IF NOT EXISTS idx_ambang_suhu_unit_id ON ambang_suhu(unit_id);
CREATE INDEX IF NOT EXISTS idx_ambang_suhu_effective ON ambang_suhu(effective_from, effective_until);

-- ============================================
-- 4. Create bacaan_suhu Table
-- ============================================
CREATE TABLE IF NOT EXISTS bacaan_suhu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES unit_pemantauan(id) ON DELETE CASCADE,
  suhu DECIMAL(5,2) NOT NULL,
  status_bacaan TEXT NOT NULL CHECK (status_bacaan IN ('normal', 'warning', 'breach')),
  ambang_id UUID NOT NULL REFERENCES ambang_suhu(id) ON DELETE RESTRICT,
  tarikh_masa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dicatat_pada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dicatat_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  nota TEXT,
  is_corrected BOOLEAN NOT NULL DEFAULT false,
  correction_note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bacaan_suhu_unit_id ON bacaan_suhu(unit_id);
CREATE INDEX IF NOT EXISTS idx_bacaan_suhu_tarikh ON bacaan_suhu(tarikh_masa DESC);
CREATE INDEX IF NOT EXISTS idx_bacaan_suhu_status ON bacaan_suhu(status_bacaan);

-- ============================================
-- 5. Add Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_lokasi_updated_at ON lokasi;
CREATE TRIGGER update_lokasi_updated_at
  BEFORE UPDATE ON lokasi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_pemantauan_updated_at ON unit_pemantauan;
CREATE TRIGGER update_unit_pemantauan_updated_at
  BEFORE UPDATE ON unit_pemantauan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bacaan_suhu_updated_at ON bacaan_suhu;
CREATE TRIGGER update_bacaan_suhu_updated_at
  BEFORE UPDATE ON bacaan_suhu
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE lokasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_pemantauan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambang_suhu ENABLE ROW LEVEL SECURITY;
ALTER TABLE bacaan_suhu ENABLE ROW LEVEL SECURITY;

-- 6.1 lokasi Policies
CREATE POLICY "Users view locations in their hospital"
  ON lokasi FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert locations in their hospital"
  ON lokasi FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update locations in their hospital"
  ON lokasi FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 6.2 unit_pemantauan Policies
CREATE POLICY "Users view units in their hospital"
  ON unit_pemantauan FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users insert units in their hospital"
  ON unit_pemantauan FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users update units in their hospital"
  ON unit_pemantauan FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

-- 6.3 ambang_suhu Policies
CREATE POLICY "Users view thresholds in their hospital"
  ON ambang_suhu FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users insert thresholds in their hospital"
  ON ambang_suhu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users update thresholds in their hospital"
  ON ambang_suhu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

-- 6.4 bacaan_suhu Policies
CREATE POLICY "Users view readings in their hospital"
  ON bacaan_suhu FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users insert readings in their hospital"
  ON bacaan_suhu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users update readings in their hospital"
  ON bacaan_suhu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

-- ============================================
-- 7. Comments for documentation
-- ============================================
COMMENT ON TABLE lokasi IS 'Physical locations within hospitals, e.g. Pharmacy Logistics';
COMMENT ON TABLE unit_pemantauan IS 'Devices or points monitored within a location, e.g. Refrigerator 1';
COMMENT ON TABLE ambang_suhu IS 'Historical and active temperature thresholds for a unit';
COMMENT ON TABLE bacaan_suhu IS 'Logged temperature readings with snapshot reference to active threshold';



-- >>>>>>>>>>>>>>> FILE: 043_create_myphis_tables.sql <<<<<<<<<<<<<<<
-- Migration: Create MyPHiS Tables (myphis_disk_changes, myphis_navigation_logs)
-- Part of MyPHiS Integration Hub Submodule

-- ============================================
-- 1. Create myphis_disk_changes Table
-- ============================================
CREATE TABLE IF NOT EXISTS myphis_disk_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarikh DATE NOT NULL,
  waktu TIME NOT NULL,
  disk_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  petugas_nama TEXT NOT NULL,
  dicatat_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  nota TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_myphis_disk_changes_date_hosp UNIQUE (tarikh, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_myphis_disk_changes_hosp ON myphis_disk_changes(hospital_id);
CREATE INDEX IF NOT EXISTS idx_myphis_disk_changes_tarikh ON myphis_disk_changes(tarikh DESC);

-- ============================================
-- 2. Create myphis_navigation_logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS myphis_navigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarikh_masa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  destination_url TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  petugas_nama TEXT NOT NULL,
  dicatat_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_myphis_nav_logs_hosp ON myphis_navigation_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_myphis_nav_logs_tarikh ON myphis_navigation_logs(tarikh_masa DESC);

-- ============================================
-- 3. Add Trigger for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_myphis_disk_changes_updated_at ON myphis_disk_changes;
CREATE TRIGGER update_myphis_disk_changes_updated_at
  BEFORE UPDATE ON myphis_disk_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE myphis_disk_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE myphis_navigation_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 myphis_disk_changes Policies
CREATE POLICY "Users view disk changes in their hospital"
  ON myphis_disk_changes FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert disk changes in their hospital"
  ON myphis_disk_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update disk changes in their hospital"
  ON myphis_disk_changes FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 4.2 myphis_navigation_logs Policies
CREATE POLICY "Users view navigation logs in their hospital"
  ON myphis_navigation_logs FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert navigation logs in their hospital"
  ON myphis_navigation_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 5. Comments for documentation
-- ============================================
COMMENT ON TABLE myphis_disk_changes IS 'Logs of daily PHiS server backup disk/tape rotation swaps';
COMMENT ON TABLE myphis_navigation_logs IS 'Audit logs of navigation clicks to external PHiS systems';



-- >>>>>>>>>>>>>>> FILE: 044_create_mykunci_tables.sql <<<<<<<<<<<<<<<
-- Migration: Create MyKunci Tables (kunci_daftar, kunci_log, kunci_audit_bulanan)
-- Part of MyKunci Integrated Key Management Submodule

-- ============================================
-- 1. Create kunci_daftar Table
-- ============================================
CREATE TABLE IF NOT EXISTS kunci_daftar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod_kunci TEXT NOT NULL UNIQUE,
  nama_kunci TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  lokasi_fizikal TEXT NOT NULL,
  jenis_kunci TEXT NOT NULL CHECK (jenis_kunci IN ('room', 'cabinet', 'cabinet_dda', 'vehicle', 'other')),
  tahap_kawalan TEXT NOT NULL DEFAULT 'normal' CHECK (tahap_kawalan IN ('normal', 'high')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'damaged', 'lost')),
  nombor_peti TEXT,
  status_sampul TEXT NOT NULL DEFAULT 'not_applicable' CHECK (status_sampul IN ('sealed', 'broken', 'not_applicable')),
  penjaga_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kunci_daftar_hospital_id ON kunci_daftar(hospital_id);
CREATE INDEX IF NOT EXISTS idx_kunci_daftar_department_id ON kunci_daftar(department_id);
CREATE INDEX IF NOT EXISTS idx_kunci_daftar_status ON kunci_daftar(status);
CREATE INDEX IF NOT EXISTS idx_kunci_daftar_kod ON kunci_daftar(kod_kunci);

-- ============================================
-- 2. Create kunci_log Table
-- ============================================
CREATE TABLE IF NOT EXISTS kunci_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci_id UUID NOT NULL REFERENCES kunci_daftar(id) ON DELETE CASCADE,
  peminjam_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  pegawai_penyerah_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  pegawai_saksi_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tarikh_masa_ambil TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  jangka_masa_pulang TIMESTAMP WITH TIME ZONE NOT NULL,
  tarikh_masa_pulang TIMESTAMP WITH TIME ZONE,
  pegawai_penerima_id UUID REFERENCES users(id) ON DELETE SET NULL,
  keadaan_kunci TEXT CHECK (keadaan_kunci IN ('good', 'damaged')),
  keadaan_mangga TEXT CHECK (keadaan_mangga IN ('good', 'damaged', 'loose')),
  tujuan TEXT,
  catatan_penggunaan TEXT,
  duration_seconds INTEGER,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kunci_log_kunci_id ON kunci_log(kunci_id);
CREATE INDEX IF NOT EXISTS idx_kunci_log_hospital_id ON kunci_log(hospital_id);
CREATE INDEX IF NOT EXISTS idx_kunci_log_ambil ON kunci_log(tarikh_masa_ambil DESC);
CREATE INDEX IF NOT EXISTS idx_kunci_log_pulang ON kunci_log(tarikh_masa_pulang DESC);

-- ============================================
-- 3. Create kunci_audit_bulanan Table
-- ============================================
CREATE TABLE IF NOT EXISTS kunci_audit_bulanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci_id UUID NOT NULL REFERENCES kunci_daftar(id) ON DELETE CASCADE,
  tarikh_audit DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  status_fizikal TEXT NOT NULL CHECK (status_fizikal IN ('present', 'missing', 'damaged')),
  sampul_bermeterai_utuh BOOLEAN NOT NULL DEFAULT true,
  catatan TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kunci_audit_kunci_id ON kunci_audit_bulanan(kunci_id);
CREATE INDEX IF NOT EXISTS idx_kunci_audit_hospital_id ON kunci_audit_bulanan(hospital_id);
CREATE INDEX IF NOT EXISTS idx_kunci_audit_tarikh ON kunci_audit_bulanan(tarikh_audit DESC);

-- ============================================
-- 4. Add Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_kunci_daftar_updated_at ON kunci_daftar;
CREATE TRIGGER update_kunci_daftar_updated_at
  BEFORE UPDATE ON kunci_daftar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kunci_log_updated_at ON kunci_log;
CREATE TRIGGER update_kunci_log_updated_at
  BEFORE UPDATE ON kunci_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE kunci_daftar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunci_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunci_audit_bulanan ENABLE ROW LEVEL SECURITY;

-- 5.1 kunci_daftar Policies
CREATE POLICY "Users view keys in their hospital"
  ON kunci_daftar FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert keys in their hospital"
  ON kunci_daftar FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update keys in their hospital"
  ON kunci_daftar FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users delete keys in their hospital"
  ON kunci_daftar FOR DELETE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.2 kunci_log Policies
CREATE POLICY "Users view key logs in their hospital"
  ON kunci_log FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert key logs in their hospital"
  ON kunci_log FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update key logs in their hospital"
  ON kunci_log FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.3 kunci_audit_bulanan Policies
CREATE POLICY "Users view audits in their hospital"
  ON kunci_audit_bulanan FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert audits in their hospital"
  ON kunci_audit_bulanan FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 6. Comments for documentation
-- ============================================
COMMENT ON TABLE kunci_daftar IS 'Daftar induk anak kunci fizikal mengikut jabatan di bawah polisi KKM';
COMMENT ON TABLE kunci_log IS 'Log pergerakan peminjaman dan pemulangan kunci fizikal';
COMMENT ON TABLE kunci_audit_bulanan IS 'Rekod pemeriksaan fizikal kunci bulanan dan integriti sampul meterai';



-- >>>>>>>>>>>>>>> FILE: 045_add_supplier_tag_fields_to_cylinders.sql <<<<<<<<<<<<<<<
-- 045_add_supplier_tag_fields_to_cylinders.sql
-- Migration to support manual supplier tag entry for loan cylinders

DO $$
BEGIN
    -- Alter pharmacy_oxygen_cylinder_inventory table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_inventory') THEN
        ALTER TABLE pharmacy_oxygen_cylinder_inventory 
        ADD COLUMN IF NOT EXISTS supplier_tagged BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS supplier_tag_source TEXT DEFAULT NULL;
    END IF;
END $$;

-- Create index for fast lookup of supplier-tagged cylinders
CREATE INDEX IF NOT EXISTS idx_cylinders_inventory_supplier_tagged 
ON pharmacy_oxygen_cylinder_inventory(hospital_id, supplier_tagged)
WHERE supplier_tagged = true;

COMMENT ON COLUMN pharmacy_oxygen_cylinder_inventory.supplier_tagged 
IS 'TRUE when the cylinder serial/qr was manually entered from supplier tag (not system-generated)';

COMMENT ON COLUMN pharmacy_oxygen_cylinder_inventory.supplier_tag_source 
IS 'Source of supplier tag, e.g. manual, import, api';



-- >>>>>>>>>>>>>>> FILE: 046_hospital_wide_budget_forecasting.sql <<<<<<<<<<<<<<<
-- Migration: 046_hospital_wide_budget_forecasting.sql
-- Create table for storing hospital budget forecast justifications and simulated revisions

CREATE TABLE IF NOT EXISTS hospital_forecast_justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  proposed_topup DECIMAL(15,2) DEFAULT 0.00,
  justification_text TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hospital_forecast_justifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read for authenticated users" 
  ON hospital_forecast_justifications FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow insert/update for authenticated users" 
  ON hospital_forecast_justifications FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Unique index to prevent duplicate entries for the same category in a given year
CREATE UNIQUE INDEX IF NOT EXISTS idx_forecast_justifications_year_category 
  ON hospital_forecast_justifications (hospital_id, fiscal_year, category_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_hospital_forecast_justifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_hospital_forecast_justifications_updated_at
  BEFORE UPDATE ON hospital_forecast_justifications
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_forecast_justifications_updated_at();



-- >>>>>>>>>>>>>>> FILE: 047_create_mytransporter_tables.sql <<<<<<<<<<<<<<<
-- Migration: Create MyTransporter Tables (transport_vehicles, transport_requests, vehicle_inspections, vehicle_issue_reports, transport_request_logs)
-- Part of MyTransporter Integrated Transport and Ambulance Management Submodule

-- ============================================
-- 1. Create transport_vehicles Table
-- ============================================
CREATE TABLE IF NOT EXISTS transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_kenderaan TEXT NOT NULL,
  no_chasis TEXT NOT NULL,
  jenis_kenderaan TEXT NOT NULL CHECK (jenis_kenderaan IN ('ambulance', 'sg')),
  model TEXT NOT NULL,
  tarikh_tamat_cukai_jalan DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_transport_vehicles_no_kenderaan UNIQUE (no_kenderaan, hospital_id),
  CONSTRAINT uq_transport_vehicles_no_chasis UNIQUE (no_chasis, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_hospital_id ON transport_vehicles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_status ON transport_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_jenis ON transport_vehicles(jenis_kenderaan);

-- ============================================
-- 2. Create transport_requests Table
-- ============================================
CREATE TABLE IF NOT EXISTS transport_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_rujukan TEXT NOT NULL,
  jenis_permohonan TEXT NOT NULL CHECK (jenis_permohonan IN ('ambulance', 'sg')),
  tujuan_permohonan TEXT NOT NULL,
  destinasi TEXT NOT NULL,
  tarikh_masa_diperlukan TIMESTAMP WITH TIME ZONE NOT NULL,
  unit_pemohon TEXT NOT NULL,
  pengiring TEXT CHECK (pengiring IN ('nurse', 'medical_officer', 'assistant_medical_officer', 'ppk')),
  bawa_pesakit BOOLEAN NOT NULL DEFAULT false,
  
  -- Patient details
  nama_pesakit TEXT,
  rn_pesakit TEXT,
  jantina_pesakit TEXT CHECK (jantina_pesakit IN ('M', 'F', 'Lelaki', 'Perempuan')),
  diagnosis_pesakit TEXT,
  telefon_pesakit TEXT,
  
  catatan_khas TEXT,
  oksigen_diperlukan BOOLEAN DEFAULT false,
  status_semasa TEXT NOT NULL DEFAULT 'draft' CHECK (status_semasa IN ('draft', 'submitted', 'driver_accepted', 'driver_rejected', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled')),
  sebab_tolak TEXT,
  
  pemohon_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pemandu_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pelulus_id UUID REFERENCES users(id) ON DELETE SET NULL,
  kenderaan_id UUID REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  
  driver_accepted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  trip_started_at TIMESTAMP WITH TIME ZONE,
  trip_completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_transport_requests_no_rujukan UNIQUE (no_rujukan, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_transport_requests_hospital_id ON transport_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_status ON transport_requests(status_semasa);
CREATE INDEX IF NOT EXISTS idx_transport_requests_pemohon_id ON transport_requests(pemohon_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_pemandu_id ON transport_requests(pemandu_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_kenderaan_id ON transport_requests(kenderaan_id);

-- ============================================
-- 3. Create vehicle_inspections Table
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
  kenderaan_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
  pemandu_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  jenis_pemeriksaan TEXT NOT NULL CHECK (jenis_pemeriksaan IN ('pre_trip', 'post_trip')),
  status_tayar TEXT NOT NULL CHECK (status_tayar IN ('good', 'issue')),
  foto_tayar TEXT,
  status_minyak_gas TEXT NOT NULL CHECK (status_minyak_gas IN ('good', 'issue')),
  foto_minyak_gas TEXT,
  status_minyak_hitam TEXT NOT NULL CHECK (status_minyak_hitam IN ('good', 'issue')),
  foto_minyak_hitam TEXT,
  bacaan_odometer INTEGER NOT NULL,
  foto_odometer TEXT,
  keputusan TEXT NOT NULL CHECK (keputusan IN ('cleared', 'rejected')),
  catatan TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_request_id ON vehicle_inspections(request_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_kenderaan_id ON vehicle_inspections(kenderaan_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_hospital_id ON vehicle_inspections(hospital_id);

-- ============================================
-- 4. Create vehicle_issue_reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kenderaan_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
  pemandu_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  inspection_id UUID REFERENCES vehicle_inspections(id) ON DELETE SET NULL,
  tajuk TEXT NOT NULL,
  penerangan TEXT NOT NULL,
  keutamaan TEXT NOT NULL DEFAULT 'medium' CHECK (keutamaan IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  catatan_penyelesaian TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_issue_reports_kenderaan_id ON vehicle_issue_reports(kenderaan_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issue_reports_status ON vehicle_issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_issue_reports_hospital_id ON vehicle_issue_reports(hospital_id);

-- ============================================
-- 5. Create transport_request_logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS transport_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
  tindakan TEXT NOT NULL,
  status_sebelum TEXT NOT NULL,
  status_selepas TEXT NOT NULL,
  catatan TEXT,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_request_logs_request_id ON transport_request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_transport_request_logs_hospital_id ON transport_request_logs(hospital_id);

-- ============================================
-- 6. Add Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_transport_vehicles_updated_at ON transport_vehicles;
CREATE TRIGGER update_transport_vehicles_updated_at
  BEFORE UPDATE ON transport_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transport_requests_updated_at ON transport_requests;
CREATE TRIGGER update_transport_requests_updated_at
  BEFORE UPDATE ON transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_issue_reports_updated_at ON vehicle_issue_reports;
CREATE TRIGGER update_vehicle_issue_reports_updated_at
  BEFORE UPDATE ON vehicle_issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_request_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 transport_vehicles Policies
CREATE POLICY "Users view vehicles in their hospital"
  ON transport_vehicles FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert vehicles in their hospital"
  ON transport_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update vehicles in their hospital"
  ON transport_vehicles FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users delete vehicles in their hospital"
  ON transport_vehicles FOR DELETE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.2 transport_requests Policies
CREATE POLICY "Users view requests in their hospital"
  ON transport_requests FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert requests in their hospital"
  ON transport_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update requests in their hospital"
  ON transport_requests FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.3 vehicle_inspections Policies
CREATE POLICY "Users view inspections in their hospital"
  ON vehicle_inspections FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert inspections in their hospital"
  ON vehicle_inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.4 vehicle_issue_reports Policies
CREATE POLICY "Users view issues in their hospital"
  ON vehicle_issue_reports FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert issues in their hospital"
  ON vehicle_issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update issues in their hospital"
  ON vehicle_issue_reports FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.5 transport_request_logs Policies
CREATE POLICY "Users view logs in their hospital"
  ON transport_request_logs FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert logs in their hospital"
  ON transport_request_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 8. Try to create storage bucket policies
-- ============================================
DO $$
BEGIN
  CREATE POLICY "Public can read transport photos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'transport-inspections');

  CREATE POLICY "Drivers can upload transport photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'transport-inspections'
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Cannot create storage policies for transport-inspections. Please create the bucket and policies manually if needed.';
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating storage policies: %', SQLERRM;
END $$;

-- ============================================
-- 9. Comments for documentation
-- ============================================
COMMENT ON TABLE transport_vehicles IS 'Daftar kenderaan hospital (ambulans dan kereta jabatan)';
COMMENT ON TABLE transport_requests IS 'Rekod permohonan pengangkutan ambulans dan kereta jabatan';
COMMENT ON TABLE vehicle_inspections IS 'Rekod pemeriksaan kenderaan pre-trip dan post-trip oleh pemandu';
COMMENT ON TABLE vehicle_issue_reports IS 'Laporan kerosakan/isu kenderaan yang dibuat oleh pemandu';
COMMENT ON TABLE transport_request_logs IS 'Log audit perubahan status permohonan pengangkutan';



-- >>>>>>>>>>>>>>> FILE: 048_add_pengiring_list_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add pengiring_list to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS pengiring_list JSONB;



-- >>>>>>>>>>>>>>> FILE: 049_add_jenis_oksigen_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add jenis_oksigen to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS jenis_oksigen TEXT;



-- >>>>>>>>>>>>>>> FILE: 050_add_mesin_diperlukan_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add mesin_diperlukan to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS mesin_diperlukan JSONB;



-- >>>>>>>>>>>>>>> FILE: 050_clean_up_departments_and_modules.sql <<<<<<<<<<<<<<<
-- Migration: Clean up software modules, rename Haemodialysis -> Nephrology, and remove duplicate department entries
-- Description: Removes software module entries (MyCuti, MyFormulari, MyKunci, MyPerhimpunan, MyPorter, etc.),
-- renames "Haemodialysis" to "Nephrology", and deduplicates hospital department records.

-- 1. Rename "Haemodialysis" department to "Nephrology"
UPDATE departments
SET department_name = 'Nephrology',
    department_code = 'NEPH',
    description = 'Nephrology Department & Haemodialysis Unit'
WHERE LOWER(department_name) = 'haemodialysis' OR LOWER(department_code) = 'haemodialysis';

-- 2. Delete software module records from departments table
DELETE FROM departments
WHERE LOWER(department_code) IN (
  'mycuti', 'myformulari', 'mykunci', 'myperhimpunan', 'myporter', 
  'mytransporter', 'mywarrant', 'mysuhu', 'mymsds', 'myphis', 
  'mycrossborder', 'mypriviledging', 'mytempahan', 'pharmacy_logistics',
  'pharmacy_substore', 'pharmacy_outpatient', 'pharmacy_emergency',
  'pharmacy_inpatient', 'pharmacy_galenical', 'driver_room', 'billing',
  'hr', 'asset', 'reports'
)
OR LOWER(department_name) LIKE 'my%'
OR LOWER(department_code) LIKE 'my%';

-- 3. Deduplicate department records keeping only 1 per (hospital_id, department_name)
WITH CTE AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY hospital_id, LOWER(TRIM(department_name))
           ORDER BY created_at ASC, id ASC
         ) as row_num
  FROM departments
)
DELETE FROM departments
WHERE id IN (
  SELECT id FROM CTE WHERE row_num > 1
);

-- 4. Update trigger function to prevent auto-syncing software ecosystem modules to departments table
CREATE OR REPLACE FUNCTION trigger_sync_module_to_department()
RETURNS TRIGGER AS $$
DECLARE
  module_info RECORD;
BEGIN
  -- Exclude software ecosystem modules from being added into departments table
  IF LOWER(NEW.module_code) LIKE 'my%' OR NEW.module_code IN ('billing', 'hr', 'asset', 'reports', 'driver_room') THEN
    RETURN NEW;
  END IF;

  -- Get module info
  SELECT * INTO module_info FROM get_module_info(NEW.module_code);
  
  IF module_info.module_name IS NOT NULL THEN
    PERFORM sync_module_to_department(
      NEW.hospital_id,
      NEW.module_code,
      module_info.module_name,
      module_info.module_description,
      NEW.is_enabled
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- >>>>>>>>>>>>>>> FILE: 051_add_medical_officer_referring_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add medical_officer_referring to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS medical_officer_referring JSONB DEFAULT NULL;

COMMENT ON COLUMN transport_requests.medical_officer_referring IS 'Medical Officer Referring details ({name, department})';



-- >>>>>>>>>>>>>>> FILE: 052_add_nama_pemohon_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add nama_pemohon to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS nama_pemohon TEXT DEFAULT NULL;

COMMENT ON COLUMN transport_requests.nama_pemohon IS 'Nama kakitangan yang membuat permohonan dari unit/wad';



-- >>>>>>>>>>>>>>> FILE: 053_add_patient_mobility_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add patient_mobility to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS patient_mobility TEXT DEFAULT NULL CHECK (patient_mobility IN ('walking', 'wheelchair', 'stretcher'));

COMMENT ON COLUMN transport_requests.patient_mobility IS 'Patient mobility status (walking, wheelchair, stretcher)';



-- >>>>>>>>>>>>>>> FILE: 054_update_jenis_kenderaan_constraints.sql <<<<<<<<<<<<<<<
-- Migration: Update check constraints for transport_vehicles and transport_requests to allow 'van_jenazah'

-- 1. Update check constraint on transport_vehicles table
ALTER TABLE transport_vehicles DROP CONSTRAINT IF EXISTS transport_vehicles_jenis_kenderaan_check;
ALTER TABLE transport_vehicles ADD CONSTRAINT transport_vehicles_jenis_kenderaan_check 
  CHECK (jenis_kenderaan IN ('ambulance', 'sg', 'van_jenazah'));

-- 2. Update check constraint on transport_requests table
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_jenis_permohonan_check;
ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_jenis_permohonan_check 
  CHECK (jenis_permohonan IN ('ambulance', 'sg', 'van_jenazah'));



-- >>>>>>>>>>>>>>> FILE: 055_add_foto_kenderaan_to_transport_vehicles.sql <<<<<<<<<<<<<<<
-- Migration: Add foto_kenderaan column to transport_vehicles table

ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS foto_kenderaan TEXT;



-- >>>>>>>>>>>>>>> FILE: 056_add_foto_kerosakan_to_vehicle_issue_reports.sql <<<<<<<<<<<<<<<
-- Migration: Add foto_kerosakan to vehicle_issue_reports
ALTER TABLE vehicle_issue_reports ADD COLUMN IF NOT EXISTS foto_kerosakan TEXT;



-- >>>>>>>>>>>>>>> FILE: 057_add_sg_specific_fields_to_transport_requests.sql <<<<<<<<<<<<<<<
-- Migration: Add SG specific fields to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS tarikh_masa_sehingga TIMESTAMP WITH TIME ZONE;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS pemandu_diperlukan BOOLEAN DEFAULT true;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS senarai_penumpang JSONB;



-- >>>>>>>>>>>>>>> FILE: 058_create_cylinder_maintenance_tables.sql <<<<<<<<<<<<<<<
-- 058_create_cylinder_maintenance_tables.sql
-- Migration to support medical oxygen cylinder maintenance requests (similar to purchase orders)

-- Create cylinder maintenance requests parent table
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  maintenance_no VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'sent_to_supplier', 'in_progress', 'completed', 'cancelled'
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  total_cost DECIMAL(12,2) DEFAULT 0.00,
  budget_source VARCHAR(50), -- e.g., 'warrant', 'appl', 'cc', 'lp'
  justification TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cylinder maintenance items table
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_maintenance(id) ON DELETE CASCADE,
  cylinder_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL, -- 'replacing_valve', 'painting', 'general_maintenance', 'hydrostatic_testing', 'other'
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pharmacy_oxygen_cylinder_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_cylinder_maintenance_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_oxygen_cylinder_maintenance
CREATE POLICY "Allow read access to maintenance requests for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_cylinder_maintenance.hospital_id
    )
  );

CREATE POLICY "Allow insert access to maintenance requests for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_cylinder_maintenance.hospital_id
    )
  );

CREATE POLICY "Allow update access to maintenance requests for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_cylinder_maintenance.hospital_id
    )
  );

-- Policies for pharmacy_oxygen_cylinder_maintenance_items
CREATE POLICY "Allow read access to maintenance request items for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_maintenance m
      JOIN users u ON u.hospital_id = m.hospital_id
      WHERE u.id = auth.uid()
      AND m.id = pharmacy_oxygen_cylinder_maintenance_items.maintenance_id
    )
  );

CREATE POLICY "Allow insert access to maintenance request items for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_maintenance m
      JOIN users u ON u.hospital_id = m.hospital_id
      WHERE u.id = auth.uid()
      AND m.id = pharmacy_oxygen_cylinder_maintenance_items.maintenance_id
    )
  );

CREATE POLICY "Allow update/delete access to maintenance request items for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_maintenance m
      JOIN users u ON u.hospital_id = m.hospital_id
      WHERE u.id = auth.uid()
      AND m.id = pharmacy_oxygen_cylinder_maintenance_items.maintenance_id
    )
  );

-- Trigger to update updated_at on pharmacy_oxygen_cylinder_maintenance
CREATE OR REPLACE FUNCTION update_pharmacy_oxygen_cylinder_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pharmacy_oxygen_cylinder_maintenance_updated_at
  BEFORE UPDATE ON pharmacy_oxygen_cylinder_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_oxygen_cylinder_maintenance_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maint_hospital_id ON pharmacy_oxygen_cylinder_maintenance(hospital_id);
CREATE INDEX IF NOT EXISTS idx_maint_supplier_id ON pharmacy_oxygen_cylinder_maintenance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_maint_status ON pharmacy_oxygen_cylinder_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maint_items_maint_id ON pharmacy_oxygen_cylinder_maintenance_items(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maint_items_cyl_id ON pharmacy_oxygen_cylinder_maintenance_items(cylinder_id);

COMMENT ON TABLE pharmacy_oxygen_cylinder_maintenance IS 'Cylinder maintenance requests / purchase orders';
COMMENT ON TABLE pharmacy_oxygen_cylinder_maintenance_items IS 'Cylinders included in each maintenance request';



-- >>>>>>>>>>>>>>> FILE: 059_create_mycrossborder_tables.sql <<<<<<<<<<<<<<<
-- Migration: Create MyCrossBorder Tables (crossborder_transfers, crossborder_patients, crossborder_escorts)
-- Part of Malaysia-Brunei Cross Border Patient Transfer System

-- ============================================
-- 1. Create crossborder_transfers Table
-- ============================================
CREATE TABLE IF NOT EXISTS crossborder_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_rujukan TEXT UNIQUE NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  referring_hospital TEXT NOT NULL DEFAULT 'Hospital Lawas',
  destination_hospital TEXT NOT NULL DEFAULT 'Hospital Limbang',
  tarikh_perjalanan DATE NOT NULL,
  masa_berlepas TIME NOT NULL,
  tempat_berlepas TEXT NOT NULL DEFAULT 'Hospital Lawas',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'completed', 'cancelled')),
  
  -- Vehicle Details
  jenis_kenderaan TEXT NOT NULL DEFAULT 'ambulance' CHECK (jenis_kenderaan IN ('ambulance', 'government_vehicle')),
  no_pendaftaran TEXT NOT NULL,
  peralatan_lain TEXT,
  pemandu_nama TEXT,
  pemandu_passport TEXT,
  
  -- Referring Doctor
  doktor_perujuk_nama TEXT NOT NULL,
  doktor_perujuk_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Approval details
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  pengarah_nama TEXT,
  
  -- Border Control
  border_control_post TEXT NOT NULL DEFAULT 'MALAYSIA/BRUNEI',
  surat_kebenaran_ref TEXT,
  
  -- Audit / Control
  catatan TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_hospital_id ON crossborder_transfers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_status ON crossborder_transfers(status);
CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_no_rujukan ON crossborder_transfers(no_rujukan);
CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_tarikh ON crossborder_transfers(tarikh_perjalanan DESC);

-- ============================================
-- 2. Create crossborder_patients Table
-- ============================================
CREATE TABLE IF NOT EXISTS crossborder_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES crossborder_transfers(id) ON DELETE CASCADE,
  urutan INTEGER NOT NULL CHECK (urutan BETWEEN 1 AND 3),
  nama TEXT NOT NULL,
  jantina TEXT NOT NULL CHECK (jantina IN ('Lelaki', 'Perempuan')),
  tarikh_lahir DATE NOT NULL,
  warganegara TEXT NOT NULL DEFAULT 'Malaysia',
  jenis_dokumen TEXT NOT NULL DEFAULT 'PASSPORT' CHECK (jenis_dokumen IN ('PASSPORT', 'IC', 'OTHERS')),
  no_dokumen TEXT NOT NULL,
  no_pengenalan TEXT, -- Optional IC or secondary registration
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Prevent multiple entries of same patient order per transfer
  UNIQUE (transfer_id, urutan)
);

CREATE INDEX IF NOT EXISTS idx_crossborder_patients_transfer_id ON crossborder_patients(transfer_id);
CREATE INDEX IF NOT EXISTS idx_crossborder_patients_hospital_id ON crossborder_patients(hospital_id);

-- ============================================
-- 3. Create crossborder_escorts Table
-- ============================================
CREATE TABLE IF NOT EXISTS crossborder_escorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES crossborder_transfers(id) ON DELETE CASCADE,
  jenis_pengiring TEXT NOT NULL CHECK (jenis_pengiring IN ('patient_escort', 'medical_escort')),
  nama TEXT NOT NULL,
  jenis_dokumen TEXT NOT NULL DEFAULT 'PASSPORT' CHECK (jenis_dokumen IN ('PASSPORT', 'IC', 'OTHERS')),
  no_dokumen TEXT NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crossborder_escorts_transfer_id ON crossborder_escorts(transfer_id);
CREATE INDEX IF NOT EXISTS idx_crossborder_escorts_hospital_id ON crossborder_escorts(hospital_id);

-- ============================================
-- 4. Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_crossborder_transfers_updated_at ON crossborder_transfers;
CREATE TRIGGER update_crossborder_transfers_updated_at
  BEFORE UPDATE ON crossborder_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crossborder_patients_updated_at ON crossborder_patients;
CREATE TRIGGER update_crossborder_patients_updated_at
  BEFORE UPDATE ON crossborder_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE crossborder_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossborder_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossborder_escorts ENABLE ROW LEVEL SECURITY;

-- 5.1 crossborder_transfers policies
CREATE POLICY "Users view crossborder transfers in their hospital"
  ON crossborder_transfers FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert crossborder transfers in their hospital"
  ON crossborder_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update crossborder transfers in their hospital"
  ON crossborder_transfers FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users delete crossborder transfers in their hospital"
  ON crossborder_transfers FOR DELETE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.2 crossborder_patients policies
CREATE POLICY "Users view crossborder patients in their hospital"
  ON crossborder_patients FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert crossborder patients in their hospital"
  ON crossborder_patients FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update crossborder patients in their hospital"
  ON crossborder_patients FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.3 crossborder_escorts policies
CREATE POLICY "Users view crossborder escorts in their hospital"
  ON crossborder_escorts FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert crossborder escorts in their hospital"
  ON crossborder_escorts FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 6. Comments for documentation
-- ============================================
COMMENT ON TABLE crossborder_transfers IS 'Master rekod permohonan rentasi sempadan Malaysia-Brunei bagi pemindahan pesakit';
COMMENT ON TABLE crossborder_patients IS 'Rekod maklumat pesakit (maksima 3) yang dipindahkan dalam permohonan rentasi sempadan';
COMMENT ON TABLE crossborder_escorts IS 'Rekod maklumat pengiring pesakit dan pengiring perubatan (KKM) dalam pemindahan';



-- >>>>>>>>>>>>>>> FILE: 060_add_passport_expiry.sql <<<<<<<<<<<<<<<
-- Migration: Add Passport Expiry Columns to MyCrossBorder Tables
-- Part of Malaysia-Brunei Cross Border Patient Transfer System

ALTER TABLE crossborder_patients ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE crossborder_escorts ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE crossborder_transfers ADD COLUMN IF NOT EXISTS pemandu_passport_expiry DATE;

COMMENT ON COLUMN crossborder_patients.passport_expiry IS 'Tarikh tamat tempoh pasport pesakit jika menggunakan pasport';
COMMENT ON COLUMN crossborder_escorts.passport_expiry IS 'Tarikh tamat tempoh pasport pengiring jika menggunakan pasport';
COMMENT ON COLUMN crossborder_transfers.pemandu_passport_expiry IS 'Tarikh tamat tempoh pasport pemandu ambulans/kenderaan';



-- >>>>>>>>>>>>>>> FILE: 061_appl_sync_tables.sql <<<<<<<<<<<<<<<
-- Supabase Migration: 061_appl_sync_tables.sql
-- Prepare schema for Google Sheets APPL Sync module

-- 1. Extend dosage_form check constraint on drugs table
ALTER TABLE drugs DROP CONSTRAINT IF EXISTS drugs_dosage_form_check;

ALTER TABLE drugs ADD CONSTRAINT drugs_dosage_form_check CHECK (
  dosage_form IN (
    'tablet', 'capsule', 'injection', 'syrup', 'suspension', 
    'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 
    'powder', 'solution', 'lotion', 'liquid', 'granules', 'spray', 
    'enema', 'gel', 'aerosol', 'other'
  )
);

-- 2. Add APPL-specific metadata fields to drugs table
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS appl_kod TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS appl_code TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS mal_mda_number TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS moq TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS price_transition DECIMAL(10, 2);
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS price_next DECIMAL(10, 2);
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS appl_effective_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS country_of_origin TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS last_synced_from_sheet TIMESTAMP WITH TIME ZONE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS sheet_source TEXT;

-- 3. Create approved suppliers table for APPL items
CREATE TABLE IF NOT EXISTS appl_approved_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  drug_code TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  manufacturer_name TEXT,
  country_of_origin TEXT,
  brand_name TEXT,
  mal_mda_number TEXT,
  procurement_scheme TEXT,
  appl_effective_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, drug_code, supplier_name)
);

-- Indexes for appl_approved_suppliers
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_hospital ON appl_approved_suppliers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_drug_id ON appl_approved_suppliers(drug_id);
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_code ON appl_approved_suppliers(drug_code);
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_name ON appl_approved_suppliers(supplier_name);

-- 4. Create sync logs table
CREATE TABLE IF NOT EXISTS appl_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  sheet_tab TEXT NOT NULL DEFAULT 'Lampiran B',
  rows_fetched INTEGER DEFAULT 0,
  drugs_upserted INTEGER DEFAULT 0,
  suppliers_upserted INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by TEXT DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'manual', 'system'))
);

-- Indexes for appl_sync_logs
CREATE INDEX IF NOT EXISTS idx_appl_sync_logs_hospital ON appl_sync_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appl_sync_logs_synced_at ON appl_sync_logs(synced_at DESC);

-- Enable RLS for new tables
ALTER TABLE appl_approved_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appl_sync_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (following the pattern of existing catalog/inventory tables)
CREATE POLICY "Allow authenticated users to read approved suppliers"
  ON appl_approved_suppliers FOR SELECT
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to insert/update approved suppliers"
  ON appl_approved_suppliers FOR ALL
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin')
  WITH CHECK (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to read sync logs"
  ON appl_sync_logs FOR SELECT
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to write sync logs"
  ON appl_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

-- Add triggers for updated_at on approved suppliers
CREATE TRIGGER update_appl_approved_suppliers_updated_at
  BEFORE UPDATE ON appl_approved_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



-- >>>>>>>>>>>>>>> FILE: 062_lp_sync_columns.sql <<<<<<<<<<<<<<<
-- Supabase Migration: 062_lp_sync_columns.sql
-- Prepare schema for Google Sheets LP Sync module

-- 1. Add LP-specific metadata fields to drugs table
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_quota INTEGER;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_balance INTEGER;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_rx_category TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_type TEXT CHECK (lp_type IN ('sebut_harga_lq', 'cfln'));
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_start_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_end_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_remarks TEXT;

-- 2. Add LP-specific metadata fields to non_drugs table
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_quota INTEGER;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_balance INTEGER;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_type TEXT DEFAULT 'non_drug';
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_start_date DATE;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_end_date DATE;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_remarks TEXT;

-- 3. Create sync logs table for LP items
CREATE TABLE IF NOT EXISTS lp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  sheet_tab TEXT NOT NULL,
  rows_fetched INTEGER DEFAULT 0,
  drugs_upserted INTEGER DEFAULT 0,
  non_drugs_upserted INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by TEXT DEFAULT 'manual' CHECK (triggered_by IN ('cron', 'manual', 'system'))
);

-- Indexes for lp_sync_logs
CREATE INDEX IF NOT EXISTS idx_lp_sync_logs_hospital ON lp_sync_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lp_sync_logs_synced_at ON lp_sync_logs(synced_at DESC);

-- Enable RLS for lp_sync_logs
ALTER TABLE lp_sync_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (following the pattern of existing sync logs tables)
CREATE POLICY "Allow authenticated users to read LP sync logs"
  ON lp_sync_logs FOR SELECT
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to write LP sync logs"
  ON lp_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');



-- >>>>>>>>>>>>>>> FILE: 063_create_facility_drug_inventory.sql <<<<<<<<<<<<<<<
-- Migration: 063_create_facility_drug_inventory.sql
-- Stores which drugs a facility has explicitly selected for their inventory,
-- along with facility-specific fields (stock, buffer level, batch, expiry).
-- This replaces the previous localStorage-only approach so data is shared
-- across all browsers and devices (localhost, production, mobile).

CREATE TABLE IF NOT EXISTS facility_drug_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  drug_id           UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  facility_stock    INTEGER NOT NULL DEFAULT 0,
  min_buffer_level  INTEGER NOT NULL DEFAULT 20,
  batch_number      TEXT,
  expiry_date       TEXT,
  location          TEXT,
  notes             TEXT,
  added_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, drug_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fdi_hospital_id ON facility_drug_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_fdi_drug_id     ON facility_drug_inventory(drug_id);
CREATE INDEX IF NOT EXISTS idx_fdi_added_at    ON facility_drug_inventory(added_at DESC);

-- Auto-update updated_at on row change
CREATE TRIGGER update_facility_drug_inventory_updated_at
  BEFORE UPDATE ON facility_drug_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE facility_drug_inventory ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write their own hospital's facility inventory
CREATE POLICY "facility_drug_inventory_select"
  ON facility_drug_inventory FOR SELECT
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_drug_inventory_insert"
  ON facility_drug_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_drug_inventory_update"
  ON facility_drug_inventory FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_drug_inventory_delete"
  ON facility_drug_inventory FOR DELETE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

COMMENT ON TABLE facility_drug_inventory IS
  'Tracks which drugs a facility has explicitly selected for their inventory. '
  'Replaces localStorage so data is consistent across all browsers and devices.';



-- >>>>>>>>>>>>>>> FILE: 064_remove_old_catalog_sources.sql <<<<<<<<<<<<<<<
-- Migration: 064_remove_old_catalog_sources.sql
-- Removes legacy catalog source ambiguity (old MyWarrant Contract Catalog / Facility Catalog)
-- Establishes drugs, non_drugs, and facility_drug_inventory as the SINGLE SOURCE OF TRUTH
-- for all drug and non-drug management under the MyInventory module.

-- Ensure primary catalog tables have complete documentation & indexes
COMMENT ON TABLE drugs IS 'Primary Drug Inventory Catalog (Single Source of Truth under MyInventory)';
COMMENT ON TABLE non_drugs IS 'Primary Non-Drug Inventory Catalog (Single Source of Truth under MyInventory)';
COMMENT ON TABLE facility_drug_inventory IS 'Facility-specific Drug Inventory overrides (MyInventory)';

-- Clean up any obsolete uploaded_files tracking for old catalog imports if present
ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;

ALTER TABLE uploaded_files ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'inventory'));

-- Verify indexes on drugs and non_drugs for fast query execution in MyInventory
CREATE INDEX IF NOT EXISTS idx_drugs_vote_status ON drugs(hospital_id, procurement_vote, status);
CREATE INDEX IF NOT EXISTS idx_non_drugs_vote_status ON non_drugs(hospital_id, procurement_vote, status);



-- >>>>>>>>>>>>>>> FILE: 065_fix_appl_drug_codes.sql <<<<<<<<<<<<<<<
-- Migration: 065_fix_appl_drug_codes.sql
-- Enforces strict APPL Google Sheets format rules:
-- 1. All APPL Drugs must have drug_code starting with 'D' (e.g., D02.0001.03)
-- 2. All APPL Non-Drugs must have item_code starting with 'N' (e.g., N01.0001.01)
-- 3. Any non-D item (e.g., S01EC01000T1001XX MDC code) erroneously tagged as 'appl' is updated to 'cc' (Kontrak Pusat / MDC)

UPDATE drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND drug_code NOT LIKE 'D%';

UPDATE non_drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND item_code NOT LIKE 'N%';



-- >>>>>>>>>>>>>>> FILE: 066_clean_appl_to_google_docs_only.sql <<<<<<<<<<<<<<<
-- Migration: 066_clean_appl_to_google_docs_only.sql
-- Restricts APPL catalog strictly to items synced from the official APPL Google Sheet (Lampiran B).
-- Any legacy or 16-character MDC item (e.g., D08AA03000L6001XX) mistakenly tagged as APPL is updated to 'cc' (Kontrak Pusat).

UPDATE drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND (sheet_source IS NULL OR sheet_source != 'Lampiran B' OR LENGTH(drug_code) > 15);

UPDATE non_drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND (sheet_source IS NULL OR sheet_source != 'Lampiran B' OR LENGTH(item_code) > 15);



-- >>>>>>>>>>>>>>> FILE: 067_fix_rls_hospital_id_lookup.sql <<<<<<<<<<<<<<<
-- Migration: 067_fix_rls_hospital_id_lookup.sql
-- Root cause: All RLS policies that used auth.jwt() ->> 'hospital_id' were broken
-- because hospital_id is NOT stored as a JWT claim — it lives in public.users table.
--
-- Fix: Create a SECURITY DEFINER helper function get_my_hospital_id() that
-- safely resolves the current user's hospital_id from public.users using auth.uid().
-- All affected policies are rebuilt to use this function instead.

-- ── Helper function ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_hospital_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT hospital_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ── facility_drug_inventory ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS facility_drug_inventory_insert ON facility_drug_inventory;
DROP POLICY IF EXISTS facility_drug_inventory_select ON facility_drug_inventory;
DROP POLICY IF EXISTS facility_drug_inventory_update ON facility_drug_inventory;
DROP POLICY IF EXISTS facility_drug_inventory_delete ON facility_drug_inventory;

CREATE POLICY facility_drug_inventory_select
  ON facility_drug_inventory FOR SELECT
  USING (hospital_id = get_my_hospital_id());

CREATE POLICY facility_drug_inventory_insert
  ON facility_drug_inventory FOR INSERT
  WITH CHECK (hospital_id = get_my_hospital_id());

CREATE POLICY facility_drug_inventory_update
  ON facility_drug_inventory FOR UPDATE
  USING (hospital_id = get_my_hospital_id())
  WITH CHECK (hospital_id = get_my_hospital_id());

CREATE POLICY facility_drug_inventory_delete
  ON facility_drug_inventory FOR DELETE
  USING (hospital_id = get_my_hospital_id());

-- ── appl_approved_suppliers ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated users to insert/update approved suppliers" ON appl_approved_suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to read approved suppliers" ON appl_approved_suppliers;

CREATE POLICY "appl_approved_suppliers_select"
  ON appl_approved_suppliers FOR SELECT
  USING (hospital_id = get_my_hospital_id());

CREATE POLICY "appl_approved_suppliers_all"
  ON appl_approved_suppliers FOR ALL
  USING (hospital_id = get_my_hospital_id())
  WITH CHECK (hospital_id = get_my_hospital_id());

-- ── appl_sync_logs ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated users to write sync logs" ON appl_sync_logs;
DROP POLICY IF EXISTS "Allow authenticated users to read sync logs" ON appl_sync_logs;

CREATE POLICY "appl_sync_logs_select"
  ON appl_sync_logs FOR SELECT
  USING (hospital_id = get_my_hospital_id());

CREATE POLICY "appl_sync_logs_insert"
  ON appl_sync_logs FOR INSERT
  WITH CHECK (hospital_id = get_my_hospital_id());



-- >>>>>>>>>>>>>>> FILE: 068_create_store_locations_table.sql <<<<<<<<<<<<<<<
-- =====================================================
-- Migration 068: Create store_locations table
-- Description: Enables storekeepers to manage physical store locations (Store -> Cabinet/Rack -> Level/Shelf)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_locations (
    id VARCHAR(100) PRIMARY KEY,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    store_name VARCHAR(150) NOT NULL,
    cabinet_rack VARCHAR(150) NOT NULL,
    shelf_level VARCHAR(150) NOT NULL,
    location_code VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) NOT NULL DEFAULT 'both', -- 'drug', 'non_drug', 'both'
    storage_condition VARCHAR(50) NOT NULL DEFAULT 'ambient', -- 'ambient', 'cold_2_8c', 'controlled', 'frozen'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_store_location_code_per_hospital UNIQUE (hospital_id, location_code)
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_store_locations_hospital ON public.store_locations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_type ON public.store_locations(location_type);

-- RLS Enablement
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access for store_locations"
    ON public.store_locations FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert for store_locations"
    ON public.store_locations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated update for store_locations"
    ON public.store_locations FOR UPDATE
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated delete for store_locations"
    ON public.store_locations FOR DELETE
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');




-- >>>>>>>>>>>>>>> FILE: 069_create_facility_nondrug_inventory.sql <<<<<<<<<<<<<<<
-- Migration: 069_create_facility_nondrug_inventory.sql
-- Stores which non-drug items a facility has explicitly selected for their
-- inventory, along with facility-specific fields (stock, buffer level, notes).
-- This replaces the previous localStorage-only approach so data is shared
-- across all browsers and devices (localhost, production, mobile).
-- Mirrors the pattern used in 063_create_facility_drug_inventory.sql.

CREATE TABLE IF NOT EXISTS facility_nondrug_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  nondrug_id        UUID NOT NULL REFERENCES non_drugs(id) ON DELETE CASCADE,
  facility_stock    INTEGER NOT NULL DEFAULT 0,
  min_buffer_level  INTEGER NOT NULL DEFAULT 10,
  notes             TEXT,
  added_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, nondrug_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fndi_hospital_id ON facility_nondrug_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_fndi_nondrug_id  ON facility_nondrug_inventory(nondrug_id);
CREATE INDEX IF NOT EXISTS idx_fndi_added_at    ON facility_nondrug_inventory(added_at DESC);

-- Auto-update updated_at on row change (reuses existing trigger function)
CREATE TRIGGER update_facility_nondrug_inventory_updated_at
  BEFORE UPDATE ON facility_nondrug_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE facility_nondrug_inventory ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own hospital's facility non-drug inventory
CREATE POLICY "facility_nondrug_inventory_select"
  ON facility_nondrug_inventory FOR SELECT
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_nondrug_inventory_insert"
  ON facility_nondrug_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_nondrug_inventory_update"
  ON facility_nondrug_inventory FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_nondrug_inventory_delete"
  ON facility_nondrug_inventory FOR DELETE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

COMMENT ON TABLE facility_nondrug_inventory IS
  'Tracks which non-drug items a facility has explicitly selected for their inventory. '
  'Replaces localStorage so data is consistent across all browsers and devices.';



-- >>>>>>>>>>>>>>> FILE: 070_seed_scanned_cylinder.sql <<<<<<<<<<<<<<<
-- 070_seed_scanned_cylinder.sql
-- Migration to seed cylinder O2-P101-E-0020 into database inventory

DO $$
DECLARE
  v_hospital_id UUID;
  v_size_id UUID;
  v_type_id UUID;
  v_supplier_id UUID;
BEGIN
  -- 1. Get a valid hospital_id (default to the known one, or first available)
  SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
  IF v_hospital_id IS NULL THEN
    v_hospital_id := '85bb6adc-b868-428b-83f4-e5af2f5cf904';
  END IF;

  -- 2. Get cylinder size for 'E' or standard size
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_sizes') THEN
    SELECT id INTO v_size_id FROM pharmacy_oxygen_cylinder_sizes WHERE code = 'E' LIMIT 1;
    IF v_size_id IS NULL THEN
      SELECT id INTO v_size_id FROM pharmacy_oxygen_cylinder_sizes LIMIT 1;
    END IF;
  END IF;

  -- 3. Get cylinder type
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_types') THEN
    SELECT id INTO v_type_id FROM pharmacy_oxygen_cylinder_types WHERE code = 'E' LIMIT 1;
    IF v_type_id IS NULL THEN
      SELECT id INTO v_type_id FROM pharmacy_oxygen_cylinder_types LIMIT 1;
    END IF;
  END IF;

  -- 4. Get a supplier
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    SELECT id INTO v_supplier_id FROM suppliers LIMIT 1;
  END IF;

  -- 5. Insert the cylinder if the table exists and it is not already present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_inventory') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_inventory 
      WHERE serial_number = 'O2-P101-E-0020' OR qr_code = 'O2-P101-E-0020'
    ) THEN
      INSERT INTO pharmacy_oxygen_cylinder_inventory (
        hospital_id,
        serial_number,
        qr_code,
        qr_code_value,
        cylinder_size_id,
        cylinder_type_id,
        status,
        supplier_id,
        current_location
      ) VALUES (
        v_hospital_id,
        'O2-P101-E-0020',
        'O2-P101-E-0020',
        'O2-P101-E-0020',
        v_size_id,
        v_type_id,
        'issued',
        v_supplier_id,
        'Central Store'
      );
    END IF;
  END IF;
END $$;



-- >>>>>>>>>>>>>>> FILE: 071_create_mystaff_tables.sql <<<<<<<<<<<<<<<
-- ====================================================================================
-- Migration: 071_create_mystaff_tables.sql
-- Module: MyStaff - Enterprise Staff Movement, Leave & Reminder Ecosystem
-- ====================================================================================

-- 1. Create staff_leave_types table
CREATE TABLE IF NOT EXISTS staff_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  kod_cuti TEXT NOT NULL,
  nama_cuti TEXT NOT NULL,
  nama_cuti_en TEXT NOT NULL,
  max_hari_setahun INTEGER,
  require_sijil BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  kategori TEXT NOT NULL CHECK (kategori IN ('biasa', 'perubatan', 'khas', 'gantian', 'lain')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, kod_cuti)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_types_hospital_id ON staff_leave_types(hospital_id);

-- 2. Create staff_leave_quotas table
CREATE TABLE IF NOT EXISTS staff_leave_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES staff_leave_types(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  hak_hari NUMERIC(5,1) NOT NULL DEFAULT 0,
  digunakan_hari NUMERIC(5,1) NOT NULL DEFAULT 0,
  baki_hari NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id, tahun)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_quotas_user_id ON staff_leave_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_quotas_hospital_id ON staff_leave_quotas(hospital_id);

-- 3. Create staff_leave_applications table
CREATE TABLE IF NOT EXISTS staff_leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES staff_leave_types(id) ON DELETE RESTRICT,
  tarikh_mula DATE NOT NULL,
  tarikh_tamat DATE NOT NULL,
  jumlah_hari NUMERIC(4,1) NOT NULL DEFAULT 1,
  sesi TEXT NOT NULL DEFAULT 'full' CHECK (sesi IN ('full', 'am', 'pm')),
  sebab TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  catatan_pelulus TEXT,
  attachment_url TEXT,
  is_half_day BOOLEAN NOT NULL DEFAULT false,
  half_day_session TEXT CHECK (half_day_session IN ('am', 'pm')),
  replacement_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_user_id ON staff_leave_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_hospital_id ON staff_leave_applications(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_department_id ON staff_leave_applications(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_status ON staff_leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_dates ON staff_leave_applications(tarikh_mula, tarikh_tamat);

-- 4. Create staff_movements table (Pergerakan Pegawai / Keluar Pejabat)
CREATE TABLE IF NOT EXISTS staff_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  jenis_pergerakan TEXT NOT NULL CHECK (jenis_pergerakan IN (
    'MEETING', 'COURSE', 'CME', 'PRESENTATION',
    'SITE_VISIT', 'OFFICIAL_DUTY', 'SPECIAL_DUTY',
    'FIELDWORK', 'HOSPITAL_REP', 'OTHER'
  )),
  tajuk TEXT NOT NULL,
  destination TEXT NOT NULL,
  tarikh_mula DATE NOT NULL,
  masa_keluar TIME,
  tarikh_tamat DATE NOT NULL,
  masa_balik TIME,
  tujuan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  catatan TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_movements_user_id ON staff_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_movements_hospital_id ON staff_movements(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_movements_department_id ON staff_movements(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_movements_dates ON staff_movements(tarikh_mula, tarikh_tamat);
CREATE INDEX IF NOT EXISTS idx_staff_movements_jenis ON staff_movements(jenis_pergerakan);

-- 5. Create staff_reminders table
CREATE TABLE IF NOT EXISTS staff_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  tajuk TEXT NOT NULL,
  penerangan TEXT,
  jenis_peringatan TEXT NOT NULL DEFAULT 'other' CHECK (jenis_peringatan IN (
    'meeting', 'cme', 'course', 'deadline', 'submission', 'other'
  )),
  tarikh_peringatan TIMESTAMP WITH TIME ZONE NOT NULL,
  remind_before_minutes INTEGER NOT NULL DEFAULT 60,
  is_shared_dept BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_reminders_user_id ON staff_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_reminders_hospital_id ON staff_reminders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_reminders_dept ON staff_reminders(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_reminders_due ON staff_reminders(tarikh_peringatan);

-- 6. Create staff_deadlines table
CREATE TABLE IF NOT EXISTS staff_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  tajuk TEXT NOT NULL,
  penerangan TEXT,
  kategori TEXT NOT NULL DEFAULT 'laporan' CHECK (kategori IN (
    'laporan', 'anggaran', 'penyerahan', 'audit', 'lain'
  )),
  tarikh_akhir DATE NOT NULL,
  keutamaan TEXT NOT NULL DEFAULT 'medium' CHECK (keutamaan IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'overdue')),
  is_shared_dept BOOLEAN NOT NULL DEFAULT true,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_deadlines_dept ON staff_deadlines(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_deadlines_hospital_id ON staff_deadlines(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_deadlines_tarikh_akhir ON staff_deadlines(tarikh_akhir);
CREATE INDEX IF NOT EXISTS idx_staff_deadlines_status ON staff_deadlines(status);

-- 7. Auto-update triggers
DROP TRIGGER IF EXISTS update_staff_leave_types_updated_at ON staff_leave_types;
CREATE TRIGGER update_staff_leave_types_updated_at
  BEFORE UPDATE ON staff_leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_leave_quotas_updated_at ON staff_leave_quotas;
CREATE TRIGGER update_staff_leave_quotas_updated_at
  BEFORE UPDATE ON staff_leave_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_leave_applications_updated_at ON staff_leave_applications;
CREATE TRIGGER update_staff_leave_applications_updated_at
  BEFORE UPDATE ON staff_leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_movements_updated_at ON staff_movements;
CREATE TRIGGER update_staff_movements_updated_at
  BEFORE UPDATE ON staff_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_reminders_updated_at ON staff_reminders;
CREATE TRIGGER update_staff_reminders_updated_at
  BEFORE UPDATE ON staff_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_deadlines_updated_at ON staff_deadlines;
CREATE TRIGGER update_staff_deadlines_updated_at
  BEFORE UPDATE ON staff_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS)
ALTER TABLE staff_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_deadlines ENABLE ROW LEVEL SECURITY;

-- 8.1 staff_leave_types RLS
CREATE POLICY "Users view leave types in hospital" ON staff_leave_types
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users insert leave types in hospital" ON staff_leave_types
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users update leave types in hospital" ON staff_leave_types
  FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.2 staff_leave_quotas RLS
CREATE POLICY "Users view leave quotas in hospital" ON staff_leave_quotas
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage leave quotas in hospital" ON staff_leave_quotas
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.3 staff_leave_applications RLS
CREATE POLICY "Users view leave applications in hospital" ON staff_leave_applications
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage own leave applications" ON staff_leave_applications
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.4 staff_movements RLS
CREATE POLICY "Users view movements in hospital" ON staff_movements
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage movements in hospital" ON staff_movements
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.5 staff_reminders RLS
CREATE POLICY "Users view reminders in hospital" ON staff_reminders
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage reminders in hospital" ON staff_reminders
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.6 staff_deadlines RLS
CREATE POLICY "Users view deadlines in hospital" ON staff_deadlines
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage deadlines in hospital" ON staff_deadlines
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 9. Seed default Malaysian civil service leave types for existing hospitals
DO $$
DECLARE
  h_rec RECORD;
BEGIN
  FOR h_rec IN SELECT id FROM hospitals LOOP
    INSERT INTO staff_leave_types (hospital_id, kod_cuti, nama_cuti, nama_cuti_en, max_hari_setahun, require_sijil, require_approval, kategori)
    VALUES
      (h_rec.id, 'CR', 'Cuti Rehat', 'Annual Leave', 25, false, true, 'biasa'),
      (h_rec.id, 'CS', 'Cuti Sakit', 'Medical Leave', 90, true, true, 'perubatan'),
      (h_rec.id, 'CM', 'Cuti Sakit Masuk Hospital', 'Hospitalisation Leave', 90, true, true, 'perubatan'),
      (h_rec.id, 'CB', 'Cuti Bersalin', 'Maternity Leave', 90, false, true, 'khas'),
      (h_rec.id, 'CP', 'Cuti Paterniti', 'Paternity Leave', 7, false, true, 'khas'),
      (h_rec.id, 'CK', 'Cuti Khas Kematian', 'Compassionate Leave', 3, false, true, 'khas'),
      (h_rec.id, 'CH', 'Cuti Haji', 'Haji Leave', 40, false, true, 'khas'),
      (h_rec.id, 'CG', 'Cuti Gantian', 'Replacement Leave', 14, false, true, 'gantian'),
      (h_rec.id, 'CTR', 'Cuti Tanpa Rekod', 'Unrecorded Leave', 3, false, true, 'biasa'),
      (h_rec.id, 'CSG', 'Cuti Separuh Gaji', 'Half-Pay Leave', 90, true, true, 'lain'),
      (h_rec.id, 'CTG', 'Cuti Tanpa Gaji', 'Unpaid Leave', NULL, false, true, 'lain')
    ON CONFLICT (hospital_id, kod_cuti) DO NOTHING;
  END LOOP;
END $$;



-- >>>>>>>>>>>>>>> FILE: 072_add_usage_notes_to_pharmacy_oxygen_dept_request_items.sql <<<<<<<<<<<<<<<
-- 072_add_usage_notes_to_pharmacy_oxygen_dept_request_items.sql
-- Add usage_notes column to pharmacy_oxygen_dept_request_items for cylinder specification notes (e.g., Bullnose vs Pin Index)

ALTER TABLE pharmacy_oxygen_dept_request_items 
ADD COLUMN IF NOT EXISTS usage_notes TEXT;



-- >>>>>>>>>>>>>>> FILE: 073_cc_and_lp_sync_logs_policies.sql <<<<<<<<<<<<<<<
-- Enable Row Level Security and add policies for cc_sync_logs and lp_sync_logs

ALTER TABLE IF EXISTS cc_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on cc_sync_logs" ON cc_sync_logs;
CREATE POLICY "Allow all access on cc_sync_logs"
  ON cc_sync_logs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE IF EXISTS lp_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on lp_sync_logs" ON lp_sync_logs;
CREATE POLICY "Allow all access on lp_sync_logs"
  ON lp_sync_logs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);



-- >>>>>>>>>>>>>>> FILE: 074_create_staff_org_chart_table.sql <<<<<<<<<<<<<<<
-- ====================================================================================
-- Migration: 074_create_staff_org_chart_table.sql
-- Module: MyStaff - Enterprise Organizational Chart Cloud Persistence & Realtime Sync
-- ====================================================================================

-- 1. Create staff_org_chart table
CREATE TABLE IF NOT EXISTS staff_org_chart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  chart_key TEXT NOT NULL DEFAULT 'main_org_chart',
  chart_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, chart_key)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_org_chart_hospital_id ON staff_org_chart(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_org_chart_chart_key ON staff_org_chart(chart_key);

-- 3. Auto-update trigger for updated_at
DROP TRIGGER IF EXISTS update_staff_org_chart_updated_at ON staff_org_chart;
CREATE TRIGGER update_staff_org_chart_updated_at
  BEFORE UPDATE ON staff_org_chart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE staff_org_chart ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "allow_read_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_read_staff_org_chart"
  ON staff_org_chart
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "allow_insert_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_insert_staff_org_chart"
  ON staff_org_chart
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_update_staff_org_chart"
  ON staff_org_chart
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_delete_staff_org_chart"
  ON staff_org_chart
  FOR DELETE
  USING (true);

-- 6. Permissions
GRANT ALL ON staff_org_chart TO authenticated;
GRANT ALL ON staff_org_chart TO anon;
GRANT ALL ON staff_org_chart TO service_role;

-- 7. Add to Realtime publication if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE staff_org_chart;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;



-- >>>>>>>>>>>>>>> FILE: 075_expand_varchar_limits.sql <<<<<<<<<<<<<<<
-- Migration 075: Expand varchar limits on procurement, warrants, and purchase order tables
-- Fixes PostgreSQL error 22001 (value too long for type character varying(10))

ALTER TABLE pharmacy_purchase_orders 
  ALTER COLUMN vote_code TYPE TEXT,
  ALTER COLUMN vote_activity TYPE TEXT,
  ALTER COLUMN category TYPE TEXT,
  ALTER COLUMN department TYPE TEXT,
  ALTER COLUMN po_number TYPE TEXT,
  ALTER COLUMN po_type TYPE TEXT,
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN payment_terms TYPE TEXT;

ALTER TABLE pharmacy_warrants 
  ALTER COLUMN vote_code TYPE TEXT,
  ALTER COLUMN vote_activity TYPE TEXT,
  ALTER COLUMN category TYPE TEXT;

ALTER TABLE pharmacy_appl_expenses 
  ALTER COLUMN vote_activity TYPE TEXT,
  ALTER COLUMN category TYPE TEXT,
  ALTER COLUMN po_type TYPE TEXT,
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN lpo_number TYPE TEXT,
  ALTER COLUMN po_number TYPE TEXT;

ALTER TABLE pharmacy_lpo 
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN lpo_number TYPE TEXT;

ALTER TABLE pharmacy_purchase_order_items 
  ALTER COLUMN item_type TYPE TEXT;



-- >>>>>>>>>>>>>>> FILE: 20260813_distribution_indent.sql <<<<<<<<<<<<<<<
-- Migration: Department Indent & Entitlement Setup (Distribution Module)
-- Description: Adds tables for department indent requests, request line items, and department item entitlements.

-- 1. Department Indent Entitlements Configuration
CREATE TABLE IF NOT EXISTS public.distribution_indent_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
  item_id UUID NOT NULL,
  item_code TEXT,
  item_name TEXT NOT NULL,
  max_qty_per_request INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Department Indent Request Headers
CREATE TABLE IF NOT EXISTS public.distribution_indent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number TEXT UNIQUE NOT NULL,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  requesting_department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  requested_by UUID,
  request_date TIMESTAMPTZ DEFAULT now(),
  required_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected','issued','completed','cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  issued_by UUID,
  issued_at TIMESTAMPTZ,
  received_by UUID,
  received_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Department Indent Request Items (Lines)
CREATE TABLE IF NOT EXISTS public.distribution_indent_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_request_id UUID NOT NULL REFERENCES public.distribution_indent_requests(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
  item_id UUID NOT NULL,
  item_code TEXT,
  item_name TEXT NOT NULL,
  unit TEXT DEFAULT 'UNIT',
  qty_requested INTEGER NOT NULL CHECK (qty_requested > 0),
  qty_approved INTEGER,
  qty_issued INTEGER DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_indent_requests_hosp_dept ON public.distribution_indent_requests (hospital_id, requesting_department_id);
CREATE INDEX IF NOT EXISTS idx_indent_requests_status ON public.distribution_indent_requests (status);
CREATE INDEX IF NOT EXISTS idx_indent_entitlements_hosp_dept ON public.distribution_indent_entitlements (hospital_id, department_id);
CREATE INDEX IF NOT EXISTS idx_indent_items_req_id ON public.distribution_indent_request_items (indent_request_id);

-- Enable RLS
ALTER TABLE public.distribution_indent_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_indent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_indent_request_items ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "Allow all access to distribution_indent_entitlements" ON public.distribution_indent_entitlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to distribution_indent_requests" ON public.distribution_indent_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to distribution_indent_request_items" ON public.distribution_indent_request_items FOR ALL USING (true) WITH CHECK (true);



