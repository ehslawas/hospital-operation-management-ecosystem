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

