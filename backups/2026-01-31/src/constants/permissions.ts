/**
 * Permission-related constants and utilities
 */

export const PERMISSION_ACTIONS = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
} as const;

export const PERMISSION_TYPES = {
    GRANT: 'grant',
    DENY: 'deny',
} as const;

export const APPROVAL_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
} as const;

export const CONDITION_OPERATORS = {
    EQUALS: '=',
    NOT_EQUALS: '!=',
    GREATER_THAN: '>',
    LESS_THAN: '<',
    GREATER_THAN_OR_EQUAL: '>=',
    LESS_THAN_OR_EQUAL: '<=',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'not_contains',
    IN: 'in',
    NOT_IN: 'not_in',
} as const;

export const CONDITION_OPERATOR_LABELS: Record<string, string> = {
    '=': 'Equals',
    '!=': 'Not Equals',
    '>': 'Greater Than',
    '<': 'Less Than',
    '>=': 'Greater Than or Equal',
    '<=': 'Less Than or Equal',
    'contains': 'Contains',
    'not_contains': 'Does Not Contain',
    'in': 'In List',
    'not_in': 'Not In List',
};

// Permission cache TTL (5 minutes)
export const PERMISSION_CACHE_TTL = 5 * 60 * 1000;

// Admin role codes that have full access
export const ADMIN_ROLE_CODES = ['system_admin', 'hospital_admin'] as const;

// Special module codes
export const SPECIAL_MODULES = {
    DASHBOARD: 'dashboard',
    ADMINISTRATION: 'administration',
    APPROVALS: 'approvals',
} as const;
