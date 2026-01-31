// ============================================
// ACCESS TOKEN MANAGEMENT TYPES
// ============================================

export interface AccessToken {
  id: string;
  tokenCode: string;
  userId: string;
  userName: string;
  department: string;
  purpose: string;
  resourceType: 'patient_records' | 'prescriptions' | 'lab_results' | 'medical_history' | 'billing' | 'full_access';
  accessLevel: 'view' | 'edit' | 'export' | 'delete';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  maxUsageCount: number;
  currentUsageCount: number;
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  lastUsedAt?: string;
  ipWhitelist?: string[];
  notes?: string;
}

export interface TokenUsageLog {
  id: string;
  tokenId: string;
  tokenCode: string;
  userId: string;
  userName: string;
  action: 'access' | 'view' | 'edit' | 'export' | 'delete';
  resourceType: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
  success: boolean;
  errorMessage?: string;
}

export interface UnauthorizedAccessAttempt {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  department: string;
  attemptedResource: string;
  attemptedAction: string;
  ipAddress: string;
  reason: 'invalid_token' | 'expired_token' | 'exceeded_usage' | 'insufficient_permission' | 'ip_blocked' | 'no_token';
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

export interface AccessControlRule {
  id: string;
  name: string;
  resourceType: string;
  requiredRole: string[];
  requiresToken: boolean;
  maxDailyAccess: number;
  allowedDepartments: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenStatistics {
  totalActive: number;
  totalExpired: number;
  totalRevoked: number;
  totalUsage24h: number;
  totalUnauthorizedAttempts24h: number;
  mostAccessedResource: string;
  highRiskAttempts: number;
}


