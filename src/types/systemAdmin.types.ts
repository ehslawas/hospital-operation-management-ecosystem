import { BaseEntity, User } from './index'

export interface SystemAdminAuditLog extends BaseEntity {
    actor_id: string
    actor_role: string
    target_hospital_id?: string
    action: string
    entity_type?: string
    entity_id?: string
    old_values?: Record<string, unknown>
    new_values?: Record<string, unknown>
    ip_address?: string
    user_agent?: string

    // Relations
    actor?: User
}

export type SystemSubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired'

export interface SystemTenantStats {
    hospital_id: string
    hospital_name: string
    user_count: number
    storage_usage_mb: number
    last_active_at: string
    subscription_status: SystemSubscriptionStatus
}

export interface AggregatedSystemAnalytics {
    overview: {
        total_tenants: number
        total_users_system_wide: number
        total_storage_gb: number
        active_tenants_last_24h: number
    }
    tenant_growth: {
        date: string
        count: number
    }[]
    system_load: {
        cpu_average: number
        memory_average: number
        api_requests_per_min: number
    }
}
