# System Admin Account Fix Guide

## ⚠️ CRITICAL ISSUE

If System Admin cannot log in, this is a **CRITICAL** problem because:
- System Admin is the **ONLY** account that can manage the entire system
- Only **1 System Admin** is allowed (enforced by database trigger)
- Without System Admin access, you cannot:
  - Create Hospital Admins
  - Manage hospitals
  - Fix other user accounts
  - Access system-wide settings

## Problem: System Admin Cannot Log In

**Symptoms**:
- User exists in `users` table with `role_code = 'system_admin'`
- Email: `amri.amit77@gmail.com`
- Employee ID: `amriamit`
- Login fails with "Invalid login credentials"
- Error: "Auth login failed. User exists in database but auth credentials are invalid."

**Root Cause**:
The Supabase Auth account was either:
1. Never created during initial setup
2. Created but password was set incorrectly
3. Deleted or corrupted
4. **Created with the wrong UID (Auth user ID does not match `users.id`)**

## Immediate Fix Steps

### ⚠️ CRITICAL: ID Mismatch Issue

If System Admin has **mismatched IDs** between `public.users` and `auth.users`, you have two options:

**Option A: Update public.users.id to match auth.users.id (Recommended)**
- Run migration `033_fix_system_admin_id_mismatch.sql`
- This updates all foreign key references automatically
- **Use this if**: Auth account already exists with correct password

**Option B: Delete and recreate auth user with correct ID**
- Delete existing auth user in Dashboard
- Use Admin API to create new auth user with matching UUID
- **Use this if**: You want to start fresh with correct IDs

### Option 1: Use the Fix Function (If IDs Match)

**In Browser Console** (if you have access to the app):

```typescript
// Import the fix function
import { diagnoseSystemAdmin, fixSystemAdminAccount, verifySystemAdminLogin } from '@/services/systemAdminFixService'

// Step 1: Diagnose the issue
const diag = await diagnoseSystemAdmin()
console.log('System Admin Diagnostic:', diag)

// Step 2: Fix with new password
if (diag.diagnostic?.canFix) {
  const fix = await fixSystemAdminAccount('YourNewSecurePassword123!')
  console.log('Fix result:', fix)
  
  // Step 3: Verify it works
  if (fix.success) {
    const verify = await verifySystemAdminLogin('YourNewSecurePassword123!')
    console.log('Verification:', verify)
  }
}
```

### Option 2: Fix ID Mismatch with Migration (If IDs Don't Match)

**If your System Admin has mismatched IDs** (most common issue):

1. **Run the migration**:
   ```sql
   -- Go to Supabase Dashboard → SQL Editor
   -- Copy and paste the contents of: supabase/migrations/033_fix_system_admin_id_mismatch.sql
   -- Click "Run"
   ```

2. **Verify the fix**:
   ```sql
   SELECT 
     u.id as public_users_id,
     u.email,
     a.id as auth_users_id,
     CASE WHEN u.id = a.id THEN 'MATCH ✅' ELSE 'MISMATCH ❌' END as status
   FROM public.users u
   JOIN auth.users a ON u.email = a.email
   WHERE u.email = 'amri.amit77@gmail.com';
   ```

3. **Test login** with your password

### Option 3: Supabase Dashboard (If Auth Account Doesn't Exist)

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Search for**: `amri.amit77@gmail.com`
3. **If user exists**:
   - Click on the user
   - Click "Reset Password" or "Send Password Reset Email"
   - Or manually set password: Click "..." → "Update User" → Set new password
4. **If user DOES NOT exist**:
   - Click "Add User" → "Create new user"
   - Email: `amri.amit77@gmail.com`
   - Password: `[STRONG_PASSWORD]`
   - **IMPORTANT**: Set "Auto Confirm User" to `true`
   - **IMPORTANT**: Use the same UUID as the user record in `users` table
   - To get the UUID: Run this SQL:
     ```sql
     SELECT id, email, employee_id 
     FROM users 
     WHERE email = 'amri.amit77@gmail.com';
     ```
   - Copy the `id` and use it when creating the Auth user

### Option 3: SQL + Admin API (Advanced)

