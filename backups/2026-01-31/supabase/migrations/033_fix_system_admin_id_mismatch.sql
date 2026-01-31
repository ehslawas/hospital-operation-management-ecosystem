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

