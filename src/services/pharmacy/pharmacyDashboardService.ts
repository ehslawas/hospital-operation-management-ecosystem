/**
 * Pharmacy Dashboard Service
 * Provides dashboard statistics and summary data
 */

import { supabase } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  PharmacyDashboardStats,
  InventorySummary,
  OxygenSummary,
  BudgetSummary,
  ProcurementSummary,
  DistributionSummary,
  PharmacyAlert,
  PharmacyActivityLog,
} from '@/types/pharmacy'

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(
  _hospitalId: string
): Promise<ApiResponse<PharmacyDashboardStats>> {
  try {
    // For now, returning empty/default statistics
    // These would eventually be calculated from direct Supabase queries

    const inventory: InventorySummary = {
      total_items: 0,
      drugs_count: 0,
      non_drugs_count: 0,
      total_value: 0,
      low_stock_count: 0,
      critical_stock_count: 0,
      near_expiry_count: 0,
      expired_count: 0,
      slow_moving_count: 0,
    }

    const oxygen: OxygenSummary = {
      total_cylinders: 0,
      full_cylinders: 0,
      empty_cylinders: 0,
      in_use_cylinders: 0,
      maintenance_cylinders: 0,
      cylinders_by_type: [],
      daily_consumption: 0,
      monthly_consumption: 0,
    }

    const budget: BudgetSummary = {
      fiscal_year: new Date().getFullYear(),
      total_allocated: 0,
      total_utilized: 0,
      total_committed: 0,
      total_available: 0,
      utilization_percentage: 0,
      by_type: [],
      by_category: [],
    }

    const procurement: ProcurementSummary = {
      pending_orders: 0,
      pending_value: 0,
      orders_this_month: 0,
      orders_value_this_month: 0,
      pending_deliveries: 0,
      pending_receipts: 0,
      overdue_deliveries: 0,
      supplier_count: 0,
      top_suppliers: [],
    }

    const distribution: DistributionSummary = {
      pending_requests: 0,
      in_transit: 0,
      completed_today: 0,
      completed_this_month: 0,
      inter_facility_pending: 0,
      intra_facility_pending: 0,
    }

    return {
      data: {
        inventory,
        oxygen,
        budget,
        procurement,
        distribution,
        alerts: [],
        recent_activities: [],
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
    }
  }
}

/**
 * Get alerts for the dashboard
 */
export async function getAlerts(
  hospitalId: string,
  limit: number = 10,
  unreadOnly: boolean = false
): Promise<ApiResponse<PharmacyAlert[]>> {
  try {
    let query = supabase
      .from('pharmacy_alerts')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      data: data as PharmacyAlert[],
      error: null,
    }
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alerts',
    }
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('pharmacy_alerts')
      .update({ is_read: true })
      .eq('id', alertId)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error marking alert as read:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark alert as read',
    }
  }
}

/**
 * Get recent activity logs
 */
export async function getRecentActivities(
  hospitalId: string,
  limit: number = 10
): Promise<ApiResponse<PharmacyActivityLog[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_activity_logs')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      data: data as PharmacyActivityLog[],
      error: null,
    }
  } catch (error) {
    console.error('Error fetching activities:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch activities',
    }
  }
}
