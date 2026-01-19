// Facility Service - For System Admin to get comprehensive facility statistics
import { supabase } from './supabase'
import type { FacilityStatistics } from '@/types'

/**
 * Get comprehensive facility statistics
 */
export async function getFacilityStatistics(facilityId: string): Promise<FacilityStatistics> {
  // Get user count
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', facilityId)

  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', facilityId)
    .eq('status', 'active')

  // Get roles count
  const { count: totalRoles } = await supabase
    .from('roles')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', facilityId)

  // Get enabled modules
  const { data: modules } = await supabase
    .from('hospital_modules')
    .select('*')
    .eq('hospital_id', facilityId)

  const enabledModules = modules?.filter((m) => m.is_enabled).length || 0
  const totalModules = modules?.length || 0

  // Get recent logs count (last 24 hours)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const { count: recentLogsCount } = await supabase
    .from('hospital_logs')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', facilityId)
    .gte('created_at', yesterday.toISOString())

  // Get module breakdown
  const moduleBreakdown =
    modules?.map((m) => ({
      code: m.module_code,
      name: m.module_code.replace(/_/g, ' '),
      enabled: m.is_enabled,
    })) || []

  // Get role breakdown
  const { data: users } = await supabase
    .from('users')
    .select('role_id, role:roles(role_name)')
    .eq('hospital_id', facilityId)

  const roleMap: Record<string, number> = {}
  users?.forEach((user: any) => {
    const roleName = user.role?.role_name || 'Unknown'
    roleMap[roleName] = (roleMap[roleName] || 0) + 1
  })

  const roleBreakdown = Object.entries(roleMap).map(([roleName, userCount]) => ({
    roleName,
    userCount,
  }))

  // Performance metrics (in production, this would come from monitoring service)
  const performanceMetrics = {
    databaseHealth: 'healthy' as const,
    apiResponseTime: Math.floor(Math.random() * 100) + 150, // 150-250ms
    storageUsage: Math.floor(Math.random() * 30) + 60, // 60-90%
    errorRate: Math.random() * 2, // 0-2%
  }

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalRoles: totalRoles || 0,
    enabledModules,
    totalModules,
    recentLogsCount: recentLogsCount || 0,
    performanceMetrics,
    moduleBreakdown,
    roleBreakdown,
  }
}

/**
 * Get facility logs (recent)
 */
export async function getFacilityLogs(facilityId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('hospital_logs')
    .select('*, user:users(full_name)')
    .eq('hospital_id', facilityId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

