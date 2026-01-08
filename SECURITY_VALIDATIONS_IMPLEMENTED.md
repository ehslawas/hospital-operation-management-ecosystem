# Security Validations Implemented

## Overview
This document outlines all security validations implemented to ensure proper access control and prevent security vulnerabilities in the account creation and access request approval system.

## Account Creation Flow

### 1. System Admin
- **Creation Method**: Only 1 System Admin allowed (enforced by database trigger)
- **Creation Location**: System Admin features only
- **Access**: Full system access across all hospitals

### 2. Hospital Admin
- **Creation Method**: Created manually by System Admin only via `hospitalAdminService.ts`
- **Cannot be created through**: Access Request Form
- **Validation**: 
  - Only 1 Hospital Admin per hospital (enforced in `createHospitalAdmin`)
  - Cannot be assigned during access request approval
- **Access**: Only their specific hospital

### 3. Staff
- **Creation Method**: Access Request Form → Approval by Hospital Admin
- **Validation**: 
  - Hospital Admin can only approve requests for their own hospital
  - Cannot assign admin roles during approval
  - Duplicate IC numbers prevented across different hospitals

## Security Validations Implemented

### 1. Hospital Access Validation
**Location**: `src/services/accessRequestManagementService.ts`

**Functions**:
- `validateHospitalAccess()` - Validates that Hospital Admins can only access their own hospital's requests
- Applied in:
  - `approveAccessRequest()` - Before approving
  - `rejectAccessRequest()` - Before rejecting
  - `getAccessRequestById()` - When fetching with user ID

**Validation Logic**:
```typescript
- System Admin: Can access all hospitals ✓
- Hospital Admin: Can only access their own hospital ✓
- Other roles: Cannot approve/reject requests ✓
```

### 2. Role Assignment Validation
**Location**: `src/services/accessRequestManagementService.ts`

**Function**: `validateRoleAssignment()`

**Prevents**:
- Assigning `system_admin` role through access request approval
- Assigning `hospital_admin` role through access request approval

**Applied in**:
- `approveAccessRequest()` - Validates role before and after resolving role ID/UUID

### 3. UI-Level Access Control
**Location**: `src/pages/admin/accessRequests/AccessRequestDetailPage.tsx`

**Validation**:
- Checks if Hospital Admin is trying to view request from another hospital
- Redirects with error message if unauthorized
- Prevents loading request details for unauthorized hospitals

### 4. Duplicate User Prevention
**Location**: `src/services/accessRequestManagementService.ts` (approveAccessRequest)

**Validation**:
- Checks if user with same IC number exists in different hospital
- Prevents approval if duplicate found in different hospital
- Allows same IC number in same hospital (for updates)

### 5. Request Fetching Security
**Location**: `src/services/accessRequestManagementService.ts`

**Function**: `getAccessRequestById()`

**Enhancement**:
- Optional `requesterUserId` parameter
- Validates hospital access when user ID provided
- Throws error if Hospital Admin tries to fetch other hospital's requests

## Database-Level Security

### Row Level Security (RLS) Policies
**Location**: `supabase/migrations/029_ensure_anonymous_access_requests_insert.sql`

**Policies**:
1. `allow_public_insert_access_requests` - Allows anonymous users to submit requests
2. `system_admin_full_access_access_requests` - System Admin full access
3. `hospital_admin_scope_access_requests` - Hospital Admin can only access their hospital's requests
4. `service_role_full_access_access_requests` - Service role bypass

**Key Policy**:
```sql
hospital_admin_scope_access_requests:
- Checks: users.hospital_id = access_requests.hospital_id
- Prevents Hospital Admins from accessing other hospitals' requests at database level
```

## Security Flow Summary

### Access Request Submission
1. ✅ Anonymous users can submit requests (public insert policy)
2. ✅ Password encrypted and stored securely
3. ✅ Request stored with `status: 'pending'`

### Access Request Approval
1. ✅ **Hospital Validation**: Hospital Admin can only approve their hospital's requests
2. ✅ **Role Validation**: Admin roles cannot be assigned
3. ✅ **Duplicate Check**: Same IC number in different hospital prevented
4. ✅ **User Creation**: Creates user in `users` table
5. ✅ **Auth Account**: Creates Supabase Auth account with user's password
6. ✅ **Status Update**: Only updates status after all operations succeed

### Access Request Rejection
1. ✅ **Hospital Validation**: Hospital Admin can only reject their hospital's requests
2. ✅ **Status Update**: Updates status to 'rejected' with reason

### Access Request Viewing
1. ✅ **List View**: Hospital Admins automatically filtered to their hospital
2. ✅ **Detail View**: Validates access before showing request details
3. ✅ **UI Check**: Additional validation in React component

## Edge Cases Handled

1. **Direct URL Access**: Hospital Admin cannot access other hospital's request via direct URL
2. **API Bypass**: Backend validation prevents API-level bypass
3. **Role Code vs UUID**: Validates both role codes and UUIDs
4. **Concurrent Approvals**: Database constraints prevent race conditions
5. **Failed Operations**: Rollback mechanisms in place

## Testing Recommendations

1. ✅ Test Hospital Admin approving their own hospital's request
2. ✅ Test Hospital Admin trying to approve other hospital's request (should fail)
3. ✅ Test System Admin approving any hospital's request (should succeed)
4. ✅ Test assigning admin role during approval (should fail)
5. ✅ Test duplicate IC number in different hospital (should fail)
6. ✅ Test direct URL access to other hospital's request (should redirect)

## Files Modified

1. `src/services/accessRequestManagementService.ts`
   - Added `getCurrentUserInfo()` helper
   - Added `validateHospitalAccess()` helper
   - Added `validateRoleAssignment()` helper
   - Updated `approveAccessRequest()` with validations
   - Updated `rejectAccessRequest()` with validations
   - Updated `getAccessRequestById()` with optional validation

2. `src/pages/admin/accessRequests/AccessRequestDetailPage.tsx`
   - Added UI-level hospital validation
   - Added SYSTEM_ROLES import
   - Enhanced error handling

## Security Checklist

- [x] Hospital Admin cannot approve other hospitals' requests
- [x] Hospital Admin cannot reject other hospitals' requests
- [x] Hospital Admin cannot view other hospitals' requests
- [x] Admin roles cannot be assigned through access request approval
- [x] Duplicate IC numbers prevented across different hospitals
- [x] Backend validation (service layer)
- [x] UI-level validation (React components)
- [x] Database-level RLS policies
- [x] Error messages are user-friendly but don't leak sensitive info
- [x] Rollback mechanisms for failed operations

## Notes

- RLS policies provide defense-in-depth but application-level validation is primary
- All validations are logged for audit purposes
- Error messages are generic to prevent information leakage
- System Admin has full access (by design)

