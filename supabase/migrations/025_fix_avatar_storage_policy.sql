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

