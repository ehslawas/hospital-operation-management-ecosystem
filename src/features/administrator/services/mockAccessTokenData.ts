import type {
  AccessToken,
  TokenUsageLog,
  UnauthorizedAccessAttempt,
  AccessControlRule,
  TokenStatistics,
} from '../types/AccessToken';

// ============================================
// ACCESS TOKENS
// ============================================

export function getAccessTokens(): AccessToken[] {
  const tokens: AccessToken[] = [];
  const resourceTypes: ('patient_records' | 'prescriptions' | 'lab_results' | 'medical_history' | 'billing' | 'full_access')[] = [
    'patient_records',
    'prescriptions',
    'lab_results',
    'medical_history',
    'billing',
    'full_access',
  ];
  const accessLevels: ('view' | 'edit' | 'export' | 'delete')[] = ['view', 'edit', 'export', 'delete'];
  const statuses: ('active' | 'expired' | 'revoked' | 'suspended')[] = ['active', 'active', 'active', 'expired', 'revoked'];
  const departments = ['Laboratory', 'Radiology', 'Pharmacy Counter', 'General Ward', 'Emergency & Trauma'];

  for (let i = 1; i <= 50; i++) {
    const createdDate = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30);
    const expiryHours = Math.random() > 0.3 ? 24 * 7 : -24; // Some expired
    const maxUsage = Math.floor(Math.random() * 50) + 10;
    const currentUsage = Math.floor(Math.random() * maxUsage);
    const status = expiryHours < 0 ? 'expired' : currentUsage >= maxUsage ? 'revoked' : statuses[Math.floor(Math.random() * statuses.length)];

    tokens.push({
      id: `token-${i}`,
      tokenCode: `TKN-${String(i).padStart(6, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      userId: `user-${Math.floor(Math.random() * 100) + 1}`,
      userName: `Dr. Staff ${Math.floor(Math.random() * 100) + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      purpose: ['Research Study', 'Clinical Review', 'Audit Compliance', 'Quality Improvement', 'Emergency Access'][Math.floor(Math.random() * 5)],
      resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
      accessLevel: accessLevels[Math.floor(Math.random() * accessLevels.length)],
      status: status,
      maxUsageCount: maxUsage,
      currentUsageCount: currentUsage,
      createdAt: createdDate.toISOString(),
      createdBy: 'admin-001',
      expiresAt: new Date(createdDate.getTime() + expiryHours * 60 * 60 * 1000).toISOString(),
      lastUsedAt: currentUsage > 0 ? new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString() : undefined,
      ipWhitelist: Math.random() > 0.5 ? ['192.168.1.0/24', '10.0.0.0/8'] : undefined,
      notes: Math.random() > 0.7 ? 'High priority access for emergency response' : undefined,
    });
  }

  return tokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================
// TOKEN USAGE LOGS
// ============================================

export function getTokenUsageLogs(): TokenUsageLog[] {
  const logs: TokenUsageLog[] = [];
  const actions: ('access' | 'view' | 'edit' | 'export' | 'delete')[] = ['access', 'view', 'edit', 'export', 'delete'];
  const resources = ['Patient Record', 'Prescription', 'Lab Result', 'Medical History', 'Billing Info'];

  for (let i = 1; i <= 200; i++) {
    const success = Math.random() > 0.1; // 90% success rate
    logs.push({
      id: `log-${i}`,
      tokenId: `token-${Math.floor(Math.random() * 50) + 1}`,
      tokenCode: `TKN-${String(Math.floor(Math.random() * 50) + 1).padStart(6, '0')}-XXXXXX`,
      userId: `user-${Math.floor(Math.random() * 100) + 1}`,
      userName: `Dr. Staff ${Math.floor(Math.random() * 100) + 1}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      resourceType: resources[Math.floor(Math.random() * resources.length)],
      resourceId: `RES-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      deviceInfo: ['Windows 10', 'macOS', 'Linux', 'iPad', 'Android'][Math.floor(Math.random() * 5)],
      success: success,
      errorMessage: success ? undefined : ['Token expired', 'Usage limit exceeded', 'Invalid permissions'][Math.floor(Math.random() * 3)],
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ============================================
// UNAUTHORIZED ACCESS ATTEMPTS
// ============================================

export function getUnauthorizedAccessAttempts(): UnauthorizedAccessAttempt[] {
  const attempts: UnauthorizedAccessAttempt[] = [];
  const reasons: ('invalid_token' | 'expired_token' | 'exceeded_usage' | 'insufficient_permission' | 'ip_blocked' | 'no_token')[] = [
    'invalid_token',
    'expired_token',
    'exceeded_usage',
    'insufficient_permission',
    'ip_blocked',
    'no_token',
  ];
  const departments = ['Laboratory', 'Radiology', 'Pharmacy Counter', 'General Ward', 'Emergency & Trauma', 'Unknown'];

  for (let i = 1; i <= 75; i++) {
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const severity = reason === 'ip_blocked' || reason === 'invalid_token' ? 'high' : reason === 'no_token' ? 'critical' : 'medium';

    attempts.push({
      id: `attempt-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
      userId: `user-${Math.floor(Math.random() * 100) + 1}`,
      userName: `Staff Member ${Math.floor(Math.random() * 100) + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      attemptedResource: ['Patient Records', 'Prescription Data', 'Lab Results', 'Billing Information'][Math.floor(Math.random() * 4)],
      attemptedAction: ['View', 'Edit', 'Export', 'Delete'][Math.floor(Math.random() * 4)],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      reason: reason,
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      blocked: true,
    });
  }

  return attempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ============================================
// ACCESS CONTROL RULES
// ============================================

export function getAccessControlRules(): AccessControlRule[] {
  return [
    {
      id: 'rule-1',
      name: 'Patient Records - Doctor Access',
      resourceType: 'patient_records',
      requiredRole: ['doctor', 'specialist', 'consultant'],
      requiresToken: true,
      maxDailyAccess: 100,
      allowedDepartments: ['Emergency & Trauma', 'General Ward', 'Paediatric Ward', 'Maternity Ward'],
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 'rule-2',
      name: 'Prescription Access - Pharmacist',
      resourceType: 'prescriptions',
      requiredRole: ['pharmacist', 'pharmacy_technician'],
      requiresToken: true,
      maxDailyAccess: 200,
      allowedDepartments: ['Pharmacy Counter', 'Pharmacy Logistic', 'Pharmacy Sub Store'],
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
    {
      id: 'rule-3',
      name: 'Lab Results - Laboratory Staff',
      resourceType: 'lab_results',
      requiredRole: ['lab_technician', 'pathologist'],
      requiresToken: true,
      maxDailyAccess: 150,
      allowedDepartments: ['Laboratory'],
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    },
    {
      id: 'rule-4',
      name: 'Billing Access - Finance Department',
      resourceType: 'billing',
      requiredRole: ['accountant', 'finance_officer'],
      requiresToken: true,
      maxDailyAccess: 50,
      allowedDepartments: ['Office Admin'],
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    },
    {
      id: 'rule-5',
      name: 'Full Access - Emergency Override',
      resourceType: 'full_access',
      requiredRole: ['emergency_doctor', 'consultant'],
      requiresToken: true,
      maxDailyAccess: 20,
      allowedDepartments: ['Emergency & Trauma'],
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ];
}

// ============================================
// TOKEN STATISTICS
// ============================================

export function getTokenStatistics(): TokenStatistics {
  const tokens = getAccessTokens();
  const logs = getTokenUsageLogs();
  const attempts = getUnauthorizedAccessAttempts();

  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  return {
    totalActive: tokens.filter(t => t.status === 'active').length,
    totalExpired: tokens.filter(t => t.status === 'expired').length,
    totalRevoked: tokens.filter(t => t.status === 'revoked').length,
    totalUsage24h: logs.filter(l => new Date(l.timestamp).getTime() > last24h).length,
    totalUnauthorizedAttempts24h: attempts.filter(a => new Date(a.timestamp).getTime() > last24h).length,
    mostAccessedResource: 'Patient Records',
    highRiskAttempts: attempts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
  };
}


