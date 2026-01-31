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

