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

