import { supabase } from './supabase'
import type {
  SystemAlert,
  AlertType,
  AlertCategory,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

/**
 * Get system alerts
 */
export async function getSystemAlerts(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    alert_type?: AlertType
    category?: AlertCategory
    is_resolved?: boolean
    is_read?: boolean
  }
): Promise<PaginatedResponse<SystemAlert>> {
  try {
    let query = supabase
      .from('system_alerts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters?.alert_type) {
      query = query.eq('alert_type', filters.alert_type)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.is_resolved !== undefined) {
      query = query.eq('is_resolved', filters.is_resolved)
    }
    if (filters?.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      data: (data || []) as SystemAlert[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

/**
 * Get unread alert count
 */
export async function getUnreadAlertCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('system_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('is_resolved', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error fetching unread alert count:', error)
    return 0
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('system_alerts')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', alertId)

    if (error) throw error

    return {
      data: true,
      error: null,
    }
  } catch (error) {
    console.error('Error marking alert as read:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark alert as read',
    }
  }
}

/**
 * Mark alert as resolved
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy: string
): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('system_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) throw error

    return {
      data: true,
      error: null,
    }
  } catch (error) {
    console.error('Error resolving alert:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to resolve alert',
    }
  }
}

/**
 * Create a system alert
 */
export async function createAlert(
  alertType: AlertType,
  category: AlertCategory,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<ApiResponse<SystemAlert>> {
  try {
    const { data, error } = await supabase
      .from('system_alerts')
      .insert({
        alert_type: alertType,
        category,
        title,
        message,
        metadata,
        is_read: false,
        is_resolved: false,
      })
      .select()
      .single()

    if (error) throw error

    return {
      data: data as SystemAlert,
      error: null,
    }
  } catch (error) {
    console.error('Error creating alert:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create alert',
    }
  }
}

