# 🎫 Access Token Management - Security Guide

## Overview

The **Access Token Management** system provides enterprise-grade security for accessing sensitive patient data. This token-based authentication system limits who can access what data, tracks all access attempts, and automatically blocks unauthorized access.

---

## 🔐 Key Security Features

### 1. Token-Based Access Control
- Temporary access tokens with expiration dates
- Usage limits (maximum number of uses per token)
- Specific resource access (patient records, prescriptions, lab results, etc.)
- Access level control (view, edit, export, delete)

### 2. Unauthorized Access Monitoring
- Real-time detection of unauthorized attempts
- Automatic blocking of suspicious activity
- Severity classification (low, medium, high, critical)
- Complete audit trail with IP addresses

### 3. Usage Tracking
- Every token use is logged
- Success/failure tracking
- Device and IP information
- Error message capture

### 4. Access Control Rules
- Role-based access control
- Daily access limits
- Department restrictions
- Automatic enforcement

---

## 📊 Access the Feature

1. Login to Administrator dashboard
2. Click on **"Access Tokens"** tab (🎫 icon)
3. View comprehensive security dashboard

---

## 🎯 Common Use Cases

### Use Case 1: Research Access
```
Scenario: Doctor needs access to historical patient data for research

Solution:
1. Create token with:
   - Resource: Patient Records
   - Access Level: View only
   - Usage Limit: 100 uses
   - Expiration: 30 days
   - Purpose: "Research Study XYZ"

2. Token is automatically tracked
3. Access revoked after 100 uses or 30 days
4. All access attempts logged
```

### Use Case 2: Audit Compliance
```
Scenario: External auditor needs temporary access

Solution:
1. Create token with:
   - Resource: Full Access
   - Access Level: View + Export
   - Usage Limit: 50 uses
   - Expiration: 7 days
   - IP Whitelist: Auditor's office IP
   - Purpose: "Annual Compliance Audit"

2. Access limited to specific IP address
3. Automatic expiration after 7 days
4. Complete audit trail available
```

### Use Case 3: Emergency Override
```
Scenario: Emergency doctor needs immediate access

Solution:
1. Create emergency token with:
   - Resource: Full Access
   - Access Level: View + Edit
   - Usage Limit: 20 uses
   - Expiration: 24 hours
   - Purpose: "Emergency Response"

2. Fast access enabled
3. Short expiration for security
4. All access tracked
```

### Use Case 4: Third-Party Integration
```
Scenario: Laboratory system needs prescription data

Solution:
1. Create system token with:
   - Resource: Prescriptions + Lab Results
   - Access Level: View
   - Usage Limit: 1000 uses
   - Expiration: 365 days
   - IP Whitelist: Lab system IP
   - Purpose: "Lab System Integration"

2. Long-term token for automation
3. IP restricted to lab system
4. Usage monitored continuously
```

---

## 🔍 Token Lifecycle

### Step 1: Token Creation
```
Administrator creates token with:
✓ User/System identification
✓ Resource type selection
✓ Access level permission
✓ Usage limit
✓ Expiration date
✓ Optional IP whitelist
✓ Purpose documentation
```

### Step 2: Token Active Period
```
During token validity:
✓ Every use is logged
✓ Usage count incremented
✓ IP address verified (if whitelist active)
✓ Access level enforced
✓ Expiration date checked
```

### Step 3: Token Expiration/Revocation
```
Token becomes inactive when:
❌ Expiration date reached
❌ Usage limit exceeded
❌ Manually revoked by administrator
❌ User account suspended
❌ Emergency security lockdown
```

---

## 🚨 Unauthorized Access Detection

### What Triggers an Alert?

1. **Invalid Token** (HIGH risk)
   - Token code doesn't exist
   - Token has been revoked

2. **Expired Token** (MEDIUM risk)
   - Token expiration date passed
   - Automatic rejection

3. **Exceeded Usage** (MEDIUM risk)
   - Usage limit reached
   - No more accesses allowed

4. **Insufficient Permission** (MEDIUM risk)
   - User tries action beyond access level
   - e.g., trying to delete with view-only token

5. **IP Blocked** (HIGH risk)
   - Access from non-whitelisted IP
   - Potential security breach

6. **No Token** (CRITICAL risk)
   - Attempt to access without any token
   - Direct unauthorized access attempt

### Automatic Response

```
When unauthorized access detected:
1. Access immediately blocked
2. Alert generated with severity level
3. Attempt logged with full details
4. Administrator notified
5. User may be temporarily locked out
```

---

## 📈 Statistics & Monitoring

### Dashboard Metrics

**Active Tokens**
- Total active tokens
- Expired tokens count
- Revoked tokens count

**24-Hour Usage**
- Total token uses
- Success rate
- Failed attempts

**Unauthorized Attempts**
- Total attempts blocked
- High-risk attempts count
- By severity breakdown

**Resource Access**
- Most accessed resource type
- Access patterns
- Peak usage times

---

## 🛠️ Token Management Actions

### Create New Token
```
1. Click "+ Create New Token" button
2. Fill in token details:
   - Select user/system
   - Choose resource type
   - Set access level
   - Define usage limit
   - Set expiration date
   - Add IP whitelist (optional)
   - Document purpose
3. Save token
4. Share token code securely
```

