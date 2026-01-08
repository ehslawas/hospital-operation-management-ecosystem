# Authentication Flow Explanation

This document explains how user authentication works in two scenarios:
1. **User fills out Access Request Form** (Public user registration)
2. **System Admin creates user manually** (Admin user creation)

---

## 🔄 Scenario 1: User Fills Out Access Request Form

### Step-by-Step Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Submits Access Request                            │
│ User fills form → submitAccessRequest()                         │
│ Creates record in: access_requests table                        │
│ Status: "pending"                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Admin Reviews Request                                  │
│ Admin sees request in dashboard                                 │
│ Admin clicks "Approve" → approveAccessRequest()                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: System Creates User Account                            │
│ approveAccessRequest() does:                                    │
│                                                                 │
│  a) Creates record in users table:                             │
│     - email: from request                                       │
│     - employee_id: auto-generated (e.g., "HKL-PHR-001")        │
│     - full_name, ic_number, etc. from request                  │
│     - status: "active"                                         │
│     - id: new UUID (e.g., "abc-123-def-456")                  │
│                                                                 │
│  b) Creates Supabase Auth user:                                │
│     - Calls createAuthUser(email, tempPassword, userId)         │
│     - Uses Admin API with service role key                     │
│     - Creates in auth.users table                              │
│     - email_confirm: true (auto-confirmed!)                    │
│     - id: same UUID as users table                             │
│                                                                 │
│  c) Generates temporary password:                              │
│     - Random 12-character secure password                      │
│     - Logged to console (TODO: send via email)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: User Can Login Immediately                              │
│ User receives credentials (email + temp password)               │
│ User goes to login page                                         │
│ Enters: Employee ID + Password                                  │
│ System:                                                          │
│  1. Finds user by employee_id in users table                   │
│  2. Gets email from users table                                │
│  3. Uses email to authenticate with Supabase Auth              │
│  4. Login succeeds! ✅                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Code Flow for Access Request:

```typescript
// 1. User submits form
submitAccessRequest(formData) 
  → Creates record in access_requests table

// 2. Admin approves
approveAccessRequest(requestId, approvedBy, roleId)
  → Step 2a: Creates user in users table
  → Step 2b: Calls createAuthUser(email, tempPassword, userId)
    → createAuthUser() uses Admin API
    → Sets email_confirm: true
    → Creates auth.users record with same UUID
  → Step 2c: Generates temp password
  → Returns success

// 3. User logs in
login(employeeId, password)
  → Finds user by employee_id
  → Gets email from users table
  → Calls supabase.auth.signInWithPassword(email, password)
  → Login succeeds!
```

---

## 🔄 Scenario 2: System Admin Creates User Manually

### Step-by-Step Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Admin Opens User Creation Form                         │
│ Admin goes to: Users → Create New User                          │
│ Fills in: email, employee_id, name, role, etc.                 │
│ Clicks "Create User"                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: System Creates User Account                             │
│ createUser(userData) does:                                       │
│                                                                 │
│  a) Creates record in users table:                             │
│     - All fields from form                                       │
│     - id: new UUID (e.g., "xyz-789-abc-123")                    │
│                                                                 │
│  b) Creates Supabase Auth user (if email provided):            │
│     - Calls createAuthUser(email, tempPassword, userId)         │
│     - Uses Admin API with service role key                      │
│     - Creates in auth.users table                               │
│     - email_confirm: true (auto-confirmed!)                    │
│     - id: same UUID as users table                              │
│                                                                 │
│  c) Generates temporary password:                               │
│     - Random 12-character secure password                      │
│     - Logged to console (TODO: send via email)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: User Can Login Immediately                              │
│ Admin provides credentials to user                              │
│ User goes to login page                                         │
│ Enters: Employee ID + Password                                  │
│ System:                                                          │
│  1. Finds user by employee_id in users table                   │
│  2. Gets email from users table                                │
│  3. Uses email to authenticate with Supabase Auth              │
│  4. Login succeeds! ✅                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Code Flow for Manual Creation:

```typescript
// 1. Admin creates user
createUser(userData)
  → Step 1a: Creates user in users table
  → Step 1b: If email provided, calls createAuthUser(email, tempPassword, userId)
    → createAuthUser() uses Admin API
    → Sets email_confirm: true
    → Creates auth.users record with same UUID
  → Step 1c: Generates temp password
  → Returns user with relations

// 2. User logs in
login(employeeId, password)
  → Finds user by employee_id
  → Gets email from users table
  → Calls supabase.auth.signInWithPassword(email, password)
  → Login succeeds!
```

---

## 🔑 Key Points:

### 1. **Two Tables, One User**
Each user has **TWO records**:
- `public.users` - Your application's user data (employee_id, name, role, etc.)
- `auth.users` - Supabase Auth data (email, password hash, email confirmation)

Both use the **SAME UUID** to link them together.

### 2. **Auto-Confirmation**
When `VITE_SUPABASE_SERVICE_ROLE_KEY` is set:
- `createAuthUser()` uses **Admin API**
- Sets `email_confirm: true`
- User can login **immediately** without email confirmation

### 3. **Temporary Password**
- Generated automatically (12 characters, secure)
- Currently logged to console
- User should change on first login
- TODO: Send via email in production

### 4. **Login Process**
```
User enters: Employee ID + Password
    ↓
System finds user in users table by employee_id
    ↓
System gets email from users table
    ↓
System authenticates with Supabase Auth using email + password
    ↓
Login succeeds!
```

---

## ⚠️ Important Notes:

### If Service Role Key is NOT Set:
- Falls back to `signUp()` method
- Requires email confirmation
- User cannot login until they confirm email
- **Solution**: Set `VITE_SUPABASE_SERVICE_ROLE_KEY` in `.env`

### For Existing Users (Created Before This Implementation):
- They may not have `auth.users` records
- Or their email may not be confirmed
- **Solution**: Use `confirmAuthUserEmail()` function or confirm via Supabase Dashboard

---

## 📝 Summary:

**Both scenarios work the same way:**
1. Create user in `users` table
2. Create user in `auth.users` table (with same UUID)
3. Auto-confirm email (if service role key is set)
4. Generate temporary password
5. User can login immediately with Employee ID + Password

The only difference is **when** the user account is created:
- **Scenario 1**: After admin approves access request
- **Scenario 2**: When admin manually creates user

