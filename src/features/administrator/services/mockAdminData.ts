import { SystemOverview, DepartmentStatus, UserAccount, AuditLogEntry, SystemAlert, DatabaseStats, PerformanceMetric, BackupStatus, SystemConfiguration, LicenseInfo, IntegrationStatus } from '../types/Administrator';

export const getSystemOverview = (): SystemOverview => ({
    totalDepartments: 12,
    activeUsers: 150,
    totalPatients: 5000,
    totalPrescriptions: 12000,
    systemUptime: '99.99%',
    lastBackup: '2024-01-19 02:00',
    storageUsed: 450,
    storageTotal: 1000,
});

export const getDepartmentStatuses = (): DepartmentStatus[] => [
    {
        id: '1',
        name: 'Pharmacy',
        status: 'active',
        activeUsers: 25,
        todayTransactions: 150,
        lastActivity: new Date().toISOString(),
        alerts: 0,
        performance: 98,
    }
];

export const getUserAccounts = (): UserAccount[] => [
    {
        id: '1',
        username: 'admin',
        name: 'System Admin',
        email: 'admin@hospital.com',
        department: 'IT',
        role: 'Administrator',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: '2023-01-01',
        permissions: ['all'],
    }
];

export const getAuditLogs = (): AuditLogEntry[] => [];
export const getSystemAlerts = (): SystemAlert[] => [];
export const getDatabaseStats = (): DatabaseStats[] => [
    {
        tableName: 'users',
        recordCount: 155,
        sizeGB: 0.5,
        lastModified: new Date().toISOString(),
        indexCount: 3
    }
];
export const getPerformanceMetrics = (): PerformanceMetric[] => [
    {
        timestamp: new Date().toISOString(),
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 45,
        networkIn: 100,
        networkOut: 100,
        activeConnections: 50,
        requestsPerSecond: 200
    }
];
export const getBackupHistory = (): BackupStatus[] => [];
export const getSystemConfiguration = (): SystemConfiguration[] => [
    {
        category: 'General',
        settings: [
            {
                key: 'system_name',
                value: 'H.O.M.E',
                description: 'System Name',
                type: 'string'
            }
        ]
    }
];
export const getLicenseInfo = (): LicenseInfo[] => [];
export const getIntegrationStatus = (): IntegrationStatus[] => [];
