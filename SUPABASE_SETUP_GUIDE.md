# Supabase Setup Guide - Ensuring Data Saves Correctly

## Issue
Data is not being saved to Supabase tables. This guide will help you ensure everything is configured correctly.

## Prerequisites

1. **Supabase Project Created**
   - You have a Supabase project at https://supabase.com
   - You have the project URL and anon key

2. **Environment Variables**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Database Tables Created**
   - Run all migration files in `supabase/migrations/` in order:
     - `001_system_admin_tables.sql` - Creates tables for System Admin
     - `002_rls_policies.sql` - Sets up Row Level Security policies
     - `003_seed_system_admin.sql` - Seeds initial System Admin (optional)
     - `004_database_functions.sql` - Creates database functions

## Common Issues and Solutions

### 1. RLS (Row Level Security) Policies Missing

If RLS is enabled on tables but no policies exist, inserts will fail silently.

**Solution**: Check if RLS policies exist for the `hospitals` table:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'hospitals';

-- If RLS is enabled but no policies exist, create one:
-- For System Admin to manage all hospitals
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
  );

-- For service role (if using service role key for admin operations)
CREATE POLICY "service_role_full_access_hospitals"
  ON hospitals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Missing Tables

Ensure all required tables exist:

```sql
-- Check if hospitals table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hospitals'
);

-- If missing, create it:
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
  admin_id UUID REFERENCES users(id) UNIQUE,
  license_valid_until DATE,
  max_users INTEGER DEFAULT 100,
  subscription_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 3. Authentication Not Working

If you're not authenticated, RLS policies will block all operations.

**Solution**: 
- Ensure you're logged in as a System Admin
- Check that the user has the `system_admin` role
- Verify the JWT token is being sent with requests

### 4. Check Browser Console for Errors

Open browser DevTools (F12) and check:
- **Console tab**: Look for Supabase errors
- **Network tab**: Check if requests to Supabase are failing
- Look for 401 (Unauthorized) or 403 (Forbidden) errors

### 5. Verify Supabase Connection

Add this to your code temporarily to test:

```typescript
// In browser console or a test page
import { supabase } from './services/supabase'

// Test connection
const testConnection = async () => {
  const { data, error } = await supabase.from('hospitals').select('count')
  console.log('Connection test:', { data, error })
}

testConnection()
```

## Step-by-Step Verification

1. **Check Environment Variables**
   ```bash
   # In your terminal
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Verify Tables Exist in Supabase**
   - Go to Supabase Dashboard → Table Editor
   - Check that these tables exist:
     - `hospitals`
     - `users`
     - `roles`
     - `hospital_modules`
     - `system_health_logs`
     - `system_backups`
     - `system_alerts`

3. **Check RLS Policies**
   - Go to Supabase Dashboard → Authentication → Policies
   - Verify policies exist for each table
   - For System Admin operations, ensure policies allow:
     - SELECT (read)
     - INSERT (create)
     - UPDATE (modify)
     - DELETE (remove)

4. **Test Insert Operation**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO hospitals (hospital_code, hospital_name, status)
   VALUES ('TEST', 'Test Hospital', 'active')
   RETURNING *;
   ```

5. **Check Application Logs**
   - Open browser console
   - Try creating a hospital
   - Look for any error messages
   - Check Network tab for failed requests

## Quick Fix: Disable RLS Temporarily (Development Only)

⚠️ **WARNING**: Only do this in development, never in production!

```sql
-- Temporarily disable RLS to test
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
```

## Required RLS Policies for Hospitals Table

Add these policies to allow System Admin to manage hospitals:

```sql
-- Enable RLS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- System Admin can do everything
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

-- Allow service role (for admin operations via service key)
CREATE POLICY "service_role_full_access_hospitals"
  ON hospitals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Next Steps

1. Run the migration files in order
2. Create the RLS policies above
3. Restart your development server
4. Try creating a hospital again
5. Check Supabase dashboard to verify data was saved

## Still Having Issues?

1. Check Supabase Dashboard → Logs for database errors
2. Verify your Supabase project is active (not paused)
3. Check if you're using the correct anon key (not service role key for client-side)
4. Ensure your Supabase project allows connections from your domain

