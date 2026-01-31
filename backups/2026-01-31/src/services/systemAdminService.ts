import { supabase } from './supabase'
import type {
  SystemStatistics,
  HospitalWithAdmin,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

/**
 * Get system-wide statistics
 */
export async function getSystemStatistics(): Promise<ApiResponse<SystemStatistics>> {
  try {
    // Get hospitals count
    const { data: hospitals, error: hospitalsError } = await supabase
      .from('hospitals')
      .select('id, status, admin_id')

    if (hospitalsError) throw hospitalsError

    // Get users count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, status')

    if (usersError) throw usersError

    // Get module usage
    const { data: modules, error: modulesError } = await supabase
      .from('hospital_modules')
      .select('module_code, is_enabled')

    if (modulesError) throw modulesError

    // Get system health
    const { data: healthLogs, error: healthError } = await supabase
      .from('system_health_logs')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(10)

    if (healthError) throw healthError

    // Get recent alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('system_alerts')
      .select('alert_type')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(100)

    if (alertsError) throw alertsError

    // Get last backup (handle gracefully if table doesn't exist or has no data)
    let backups = null
    try {
      const { data, error: backupsError } = await supabase
        .from('system_backups')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Only throw if it's a real error (not "no rows" or "table doesn't exist")
      if (backupsError && backupsError.code !== 'PGRST116' && backupsError.code !== '42P01') {
        // 42P01 = relation does not exist, PGRST116 = no rows returned
        console.warn('Error fetching backups (non-critical):', backupsError)
      } else {
        backups = data || null
      }
    } catch (err) {
      // Silently handle backup query failures - backups are optional for stats
      console.warn('Could not fetch backup information:', err)
    }

    // Calculate statistics
    const totalHospitals = hospitals?.length || 0
    const activeHospitals = hospitals?.filter((h) => h.status === 'active').length || 0
    const inactiveHospitals = hospitals?.filter((h) => h.status === 'inactive').length || 0
    const pendingSetupHospitals = hospitals?.filter(
      (h) => h.status === 'active' && !h.admin_id
    ).length || 0

    const totalUsers = users?.length || 0
    const activeUsers = users?.filter((u) => u.status === 'active').length || 0
    const pendingUsers = users?.filter((u) => u.status === 'pending').length || 0
    const suspendedUsers = users?.filter((u) => u.status === 'suspended').length || 0
    const inactiveUsers = users?.filter((u) => u.status === 'inactive').length || 0

    // Calculate module usage
    const moduleUsage: Record<string, { count: number; percentage: number }> = {}
    const enabledModules = modules?.filter((m) => m.is_enabled) || []

    const moduleCodes = ['pharmacy', 'ward', 'laboratory', 'radiology', 'billing', 'hr', 'asset', 'reports']
    moduleCodes.forEach((code) => {
      const count = enabledModules.filter((m) => m.module_code === code).length
      moduleUsage[code] = {
        count,
        percentage: totalHospitals > 0 ? Math.round((count / totalHospitals) * 100) : 0,
      }
    })

    // Calculate alert counts
    const criticalAlerts = alerts?.filter((a) => a.alert_type === 'critical').length || 0
    const warningAlerts = alerts?.filter((a) => a.alert_type === 'warning').length || 0
    const infoAlerts = alerts?.filter((a) => a.alert_type === 'info').length || 0

    // Determine overall health status
    const latestHealth = healthLogs?.[0]
    const overallStatus = latestHealth?.status || 'healthy'

    return {
      data: {
        total_hospitals: totalHospitals,
        active_hospitals: activeHospitals,
        inactive_hospitals: inactiveHospitals,
        pending_setup_hospitals: pendingSetupHospitals,
        total_users: totalUsers,
        active_users: activeUsers,
        pending_users: pendingUsers,
        suspended_users: suspendedUsers,
        inactive_users: inactiveUsers,
        module_usage: moduleUsage as any,
        system_health: {
          overall_status: overallStatus as any,
          checks: (healthLogs || []) as any,
        },
        recent_alerts: {
          critical: criticalAlerts,
          warning: warningAlerts,
          info: infoAlerts,
        },
        last_backup: backups || undefined,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching system statistics:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch system statistics',
    }
  }
}

/**
 * Get all hospitals with admin information
 */
export async function getHospitalsWithAdmin(
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<PaginatedResponse<HospitalWithAdmin>> {
  try {
    let query = supabase
      .from('hospitals')
      .select(
        `
        *,
        admin:users!hospitals_admin_id_fkey(*),
        modules:hospital_modules(*)
      `,
        { count: 'exact' }
      )

    if (search) {
      query = query.or(`hospital_name.ilike.%${search}%,hospital_code.ilike.%${search}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false })

    if (error) throw error

    // Get user counts for each hospital
    const hospitalsWithCounts = await Promise.all(
      (data || []).map(async (hospital) => {
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', hospital.id)

        const { count: activeUserCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', hospital.id)
          .eq('status', 'active')

        const enabledModulesCount = hospital.modules?.filter((m: any) => m.is_enabled).length || 0

        return {
          ...hospital,
          user_count: userCount || 0,
          active_user_count: activeUserCount || 0,
          enabled_modules_count: enabledModulesCount,
        }
      })
    )

    return {
      data: hospitalsWithCounts as any,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

