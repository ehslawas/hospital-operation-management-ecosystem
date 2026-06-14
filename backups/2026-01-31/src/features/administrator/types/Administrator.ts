// ============================================
// ADMINISTRATOR TYPES
// ============================================

export interface SystemOverview {
  totalDepartments: number;
  activeUsers: number;
  totalPatients: number;
  totalPrescriptions: number;
  systemUptime: string;
  lastBackup: string;
  storageUsed: number;
  storageTotal: number;
}

export interface DepartmentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  activeUsers: number;
  todayTransactions: number;
  lastActivity: string;
  alerts: number;
  performance: number; // percentage
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  department: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  entity: string;
  entityId: string;
  description: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  type: 'security' | 'performance' | 'maintenance' | 'backup' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  department?: string;
  title: string;
  message: string;
  status: 'new' | 'acknowledged' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface DatabaseStats {
  tableName: string;
  recordCount: number;
  sizeGB: number;
  lastModified: string;
  indexCount: number;
}

export interface PerformanceMetric {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  requestsPerSecond: number;
}

export interface BackupStatus {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'failed' | 'in-progress' | 'scheduled';
  sizeGB: number;
  duration: string;
  location: string;
}

export interface SystemConfiguration {
  category: string;
  settings: {
    key: string;
    value: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    options?: string[];
  }[];
}

export interface DepartmentPermission {
  department: string;
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    admin: boolean;
  };
}

export interface LicenseInfo {
  feature: string;
  status: 'active' | 'expired' | 'trial';
  expiryDate: string;
  usersAllowed: number;
  usersActive: number;
  type: 'essential' | 'professional' | 'enterprise';
}

export interface IntegrationStatus {
  id: string;
  name: string;
  type: 'api' | 'database' | 'service' | 'external';
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastSync: string;
  endpoint: string;
  responseTime: number;
}


