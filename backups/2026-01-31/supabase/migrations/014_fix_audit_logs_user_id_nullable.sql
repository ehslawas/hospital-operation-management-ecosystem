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

