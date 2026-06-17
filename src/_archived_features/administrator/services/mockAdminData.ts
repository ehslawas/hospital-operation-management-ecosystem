import type {
  SystemOverview,
  DepartmentStatus,
  UserAccount,
  AuditLogEntry,
  SystemAlert,
  DatabaseStats,
  PerformanceMetric,
  BackupStatus,
  SystemConfiguration,
  LicenseInfo,
  IntegrationStatus,
} from '../types/Administrator';

// ============================================
// SYSTEM OVERVIEW
// ============================================

export function getSystemOverview(): SystemOverview {
  return {
    totalDepartments: 12,
    activeUsers: 847,
    totalPatients: 125_487,
    totalPrescriptions: 89_234,
    systemUptime: '99.97%',
    lastBackup: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    storageUsed: 2847,
    storageTotal: 5000,
  };
}

// ============================================
// DEPARTMENT STATUS
// ============================================

export function getDepartmentStatuses(): DepartmentStatus[] {
  const departments = [
    { name: 'Pharmacy Logistic', baseUsers: 45, baseTxn: 234 },
    { name: 'Pharmacy Sub Store', baseUsers: 28, baseTxn: 156 },
    { name: 'Pharmacy Counter', baseUsers: 52, baseTxn: 789 },
    { name: 'Emergency & Trauma', baseUsers: 38, baseTxn: 145 },
    { name: 'General Ward', baseUsers: 67, baseTxn: 298 },
    { name: 'Laboratory', baseUsers: 34, baseTxn: 467 },
    { name: 'Radiology', baseUsers: 29, baseTxn: 234 },
    { name: 'Haemodialysis', baseUsers: 18, baseTxn: 87 },
    { name: 'Paediatric Ward', baseUsers: 24, baseTxn: 134 },
    { name: 'Maternity Ward', baseUsers: 31, baseTxn: 189 },
    { name: 'Front Desk', baseUsers: 41, baseTxn: 567 },
    { name: 'Office Admin', baseUsers: 15, baseTxn: 45 },
  ];

  const statuses: ('active' | 'idle' | 'maintenance' | 'offline')[] = ['active', 'active', 'active', 'idle', 'maintenance'];

  return departments.map((dept, idx) => ({
    id: `dept-${idx + 1}`,
    name: dept.name,
    status: idx === 7 ? 'maintenance' : idx === 11 ? 'idle' : 'active',
    activeUsers: dept.baseUsers + Math.floor(Math.random() * 10),
    todayTransactions: dept.baseTxn + Math.floor(Math.random() * 50),
    lastActivity: new Date(Date.now() - Math.random() * 1000 * 60 * 30).toISOString(),
    alerts: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
    performance: 75 + Math.floor(Math.random() * 25),
  }));
}

// ============================================
// USER ACCOUNTS
// ============================================

export function getUserAccounts(): UserAccount[] {
  const users: UserAccount[] = [];
  const departments = [
    'Pharmacy Logistic',
    'Pharmacy Counter',
    'Emergency & Trauma',
    'General Ward',
    'Laboratory',
    'Radiology',
    'Front Desk',
  ];
  const roles = ['pharmacist', 'technician', 'doctor', 'nurse', 'admin', 'clerk'];
  const statuses: ('active' | 'inactive' | 'suspended')[] = ['active', 'active', 'active', 'active', 'inactive'];

  for (let i = 1; i <= 150; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const status = i % 20 === 0 ? 'suspended' : i % 10 === 0 ? 'inactive' : 'active';

    users.push({
      id: `user-${i}`,
      username: `user${String(i).padStart(4, '0')}`,
      name: `Staff Member ${i}`,
      email: `user${i}@hospital.gov.my`,
      department: dept,
      role: role,
      status: status,
      lastLogin: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString(),
      permissions: role === 'admin' ? ['view', 'create', 'edit', 'delete', 'export'] : ['view', 'create'],
    });
  }

  return users;
}

// ============================================
// AUDIT LOGS
// ============================================

