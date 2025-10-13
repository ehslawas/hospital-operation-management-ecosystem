# Administrator Department Guide

## 🛡️ Overview

The **ADMINISTRATOR** department is the backbone control center for the entire Hospital Operation & Management Ecosystem (HOME). This is a high-privilege, single-user interface designed to provide comprehensive oversight and control over all hospital departments, users, systems, and operations.

## 🔐 Access Control

### Login Credentials
- **Department**: Administrator
- **User ID**: `hosplawas` (super admin account)
- **Password**: `lawas2025`
- **Access Level**: Super Admin (Full System Access)

### Security Features
- Only ONE user ID (`hosplawas`) has access to this interface
- Requires super admin privileges
- All actions are logged in the audit trail
- Session timeout: 30 minutes (configurable)
- Two-factor authentication support
- Credentials can be changed via Super Admin Management tab

### Important Security Notes
⚠️ **Succession Planning**: When administrators transfer or retire, use the Super Admin Management tab to update credentials and maintain security.

⚠️ **Strong Password Recommended**: For production environments, consider changing to a stronger password through the Super Admin Management interface.

## ✨ Core Features

**Total Tabs: 12 Comprehensive Control Interfaces**

### 1. System Overview Dashboard
The main dashboard provides a bird's-eye view of the entire hospital system:

### 11. Access Token Management (NEW! 🎫)
Token-based access control for sensitive patient data with comprehensive monitoring:

**Features:**
- **Token Statistics**
  - Active tokens count
  - 24-hour usage metrics
  - Unauthorized attempt tracking
  - Most accessed resources

- **Token Creation & Management**
  - Create access tokens for specific users
  - Set resource type (patient records, prescriptions, lab results, etc.)
  - Define access level (view, edit, export, delete)
  - Usage limits (maximum number of uses)
  - Expiration dates
  - IP whitelist restrictions

- **Active Tokens Monitoring**
  - View all active, expired, and revoked tokens
  - Search and filter by token code, user, or purpose
  - Real-time usage tracking with progress bars
  - Token status indicators
  - Quick revoke functionality

- **Unauthorized Access Detection**
  - Track all unauthorized access attempts
  - Severity classification (low, medium, high, critical)
  - Reason tracking (invalid token, expired, exceeded usage, etc.)
  - IP address logging
  - Automatic blocking

- **Token Usage Logs**
  - Complete audit trail of all token uses
  - Success/failure tracking
  - Resource access history
  - IP and device information
  - Error message logging

- **Access Control Rules**
  - Define role-based access rules
  - Set daily access limits
  - Configure department restrictions
  - Resource-specific permissions
  - Token requirement enforcement

**Use Cases:**
- Research access to historical patient data
- Temporary audit access for compliance
- Emergency override tokens
- Third-party system integrations
- Quality improvement studies

**Security Features:**
- Automatic token expiration
- Usage limit enforcement
- IP address whitelisting
- Real-time unauthorized attempt blocking
- Comprehensive audit trail
- Role-based access control

### 12. Super Admin Management 🔐
High-security credential management interface for administrator succession planning:

**Features:**
- **Current Admin Info Display**
  - Current admin ID: `admin_malaysia_2025`
  - Department assignment
  - Access level (Super Admin - Full Control)
  - Last password change date
  - Current login status

- **Change Credentials Form**
  - Verify current password
  - Set new admin ID
  - Create new secure password
  - Password confirmation
  - Show/hide password toggle
  - Validation and security checks

- **Security Guidelines**
  - 🔒 Strong password requirements
  - 🔄 Regular update recommendations (every 90 days)
  - 👥 Limited access policy
  - 📝 Change documentation procedures
  - 🚫 No sharing policy
  - 🔍 Audit trail compliance

- **Recent Security Events**
  - Login history
  - Password changes
  - Session information
  - IP address tracking

**Use Cases:**
- Administrator transfers to different facility
- Personnel retirement
- Security breach response
- Regular password rotation
- Access handover during shift changes

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No spaces allowed in admin ID

- **System Statistics**
  - Total departments: 12
  - Active users: Real-time count
  - Total patients: 125,000+
  - Total prescriptions: 89,000+
  - System uptime: 99.97%
  - Storage metrics
  - Backup status