**Step 1: Get System Admin User ID**
```sql
SELECT id, email, employee_id, status
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.role_code = 'system_admin'
  AND u.status = 'active';
```

**Step 2: Create/Update Auth Account via Admin API**

Using the user ID from Step 1, create the Auth account:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amri.amit77@gmail.com",
    "password": "YourNewSecurePassword123!",
    "email_confirm": true,
    "id": "USER_ID_FROM_STEP_1"
  }'
```

Or if Auth account exists, update password:

```bash
curl -X PUT 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users/USER_ID' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "YourNewSecurePassword123!",
    "email_confirm": true
  }'
```

## Verification Steps

After fixing, verify:

1. **Check Auth Account Exists**:
   ```sql
   SELECT id, email, email_confirmed_at, created_at
   FROM auth.users
   WHERE email = 'amri.amit77@gmail.com';
   ```

2. **Check User Record**:
   ```sql
   SELECT u.id, u.email, u.employee_id, u.status, r.role_code
   FROM users u
   JOIN roles r ON u.role_id = r.id
   WHERE u.email = 'amri.amit77@gmail.com';
   ```

3. **Verify IDs Match**:
   - `users.id` should equal `auth.users.id`
   - If they don't match, that's the problem!

### ⚠️ Common Failure: Auth UID Mismatch (Recurring Login Issues)

If System Admin keeps “breaking again”, the most common cause is:

- **`public.users.id` (System Admin profile)**: one UUID
- **`auth.users.id` (System Admin auth login)**: a different UUID

This usually happens when the Auth user was created in Supabase Dashboard **without setting the UID** to the existing `users.id`.

**Fix** (safe approach):
- Delete the incorrect Auth user (the one with the wrong UUID) in Supabase Dashboard
- Recreate it using the **same email** but with **UID set to the existing `users.id`**
- Set a new strong password and ensure **Auto Confirm** is enabled

4. **Test Login**:
   - Employee ID: `amriamit`
   - Password: `[The password you set]`

## Why This Happened

Based on the migration file `003_seed_system_admin.sql`, System Admin should be created in **2 steps**:

1. **First**: Create Auth user in Supabase Dashboard
2. **Second**: Create user record in `users` table with the same UUID

**Possible causes**:
- Step 1 was skipped or failed
- Step 2 was done but Step 1 wasn't
- Auth account was created but password was wrong
- Auth account was deleted accidentally

## Prevention

To prevent this in the future:

1. **Always verify both accounts exist** after creating System Admin:
   ```sql
   -- Check both exist and IDs match
   SELECT 
     u.id as user_id,
     u.email,
     a.id as auth_id,
     CASE WHEN u.id = a.id THEN 'MATCH' ELSE 'MISMATCH' END as id_match
   FROM users u
   LEFT JOIN auth.users a ON u.id = a.id
   WHERE u.email = 'amri.amit77@gmail.com';
   ```

2. **Test login immediately** after creating System Admin

3. **Document credentials securely** (offline, encrypted)

4. **Use the seed script properly** - Follow `003_seed_system_admin.sql` instructions exactly

## Emergency Access

If you cannot access the app at all:

1. **Use Supabase Dashboard** directly (bypasses the app)
2. **Use SQL Editor** in Supabase Dashboard
3. **Use Admin API** with service role key

## Security Notes

- **Never share System Admin credentials**
- **Change password immediately** after fixing
- **Enable 2FA** if available
- **Document the fix** for future reference
- **Verify only 1 System Admin exists**:
  ```sql
  SELECT COUNT(*) as system_admin_count
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE r.role_code = 'system_admin'
    AND u.status = 'active';
  ```
  Should return: `1`

## Related Files

- `src/services/systemAdminFixService.ts` - Fix utilities
- `supabase/migrations/003_seed_system_admin.sql` - Initial setup instructions
- `supabase/migrations/002_rls_policies.sql` - System Admin protection policies

## Quick Reference

**System Admin Account**:
- Email: `amri.amit77@gmail.com`
- Employee ID: `amriamit`
- Role: `system_admin`
- Status: Should be `active`
- Count: Should be exactly `1`

**Fix Command** (Browser Console):
```typescript
await fixSystemAdminAccount('NewSecurePassword123!')
```

