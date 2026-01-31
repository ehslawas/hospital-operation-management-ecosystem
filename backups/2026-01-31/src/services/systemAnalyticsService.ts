import { supabase } from './supabase'
import type {
    AggregatedSystemAnalytics,
    SystemTenantStats,
    SystemSubscriptionStatus
} from '@/types/systemAdmin.types'
import type { ApiResponse, PaginatedResponse } from '@/types'

export const systemAnalyticsService = {
    /**
     * Get high-level system overview analytics
     */
    async getOverviewStats(): Promise<ApiResponse<AggregatedSystemAnalytics>> {
        try {
            const startTime = performance.now()
            // Parallel fetch for dashboard metrics
            const [hospitalsRes, usersRes] = await Promise.all([
                supabase.from('hospitals').select('id, created_at, subscription_status', { count: 'exact' }),
                supabase.from('users').select('id', { count: 'exact' }),
            ])
            const dbLatency = Math.round(performance.now() - startTime)

            const totalHospitals = hospitalsRes.count || 0
            const totalUsers = usersRes.count || 0
            const activeTenants = hospitalsRes.data?.filter(h => h.subscription_status === 'active').length || 0

            return {
                data: {
                    overview: {
                        total_tenants: totalHospitals,
                        total_users_system_wide: totalUsers,
                        // Real storage tracking requires Bucket RLS/Size query. Returning 0 if unavailable.
                        total_storage_gb: 0,
                        active_tenants_last_24h: activeTenants,
                    },
                    tenant_growth: [], // Chart data would require dedicated historical query
                    system_load: {
                        cpu_average: 0, // Not available from frontend
                        memory_average: 0, // Not available from frontend
                        api_requests_per_min: Math.round(60000 / (dbLatency || 1)) // Crude approximation based on latency
                    }
                },
                error: null
            }
        } catch (error: any) {
            console.error('[SystemAnalytics] Error fetching overview:', error)
            return { data: null, error: error.message }
        }
    },

    async checkSystemHealth() {
        const start = performance.now()
        try {
            const { error } = await supabase.from('hospitals').select('count', { count: 'exact', head: true })
            const latency = Math.round(performance.now() - start)

            if (error) throw error

            return {
                status: latency < 200 ? 'healthy' : 'warning',
                metrics: {
                    database_latency: latency,
                    api_status: 'operational'
                }
            }
        } catch (err) {
            return { status: 'error', metrics: { database_latency: 0, api_status: 'down' } }
        }
    },

    /**
     * Get stats per tenant (Hospital)
     */
    async getTenantStats(
        page = 1,
        pageSize = 10,
        search?: string
    ): Promise<PaginatedResponse<SystemTenantStats>> {
        try {
            let query = supabase
                .from('hospitals')
                .select(`
          id,
          hospital_name,
          subscription_status,
          updated_at
        `, { count: 'exact' })

            if (search) {
                query = query.ilike('hospital_name', `%${search}%`)
            }

            const from = (page - 1) * pageSize
            const to = from + pageSize - 1

            const { data, count, error } = await query.range(from, to).order('hospital_name')

            if (error) throw error

            // Enrich with user counts
            const enrichedData: SystemTenantStats[] = await Promise.all(
                (data || []).map(async (h) => {
                    const { count: uCount } = await supabase
                        .from('users')
                        .select('id', { count: 'exact', head: true })
                        .eq('hospital_id', h.id)

                    return {
                        hospital_id: h.id,
                        hospital_name: h.hospital_name,
                        user_count: uCount || 0,
                        storage_usage_mb: 0, // Real storage tracking TBD
                        last_active_at: h.updated_at || new Date().toISOString(),
                        subscription_status: (h.subscription_status || 'trial') as SystemSubscriptionStatus
                    }
                })
            )

            return {
                data: enrichedData,
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            }

        } catch (error) {
            console.error('[SystemAnalytics] Error fetching tenant stats:', error)
            return { data: [], total: 0, page, pageSize, totalPages: 0 }
        }
    }
}