- **Quick Insights**
  - Recent system alerts
  - Department health status
  - Active licenses
  - Performance metrics

### 2. Department Management
Comprehensive control over all 12 hospital departments:

**Departments Monitored:**
- Pharmacy Logistic
- Pharmacy Sub Store
- Pharmacy Counter
- Emergency & Trauma
- General Ward
- Laboratory
- Radiology
- Haemodialysis
- Paediatric Ward
- Maternity Ward
- Front Desk
- Office Admin

**For Each Department:**
- Real-time status (Active, Idle, Maintenance, Offline)
- Active user count
- Today's transaction volume
- Performance metrics (percentage)
- Alert notifications
- Last activity timestamp
- Quick access controls

### 3. User Management
Complete user account administration:

**Features:**
- View all 150+ user accounts
- Search and filter by name, username, email
- User details:
  - Username and full name
  - Email address
  - Department assignment
  - Role (pharmacist, technician, doctor, nurse, admin, clerk)
  - Status (active, inactive, suspended)
  - Last login time
  - Account creation date
  - Permissions list

**Actions:**
- Add new users
- Edit user details
- Suspend/Activate accounts
- Reset passwords
- Manage permissions
- View user activity history

### 4. Audit Logs
Comprehensive activity tracking across the entire system:

**Log Information:**
- 500+ recent log entries
- User identification
- Action type (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT)
- Entity affected (Prescription, Patient, Medication, User, etc.)
- Department location
- IP address
- Timestamp
- Severity level (info, warning, critical)

**Filtering Options:**
- Search by user name or action
- Filter by department
- Filter by action type
- Sort by timestamp

### 5. System Alerts
Real-time monitoring and alert management:

**Alert Types:**
- 🔒 Security alerts (failed logins, unauthorized access)
- ⚡ Performance alerts (high CPU, memory issues)
- 🔧 Maintenance alerts (scheduled updates)
- 💿 Backup alerts (failures, completions)
- ❌ Error alerts (system failures, connection issues)

**Severity Levels:**
- 🔴 Critical (requires immediate action)
- 🟠 High (attention needed)
- 🟡 Medium (monitor closely)
- 🟢 Low (informational)

**Alert Actions:**
- Acknowledge alerts
- Resolve alerts
- Add resolution notes
- View alert history

### 6. Database Management
Monitor and manage database health:

**Database Tables Monitored:**
- patients (125,487 records, 45.7 GB)
- prescriptions (89,234 records, 34.2 GB)
- medications (12,458 records, 8.9 GB)
- users (847 records, 0.8 GB)
- appointments (45,782 records, 12.3 GB)
- audit_logs (2,458,923 records, 178.4 GB)

**For Each Table:**
- Record count
- Storage size (GB)
- Last modification time
- Index count

**Actions:**
- Optimize database
- Run backup
- View table details
- Monitor performance

### 7. Performance Monitoring
Real-time system performance metrics (24-hour view):

**Metrics Tracked:**
- CPU usage (average and current)
- Memory usage
- Disk usage
- Network traffic (inbound/outbound)
- Active database connections
- Requests per second
- Response times

**Visual Indicators:**
- Real-time charts
- Historical data (24 hours)
- Performance trends
- Resource utilization

### 8. Backup Management
Control and monitor system backups:

**Backup Types:**
- Full backups (complete database)
- Incremental backups (changes only)
- Differential backups (since last full)

**Backup Information:**
- Backup status (completed, failed, in-progress)
- Timestamp
- Size (GB)
- Duration
- Storage location (S3 buckets)
- Error messages (if failed)

**Actions:**
- Run backup now
- Schedule backups
- Restore from backup
- View backup history
- Configure backup settings

### 9. System Configuration
Manage system-wide settings:

**Configuration Categories:**

**A. Security Settings**
- Session timeout (minutes)
- Password policy (weak, medium, strong)
- Two-factor authentication (enable/disable)
- Maximum login attempts

**B. Performance Settings**
- Application caching (enable/disable)
- Cache time-to-live (seconds)
- Maximum concurrent users

**C. Backup Settings**
- Automatic backups (enable/disable)
- Backup frequency (hourly, daily, weekly)
- Backup retention period (days)