export function getAuditLogs(): AuditLogEntry[] {
  const logs: AuditLogEntry[] = [];
  const actions: ('CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT')[] = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'VIEW',
    'LOGIN',
    'LOGOUT',
    'EXPORT',
  ];
  const entities = ['Prescription', 'Patient', 'Medication', 'User', 'Appointment', 'Report'];
  const departments = ['Pharmacy Counter', 'Emergency & Trauma', 'General Ward', 'Laboratory'];

  for (let i = 1; i <= 500; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entity = entities[Math.floor(Math.random() * entities.length)];
    const severity = action === 'DELETE' ? 'critical' : action === 'UPDATE' ? 'warning' : 'info';

    logs.push({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
      userId: `user-${Math.floor(Math.random() * 100) + 1}`,
      userName: `Staff Member ${Math.floor(Math.random() * 100) + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      action: action,
      entity: entity,
      entityId: `${entity.toLowerCase()}-${Math.floor(Math.random() * 10000)}`,
      description: `${action} ${entity} record`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      severity: severity as 'info' | 'warning' | 'critical',
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ============================================
// SYSTEM ALERTS
// ============================================

export function getSystemAlerts(): SystemAlert[] {
  return [
    {
      id: 'alert-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'security',
      severity: 'high',
      department: 'Pharmacy Counter',
      title: 'Multiple Failed Login Attempts',
      message: 'User account user0045 has 5 failed login attempts in the last 10 minutes',
      status: 'new',
    },
    {
      id: 'alert-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      type: 'performance',
      severity: 'medium',
      department: 'Laboratory',
      title: 'High CPU Usage Detected',
      message: 'Laboratory module experiencing 87% CPU usage for extended period',
      status: 'acknowledged',
    },
    {
      id: 'alert-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      type: 'maintenance',
      severity: 'low',
      title: 'Scheduled Maintenance Due',
      message: 'Database maintenance window scheduled for tonight at 2:00 AM',
      status: 'acknowledged',
    },
    {
      id: 'alert-4',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      type: 'backup',
      severity: 'critical',
      title: 'Backup Failed',
      message: 'Automated backup process failed due to insufficient storage space',
      status: 'new',
    },
    {
      id: 'alert-5',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      type: 'error',
      severity: 'high',
      department: 'Emergency & Trauma',
      title: 'Database Connection Error',
      message: 'Emergency module experiencing intermittent database connection issues',
      status: 'resolved',
      resolvedBy: 'admin-001',
      resolvedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    },
  ];
}

// ============================================
// DATABASE STATS
// ============================================

export function getDatabaseStats(): DatabaseStats[] {
  return [
    { tableName: 'patients', recordCount: 125487, sizeGB: 45.7, lastModified: new Date(Date.now() - 1000 * 60 * 5).toISOString(), indexCount: 8 },
    { tableName: 'prescriptions', recordCount: 89234, sizeGB: 34.2, lastModified: new Date(Date.now() - 1000 * 60 * 2).toISOString(), indexCount: 12 },
    { tableName: 'medications', recordCount: 12458, sizeGB: 8.9, lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), indexCount: 6 },
    { tableName: 'users', recordCount: 847, sizeGB: 0.8, lastModified: new Date(Date.now() - 1000 * 60 * 30).toISOString(), indexCount: 4 },
    { tableName: 'appointments', recordCount: 45782, sizeGB: 12.3, lastModified: new Date(Date.now() - 1000 * 60 * 10).toISOString(), indexCount: 7 },
    { tableName: 'audit_logs', recordCount: 2458923, sizeGB: 178.4, lastModified: new Date(Date.now() - 1000 * 60).toISOString(), indexCount: 15 },
  ];
}

// ============================================
// PERFORMANCE METRICS
// ============================================

export function getPerformanceMetrics(): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];
  const now = Date.now();

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now - (23 - i) * 1000 * 60 * 60);
    metrics.push({
      timestamp: timestamp.toISOString(),
      cpuUsage: 40 + Math.random() * 40 + Math.sin(i / 24 * Math.PI * 2) * 15,
      memoryUsage: 50 + Math.random() * 30 + Math.sin(i / 24 * Math.PI * 2) * 10,
      diskUsage: 60 + Math.random() * 5,
      networkIn: 100 + Math.random() * 200 + Math.sin(i / 24 * Math.PI * 2) * 50,
      networkOut: 80 + Math.random() * 150 + Math.sin(i / 24 * Math.PI * 2) * 40,
      activeConnections: 50 + Math.floor(Math.random() * 100) + Math.floor(Math.sin(i / 24 * Math.PI * 2) * 30),
      requestsPerSecond: 100 + Math.floor(Math.random() * 200) + Math.floor(Math.sin(i / 24 * Math.PI * 2) * 50),
    });
  }

  return metrics;
}

// ============================================
// BACKUP STATUS
// ============================================

export function getBackupHistory(): BackupStatus[] {
  return [
    {
      id: 'backup-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      type: 'incremental',
      status: 'completed',
      sizeGB: 12.4,
      duration: '8m 34s',
      location: 's3://backups/2025-01-13/incremental',
    },
    {
      id: 'backup-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      type: 'full',
      status: 'completed',
      sizeGB: 284.7,
      duration: '1h 45m 12s',
      location: 's3://backups/2025-01-12/full',
    },
    {
      id: 'backup-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      type: 'incremental',
      status: 'completed',
      sizeGB: 15.8,
      duration: '10m 23s',
      location: 's3://backups/2025-01-11/incremental',
    },
    {
      id: 'backup-4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      type: 'differential',
      status: 'failed',
      sizeGB: 0,
      duration: '0s',
      location: 'N/A',
    },
  ];
}

// ============================================
// SYSTEM CONFIGURATION
// ============================================

export function getSystemConfiguration(): SystemConfiguration[] {
  return [
    {
      category: 'Security',
      settings: [
        { key: 'session_timeout', value: '30', description: 'Session timeout in minutes', type: 'number' },
        { key: 'password_policy', value: 'strong', description: 'Password strength requirement', type: 'select', options: ['weak', 'medium', 'strong'] },
        { key: 'two_factor_auth', value: 'true', description: 'Enable two-factor authentication', type: 'boolean' },
        { key: 'max_login_attempts', value: '5', description: 'Maximum failed login attempts', type: 'number' },
      ],
    },
    {
      category: 'Performance',
      settings: [
        { key: 'cache_enabled', value: 'true', description: 'Enable application caching', type: 'boolean' },
        { key: 'cache_ttl', value: '3600', description: 'Cache time-to-live in seconds', type: 'number' },
        { key: 'max_concurrent_users', value: '1000', description: 'Maximum concurrent users', type: 'number' },
      ],
    },
    {
      category: 'Backup',
      settings: [
        { key: 'auto_backup', value: 'true', description: 'Enable automatic backups', type: 'boolean' },
        { key: 'backup_frequency', value: 'daily', description: 'Backup frequency', type: 'select', options: ['hourly', 'daily', 'weekly'] },
        { key: 'backup_retention', value: '30', description: 'Backup retention in days', type: 'number' },
      ],
    },
  ];
}

// ============================================
// LICENSE INFO
// ============================================

export function getLicenseInfo(): LicenseInfo[] {
  return [
    { feature: 'Core Hospital Management', status: 'active', expiryDate: '2026-12-31', usersAllowed: 1000, usersActive: 847, type: 'enterprise' },
    { feature: 'Advanced Analytics', status: 'active', expiryDate: '2025-06-30', usersAllowed: 100, usersActive: 45, type: 'professional' },
    { feature: 'AI-Powered Diagnostics', status: 'trial', expiryDate: '2025-03-15', usersAllowed: 50, usersActive: 12, type: 'professional' },
    { feature: 'Mobile Access', status: 'active', expiryDate: '2026-12-31', usersAllowed: 500, usersActive: 234, type: 'essential' },
  ];
}

// ============================================
// INTEGRATION STATUS
// ============================================

export function getIntegrationStatus(): IntegrationStatus[] {
  return [
    { id: 'int-1', name: 'National Health Database', type: 'api', status: 'connected', lastSync: new Date(Date.now() - 1000 * 60 * 5).toISOString(), endpoint: 'https://api.health.gov.my/v1', responseTime: 145 },
    { id: 'int-2', name: 'Laboratory Information System', type: 'service', status: 'connected', lastSync: new Date(Date.now() - 1000 * 60 * 2).toISOString(), endpoint: 'https://lis.hospital.local/api', responseTime: 67 },
    { id: 'int-3', name: 'Pharmacy Inventory System', type: 'database', status: 'connected', lastSync: new Date(Date.now() - 1000 * 60).toISOString(), endpoint: 'postgresql://pharmacy-db:5432', responseTime: 23 },
    { id: 'int-4', name: 'Billing System', type: 'external', status: 'error', lastSync: new Date(Date.now() - 1000 * 60 * 120).toISOString(), endpoint: 'https://billing.external.com/api', responseTime: 0 },
    { id: 'int-5', name: 'Patient Portal', type: 'api', status: 'maintenance', lastSync: new Date(Date.now() - 1000 * 60 * 60).toISOString(), endpoint: 'https://patient-portal.hospital.gov.my', responseTime: 0 },
  ];
}