### View Token Details
```
1. Find token in list
2. Click "View" button
3. See complete information:
   - Token code
   - Usage statistics
   - Access history
   - Remaining uses
   - Expiration date
```

### Revoke Token
```
1. Find token in list
2. Click "Revoke" button
3. Confirm revocation
4. Token immediately deactivated
5. All future uses blocked
```

### Filter Tokens
```
Use filter buttons to view:
- All tokens
- Active tokens only
- Expired tokens only
- Revoked tokens only
```

---

## 📋 Access Control Rules

### Default Rules Included

1. **Patient Records - Doctor Access**
   - Resource: Patient Records
   - Required Role: Doctor, Specialist, Consultant
   - Max Daily Access: 100
   - Departments: Emergency, General Ward, Pediatric, Maternity

2. **Prescription Access - Pharmacist**
   - Resource: Prescriptions
   - Required Role: Pharmacist, Pharmacy Technician
   - Max Daily Access: 200
   - Departments: Pharmacy Counter, Logistics, Sub Store

3. **Lab Results - Laboratory Staff**
   - Resource: Lab Results
   - Required Role: Lab Technician, Pathologist
   - Max Daily Access: 150
   - Departments: Laboratory

4. **Billing Access - Finance Department**
   - Resource: Billing
   - Required Role: Accountant, Finance Officer
   - Max Daily Access: 50
   - Departments: Office Admin

5. **Full Access - Emergency Override**
   - Resource: Full Access
   - Required Role: Emergency Doctor, Consultant
   - Max Daily Access: 20
   - Departments: Emergency & Trauma

---

## 🔒 Security Best Practices

### DO ✅

1. **Set Appropriate Expiration Dates**
   - Short-term access: 1-7 days
   - Research access: 30-90 days
   - System integration: 365 days max

2. **Use Strict Usage Limits**
   - Emergency: 10-20 uses
   - Audit: 50-100 uses
   - Research: 100-500 uses
   - System: 1000+ uses

3. **Implement IP Whitelisting**
   - For external auditors
   - For third-party systems
   - For high-security access

4. **Document Token Purpose**
   - Clear reason for access
   - Reference numbers
   - Approval documentation

5. **Review Tokens Regularly**
   - Weekly review of active tokens
   - Monthly cleanup of expired tokens
   - Quarterly access pattern analysis

6. **Monitor Unauthorized Attempts**
   - Daily review of attempts
   - Immediate investigation of high-risk attempts
   - Follow up on repeated failures

### DON'T ❌

1. **Never Create Unlimited Tokens**
   - Always set usage limits
   - Always set expiration dates

2. **Don't Share Token Codes**
   - Each user gets their own token
   - No token sharing between users

3. **Don't Ignore Unauthorized Attempts**
   - Every attempt is a security event
   - Investigate all high-risk attempts

4. **Don't Create Over-Privileged Tokens**
   - Grant minimum necessary access
   - Use view-only when possible

5. **Don't Keep Expired Tokens Active**
   - Review and revoke regularly
   - Clean up old tokens

---

## 📊 Mock Data Included

The system includes comprehensive mock data for testing:

- **50 Access Tokens** (active, expired, revoked)
- **200 Usage Logs** (success and failures)
- **75 Unauthorized Attempts** (various severity levels)
- **5 Access Control Rules** (pre-configured)
- **Real-time Statistics** (automatically calculated)

---

## 🎯 Quick Reference

### Token Status Indicators

- 🟢 **Active** - Token is valid and usable
- 🟡 **Expired** - Token expiration date passed
- 🔴 **Revoked** - Manually revoked by administrator
- 🟠 **Suspended** - Temporarily disabled

### Severity Levels

- 🟢 **Low** - Minor issue, logged only
- 🟡 **Medium** - Suspicious activity, monitoring required
- 🟠 **High** - Potential security threat, immediate review
- 🔴 **Critical** - Active security breach, immediate action

### Access Levels

- 👁️ **View** - Read-only access
- ✏️ **Edit** - Read and modify
- 📤 **Export** - View and download
- 🗑️ **Delete** - Full control (highest risk)

### Resource Types

- 📋 **Patient Records** - Complete patient information
- 💊 **Prescriptions** - Medication orders
- 🧪 **Lab Results** - Laboratory test results
- 📖 **Medical History** - Historical patient data
- 💰 **Billing** - Financial information
- 🔓 **Full Access** - All resources (emergency only)

---

## 📞 Support

For questions about Access Token Management:
- Review this guide
- Check Administrator Guide (ADMINISTRATOR_GUIDE.md)
- Contact IT Security Team
- Email: security@hospital.gov.my

---

## ⚠️ Important Notes

1. **Tokens are Powerful** - They grant access to sensitive patient data
2. **Usage is Monitored** - Every token use is logged and auditable
3. **Security is Automatic** - System enforces all limits and rules
4. **Compliance Ready** - Complete audit trail for regulatory requirements
5. **Real-time Protection** - Unauthorized access blocked immediately

---

**© 2025 HOME - Hospital Operation & Management Ecosystem**  
**Version**: 1.2.0  
**Last Updated**: January 13, 2025  
**Classification**: INTERNAL USE ONLY