**Actions:**
- Modify settings
- Save changes
- Reset to defaults
- Export configuration

### 10. Integration Management
Monitor and manage external system integrations:

**Integrations Tracked:**
1. **National Health Database** (API)
   - Status: Connected
   - Endpoint: https://api.health.gov.my/v1
   - Response time: 145ms

2. **Laboratory Information System** (Service)
   - Status: Connected
   - Response time: 67ms

3. **Pharmacy Inventory System** (Database)
   - Status: Connected
   - Response time: 23ms

4. **Billing System** (External API)
   - Status: Error (requires attention)

5. **Patient Portal** (API)
   - Status: Maintenance

**For Each Integration:**
- Integration name
- Type (API, Database, Service, External)
- Connection status
- Last sync time
- Response time (milliseconds)
- Endpoint URL
- Error messages

**Actions:**
- Test connection
- Configure integration
- View sync history
- Enable/disable integration

## 📊 Data & Analytics

### Mock Data Included
The Administrator dashboard includes comprehensive mock data for testing and demonstration:

- 150 user accounts across all departments
- 500 audit log entries
- 5 system alerts (various severity levels)
- 6 database table statistics
- 24 hours of performance metrics
- 4 backup history entries
- Multiple configuration settings
- 5 integration status records
- 12 department status entries

### Real-Time Updates
- Department statuses update in real-time
- Performance metrics refresh automatically
- Alert notifications appear instantly
- Audit logs are continuously recorded

## 🎨 User Interface Features

### Design Elements
- **Modern Gradient Backgrounds**: Professional blue-to-indigo gradients
- **Glassmorphism Effects**: Frosted glass appearance with backdrop blur
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Interactive Animations**: Smooth transitions and hover effects
- **Status Indicators**: Color-coded badges and icons
- **Professional Typography**: Clear, readable fonts
- **Shadow Effects**: Depth and layering for visual hierarchy

### Navigation
- **Tab-based Navigation**: Easy switching between sections
- **Search Functionality**: Quick find across users and logs
- **Filtering Options**: Department-specific filtering
- **Breadcrumb Navigation**: Clear path indication
- **Quick Actions**: One-click access to common tasks

### Visual Indicators
- 🟢 Green: Active, healthy, completed
- 🟡 Yellow: Idle, warning, pending
- 🔵 Blue: Maintenance, in-progress
- 🔴 Red: Offline, error, critical

## 🔧 Technical Implementation

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: React Hooks (useState, useMemo)

### File Structure
```
src/
├── features/
│   └── administrator/
│       ├── types/
│       │   └── Administrator.ts          # TypeScript interfaces
│       ├── services/
│       │   └── mockAdminData.ts          # Mock data generators
│       └── routes/
│           └── AdministratorDashboard.tsx # Main dashboard component
├── app/
│   └── administrator/
│       └── page.tsx                       # Page route
└── lib/
    └── department.ts                      # Department routing

prisma/
└── schema.prisma                          # Database schema with admin models
```

### Database Models Added
- `SystemAlert`: System-wide alerts and notifications
- `DepartmentStatus`: Real-time department health tracking
- `BackupHistory`: Backup operation logs
- `SystemConfiguration`: System settings storage
- `IntegrationStatus`: External system integration monitoring
- `PerformanceMetric`: System performance data
- `LicenseInfo`: License and subscription management

## 🚀 Getting Started

### 1. Login
1. Navigate to `/login` (or `http://localhost:3001/login`)
2. Enter credentials:
   - Employee ID: `hosplawas`
   - Password: `lawas2025`
   - Department: `🛡️ Administrator (System Control)`
3. Click "Sign In"
4. You will be redirected to `/administrator` dashboard

### 2. Initial Setup (First Time)
1. **IMPORTANT**: Navigate to Super Admin tab (🔐) and change default credentials
2. Review system overview
3. Check all department statuses
4. **NEW**: Set up Access Control Rules in Access Tokens tab
5. Verify integration connections
6. Review system alerts
7. Configure backup settings
8. Set up security policies
9. Document new credentials securely

