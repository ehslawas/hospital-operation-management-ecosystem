// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { mockAuditLogs, mockUsers } from '@/services/mockData'
import type { AuditLog, AuditLogWithRelations, PaginatedResponse, SortConfig } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface GetAuditLogsParams {
  page?: number
  pageSize?: number
  search?: string
  module?: string
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  sort?: SortConfig
}

/**
 * Get paginated list of audit logs
 */
export async function getAuditLogs({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  module,
  action,
  userId,
  startDate,
  endDate,
  sort,
}: GetAuditLogsParams): Promise<PaginatedResponse<AuditLogWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      // Supabase implementation
      let query = supabase
        .from('audit_logs')
        .select('*, user:users(*)', { count: 'exact' })

      if (search) {
        query = query.or(`action.ilike.%${search}%,module.ilike.%${search}%,entity_type.ilike.%${search}%`)
      }
      if (module) {
        query = query.eq('module', module)
      }
      if (action) {
        query = query.eq('action', action)
      }
      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching audit logs from Supabase:', error)
        throw new Error(error.message)
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0

      return {
        data: (data || []) as AuditLogWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      }
    } else {
      // Mock data implementation
      await new Promise((resolve) => setTimeout(resolve, 500))

      let filteredLogs = mockAuditLogs.filter((log) => {
        const matchesSearch = search
          ? log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.module.toLowerCase().includes(search.toLowerCase()) ||
            (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase()))
          : true
        const matchesModule = module ? log.module === module : true
        const matchesAction = action ? log.action === action : true
        const matchesUser = userId ? log.user_id === userId : true
        const matchesStartDate = startDate ? log.created_at >= startDate : true
        const matchesEndDate = endDate ? log.created_at <= endDate : true
        return (
          matchesSearch && matchesModule && matchesAction && matchesUser && matchesStartDate && matchesEndDate
        )
      })

      if (sort) {
        filteredLogs.sort((a, b) => {
          const aValue = a[sort.key as keyof AuditLog]
          const bValue = b[sort.key as keyof AuditLog]

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
          }
          if (aValue instanceof Date && bValue instanceof Date) {
            return sort.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime()
          }
          return 0
        })
      } else {
        filteredLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }

      const total = filteredLogs.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

      // Add relations
      const logsWithRelations: AuditLogWithRelations[] = paginatedLogs.map((log) => ({
        ...log,
        user: mockUsers.find((u) => u.id === log.user_id),
      }))

      return {
        data: logsWithRelations,
        total,
        page,
        pageSize,
        totalPages,
      }
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    throw error
  }
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsToCSV(params: Omit<GetAuditLogsParams, 'page' | 'pageSize'>): Promise<string> {
  try {
    // Get all logs matching the filters (no pagination for export)
    const result = await getAuditLogs({ ...params, page: 1, pageSize: 10000 })

    // Convert to CSV
    const headers = ['Date', 'User', 'Action', 'Module', 'Entity Type', 'Entity ID', 'IP Address']
    const rows = result.data.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.user?.full_name || 'Unknown',
      log.action,
      log.module,
      log.entity_type || '',
      log.entity_id || '',
      log.ip_address || '',
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

    return csvContent
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    throw error
  }
}

/**
 * Get available modules for filtering
 */
export async function getAuditLogModules(): Promise<string[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('audit_logs').select('module').order('module')

      if (error) {
        console.error('Error fetching modules from Supabase:', error)
        throw new Error(error.message)
      }

      const uniqueModules = Array.from(new Set((data || []).map((log) => log.module)))
      return uniqueModules.sort()
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const uniqueModules = Array.from(new Set(mockAuditLogs.map((log) => log.module)))
      return uniqueModules.sort()
    }
  } catch (error) {
    console.error('Error fetching modules:', error)
    throw error
  }
}

/**
 * Get available actions for filtering
 */
export async function getAuditLogActions(): Promise<string[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('audit_logs').select('action').order('action')

      if (error) {
        console.error('Error fetching actions from Supabase:', error)
        throw new Error(error.message)
      }

      const uniqueActions = Array.from(new Set((data || []).map((log) => log.action)))
      return uniqueActions.sort()
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const uniqueActions = Array.from(new Set(mockAuditLogs.map((log) => log.action)))
      return uniqueActions.sort()
    }
  } catch (error) {
    console.error('Error fetching actions:', error)
    throw error
  }
}

