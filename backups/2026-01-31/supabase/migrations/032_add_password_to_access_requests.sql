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