### 3. Daily Operations
- Monitor department health
- Review new alerts
- **NEW**: Check unauthorized access attempts in Access Tokens tab
- Check audit logs for anomalies
- **NEW**: Review token usage and revoke suspicious tokens
- Verify backup completions
- Monitor system performance
- Manage user accounts as needed

## 📈 Best Practices

### Security
- **CRITICAL**: Change default password immediately in production via Super Admin tab
- **NEW**: Set up Access Control Rules for sensitive patient data
- **NEW**: Monitor unauthorized access attempts daily
- Enable two-factor authentication
- Review audit logs daily
- **NEW**: Review and revoke expired or suspicious tokens
- Monitor failed login attempts
- Regularly update user permissions
- Change super admin credentials every 90 days
- **NEW**: Implement token-based access for third-party integrations
- Use Super Admin Management tab for personnel transitions
- Document all credential changes in secure location
- Never share credentials via unsecured channels

### Performance
- Monitor CPU and memory usage trends
- Optimize database tables monthly
- Clean up old audit logs (90+ days)
- Review slow queries
- Monitor integration response times

### Backups
- Verify daily backup completions
- Test restore procedures monthly
- Maintain 30 days of backup history
- Store backups in multiple locations
- Document backup procedures

### User Management
- Regular user access reviews (quarterly)
- Deactivate unused accounts
- Follow principle of least privilege
- Document role changes
- Audit permission escalations

## 🔍 Troubleshooting

### Common Issues

**1. Cannot Login**
- Verify credentials: `hosplawas` / `lawas2025`
- Check department selection: `🛡️ Administrator (System Control)`
- Clear browser cookies/cache
- Check session timeout settings
- If credentials were changed, use the NEW credentials from Super Admin Management tab

**2. Alerts Not Clearing**
- Use "Acknowledge" or "Resolve" buttons
- Check user permissions
- Verify database connectivity

**3. Performance Issues**
- Check system performance tab
- Review resource utilization
- Optimize database if needed
- Clear cache

**4. Integration Failures**
- Test connection from Integration tab
- Verify endpoint URLs
- Check network connectivity
- Review error messages

## 📞 Support

For technical support or questions:
- Contact System Administrator: `admin@hospital.gov.my`
- Emergency Hotline: Contact IT Department
- Documentation: `/docs/administrator`

## 🎯 Future Enhancements

Planned features:
- [x] Super Admin Management interface (✅ Completed)
- [x] Credential change functionality (✅ Completed)
- [x] Security guidelines and best practices (✅ Completed)
- [ ] Advanced analytics dashboard
- [ ] Custom report generation
- [ ] Email alert notifications
- [ ] Mobile app access
- [ ] Multi-language support
- [ ] Advanced role-based access control
- [ ] Automated system health reports
- [ ] Integration with external monitoring tools
- [ ] Two-factor authentication implementation
- [ ] Biometric authentication support

## 📝 Version History

### v1.2.0 (Current) - January 13, 2025
- ✅ **NEW**: Access Token Management tab (🎫)
- ✅ **NEW**: Token-based access control for sensitive patient data
- ✅ **NEW**: Unauthorized access attempt monitoring
- ✅ **NEW**: Token usage tracking and audit logs
- ✅ **NEW**: Access control rules configuration
- ✅ **NEW**: Real-time security monitoring
- ✅ **SECURITY**: Comprehensive token lifecycle management
- ✅ **SECURITY**: IP whitelisting support
- ✅ **SECURITY**: Usage limit enforcement
- ✅ Now 12 comprehensive control tabs

### v1.1.0 - January 13, 2025
- ✅ **NEW**: Super Admin Management tab
- ✅ **NEW**: Credential change functionality
- ✅ **NEW**: Security guidelines interface
- ✅ **NEW**: Recent security events tracking
- ✅ **SECURITY**: Updated login credentials for enhanced security
- ✅ **SECURITY**: Stronger password requirements (12+ characters)
- ✅ Succession planning support for administrator transitions

### v1.0.0 - Initial Release
- Initial release
- Core administrator dashboard (10 tabs)
- Department management
- User management
- Audit logging
- System alerts
- Database monitoring
- Performance metrics
- Backup management
- System configuration
- Integration monitoring

---

**© 2025 HOME - Hospital Operation & Management Ecosystem**  
**For Official Use in Malaysian Government Hospitals**

