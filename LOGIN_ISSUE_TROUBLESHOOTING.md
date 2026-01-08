# Login Issue Troubleshooting Guide

## Problem
User exists in database but cannot log in with error: "Invalid login credentials"

## Symptoms
- User found in `users` table
- Email and employee_id are correct
- Supabase Auth login fails with 400 Bad Request
- Error: "Auth login failed. User exists in database but auth credentials are invalid."

## Root Causes

### 1. Auth Account Not Created
**Cause**: During access request approval, the Supabase Auth account creation failed but the user record was still created.

**Indicators**:
- User exists in `users` table
- No corresponding entry in Supabase Auth (auth.users)
- Access request status is "approved"

**Solution**: Use the fix utility to create the missing Auth account.

### 2. Password Set Incorrectly
**Cause**: The password was set incorrectly during Auth account creation, or the encrypted password was corrupted.

**Indicators**:
- Auth account exists
- Login fails with correct password
- Access request has encrypted password

**Solution**: Reset the password or use the fix utility.

### 3. Encrypted Password Deleted Too Early
**Cause**: The encrypted password was deleted from access_requests before the Auth account was created.

**Indicators**:
- User exists
- Auth account doesn't exist
- Access request has no encrypted password

**Solution**: Admin must manually reset the password.

## Diagnostic Steps

### Step 1: Check User in Database
```sql
SELECT id, email, employee_id, status 
FROM users 
WHERE email = 'user@example.com' 
   OR employee_id = 'EMPLOYEE_ID';
```

### Step 2: Check Auth Account
Use the diagnostic function:
```typescript
import { diagnoseUserAccount } from '@/services/userAccountFixService'

const result = await diagnoseUserAccount('user@example.com')
console.log(result.diagnostic)
```

### Step 3: Check Access Request
```sql
SELECT id, email, status, password_encrypted IS NOT NULL as has_password
FROM access_requests
WHERE email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

## Fix Methods

### Method 1: Automatic Fix (Recommended)
If the access request still has the encrypted password:

```typescript
import { fixUserAccount } from '@/services/userAccountFixService'

// Fix using password from access request
const result = await fixUserAccount(userId)
```

### Method 2: Manual Password Reset
If encrypted password is not available:

```typescript
import { fixUserAccount } from '@/services/userAccountFixService'

// Fix with new password
const result = await fixUserAccount(userId, 'NewSecurePassword123!')
```

### Method 3: Using Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find user by email
3. Click "Reset Password" or "Send Password Reset Email"

### Method 4: Direct SQL (Admin Only)
```sql
-- Check if Auth user exists
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';

-- If doesn't exist, create via Admin API (use service role key)
```

## Prevention

### During Approval Process
The approval process now includes:
1. ✅ Better error logging when Auth account creation fails
2. ✅ Rollback of user creation if Auth account creation fails
3. ✅ Verification that Auth account was actually created
4. ✅ Diagnostic logging for troubleshooting

### Best Practices
1. **Always verify approval succeeded completely** - Check both user table and Auth account
2. **Monitor approval logs** - Watch for Auth account creation failures
3. **Keep encrypted passwords** - Don't delete until confirming Auth account exists
4. **Test login immediately** - After approval, test that user can log in

## Quick Fix Script

For admins to quickly fix a user account:

```typescript
// In browser console or admin panel
import { diagnoseUserAccount, fixUserAccount } from '@/services/userAccountFixService'

// 1. Diagnose
const diag = await diagnoseUserAccount('user@example.com')
console.log('Diagnostic:', diag)

// 2. Fix if possible
if (diag.diagnostic?.canFix) {
  const fix = await fixUserAccount(diag.diagnostic.userId)
  console.log('Fix result:', fix)
} else {
  console.log('Cannot auto-fix. Manual password reset required.')
}
```

## Common Error Messages

### "Invalid login credentials"
- **Meaning**: Auth account doesn't exist OR password is wrong
- **Fix**: Use diagnostic to check, then fix account

### "Email not confirmed"
- **Meaning**: Auth account exists but email not confirmed
- **Fix**: Use `confirmAuthUserEmail()` function

### "User not found in database"
- **Meaning**: User doesn't exist in users table
- **Fix**: Check if account was actually created

## Testing After Fix

1. Try logging in with employee_id and password
2. Verify user can access their dashboard
3. Check that session is created correctly
4. Verify user data loads correctly

## Related Files

- `src/services/userAccountFixService.ts` - Diagnostic and fix utilities
- `src/services/authUserService.ts` - Auth account management
- `src/services/accessRequestManagementService.ts` - Approval process
- `src/services/authService.ts` - Login process

## Support

If automatic fixes don't work:
1. Check Supabase logs for Auth API errors
2. Verify service role key is configured correctly
3. Check RLS policies allow Auth account creation
4. Contact system administrator for manual intervention

