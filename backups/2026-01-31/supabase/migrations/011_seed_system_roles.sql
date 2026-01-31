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

