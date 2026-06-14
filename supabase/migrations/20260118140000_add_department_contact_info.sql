-- Add phone and email columns to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS email TEXT;
