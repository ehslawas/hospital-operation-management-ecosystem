// @ts-nocheck
/**
 * Pharmacy Dashboard Service
 * Provides dashboard statistics and summary data
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
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
import {
  mockDrugs,
  mockNonDrugs,
  mockStockBatches,
  mockOxygenCylinders,
  mockBudgets,
  mockPurchaseOrders,
  mockTransferRequests,
  mockPharmacyAlerts,
  mockPharmacyActivityLogs,
  mockExpiryItems,
  mockSlowMovingItems,
} from '@/services/pharmacy/mockData'

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(
  hospitalId: string
): Promise<ApiResponse<PharmacyDashboardStats>> {
  try {
    if (isSupabaseConfigured()) {
      // TODO: Implement Supabase queries when connected
      // For now, fall through to mock data
    }

    // Calculate mock statistics
    const inventory = calculateInventorySummary()
    const oxygen = calculateOxygenSummary()
    const budget = calculateBudgetSummary()
    const procurement = calculateProcurementSummary()
    const distribution = calculateDistributionSummary()
    const alerts = mockPharmacyAlerts.filter(a => !a.is_read).slice(0, 5)
    const recent_activities = mockPharmacyActivityLogs.slice(0, 10)

    return {
      data: {
        inventory,
        oxygen,
        budget,
        procurement,
        distribution,
        alerts,
        recent_activities,
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
 * Calculate inventory summary from mock data
 */
function calculateInventorySummary(): InventorySummary {
  const drugs = mockDrugs
  const nonDrugs = mockNonDrugs
  const batches = mockStockBatches
  
  const lowStockDrugs = drugs.filter(d => d.stock_status === 'low_stock').length
  const criticalDrugs = drugs.filter(d => d.stock_status === 'critical').length
  const lowStockNonDrugs = nonDrugs.filter(d => d.stock_status === 'low_stock').length
  const criticalNonDrugs = nonDrugs.filter(d => d.stock_status === 'critical').length

  // Calculate total value
  const totalValue = batches.reduce((sum, batch) => {
    return sum + (batch.quantity_on_hand * (batch.unit_cost || 0))
  }, 0)

  return {
    total_items: drugs.length + nonDrugs.length,
    drugs_count: drugs.length,
    non_drugs_count: nonDrugs.length,
    total_value: totalValue,
    low_stock_count: lowStockDrugs + lowStockNonDrugs,
    critical_stock_count: criticalDrugs + criticalNonDrugs,
    near_expiry_count: mockExpiryItems.filter(e => e.status === 'near_expiry').length,
    expired_count: mockExpiryItems.filter(e => e.status === 'expired').length,
    slow_moving_count: mockSlowMovingItems.length,
  }
}

/**
 * Calculate oxygen summary from mock data
 */
function calculateOxygenSummary(): OxygenSummary {
  const cylinders = mockOxygenCylinders

  return {
    total_cylinders: cylinders.length,
    full_cylinders: cylinders.filter(c => c.status === 'full').length,
    empty_cylinders: cylinders.filter(c => c.status === 'empty').length,
    in_use_cylinders: cylinders.filter(c => c.status === 'in_use').length,
    maintenance_cylinders: cylinders.filter(c => c.status === 'maintenance').length,
    cylinders_by_type: [
      { type: 'B', count: cylinders.filter(c => c.type_info?.type_code === 'B').length },
      { type: 'D', count: cylinders.filter(c => c.type_info?.type_code === 'D').length },
      { type: 'E', count: cylinders.filter(c => c.type_info?.type_code === 'E').length },
      { type: 'M', count: cylinders.filter(c => c.type_info?.type_code === 'M').length },
    ],
    daily_consumption: 45, // Mock value
    monthly_consumption: 1350, // Mock value
  }
}

/**
 * Calculate budget summary from mock data
 */
function calculateBudgetSummary(): BudgetSummary {
  const budgets = mockBudgets.filter(b => b.fiscal_year === new Date().getFullYear())
  
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0)
  const totalUtilized = budgets.reduce((sum, b) => sum + b.utilized_amount, 0)
  const totalCommitted = budgets.reduce((sum, b) => sum + b.committed_amount, 0)
  const totalAvailable = budgets.reduce((sum, b) => sum + b.available_amount, 0)

  return {
    fiscal_year: new Date().getFullYear(),
    total_allocated: totalAllocated,
    total_utilized: totalUtilized,
    total_committed: totalCommitted,
    total_available: totalAvailable,
    utilization_percentage: totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0,
    by_type: [
      {
        type: 'appl',
        allocated: budgets.filter(b => b.budget_type === 'appl').reduce((s, b) => s + b.allocated_amount, 0),
        utilized: budgets.filter(b => b.budget_type === 'appl').reduce((s, b) => s + b.utilized_amount, 0),
        available: budgets.filter(b => b.budget_type === 'appl').reduce((s, b) => s + b.available_amount, 0),
      },
      {
        type: 'cc',
        allocated: budgets.filter(b => b.budget_type === 'cc').reduce((s, b) => s + b.allocated_amount, 0),
        utilized: budgets.filter(b => b.budget_type === 'cc').reduce((s, b) => s + b.utilized_amount, 0),
        available: budgets.filter(b => b.budget_type === 'cc').reduce((s, b) => s + b.available_amount, 0),
      },
      {
        type: 'dp',
        allocated: budgets.filter(b => b.budget_type === 'dp').reduce((s, b) => s + b.allocated_amount, 0),
        utilized: budgets.filter(b => b.budget_type === 'dp').reduce((s, b) => s + b.utilized_amount, 0),
        available: budgets.filter(b => b.budget_type === 'dp').reduce((s, b) => s + b.available_amount, 0),
      },
    ],
    by_category: [
      {
        category: 'drug',
        allocated: budgets.filter(b => b.category === 'drug').reduce((s, b) => s + b.allocated_amount, 0),
        utilized: budgets.filter(b => b.category === 'drug').reduce((s, b) => s + b.utilized_amount, 0),
        available: budgets.filter(b => b.category === 'drug').reduce((s, b) => s + b.available_amount, 0),
      },
      {
        category: 'non_drug',
        allocated: budgets.filter(b => b.category === 'non_drug').reduce((s, b) => s + b.allocated_amount, 0),
        utilized: budgets.filter(b => b.category === 'non_drug').reduce((s, b) => s + b.utilized_amount, 0),
        available: budgets.filter(b => b.category === 'non_drug').reduce((s, b) => s + b.available_amount, 0),
      },
    ],
  }
}

/**
 * Calculate procurement summary from mock data
 */
function calculateProcurementSummary(): ProcurementSummary {
  const orders = mockPurchaseOrders

  const pendingOrders = orders.filter(o => 
    o.status === 'pending_approval' || o.status === 'approved' || o.status === 'sent'
  )
  const pendingValue = pendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const ordersThisMonth = orders.filter(o => new Date(o.order_date) >= thisMonth)
  const ordersValueThisMonth = ordersThisMonth.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  return {
    pending_orders: pendingOrders.length,
    pending_value: pendingValue,
    orders_this_month: ordersThisMonth.length,
    orders_value_this_month: ordersValueThisMonth,
    pending_deliveries: orders.filter(o => o.status === 'sent').length,
    pending_receipts: orders.filter(o => o.status === 'partial_received').length,
    overdue_deliveries: 0, // Calculate based on expected delivery date
    supplier_count: 3, // From mock suppliers
    top_suppliers: [
      { supplier_id: 'sup-001', supplier_name: 'Pharmaniaga Berhad', order_count: 15, total_value: 125000 },
      { supplier_id: 'sup-002', supplier_name: 'Duopharma (M) Sdn Bhd', order_count: 8, total_value: 75000 },
      { supplier_id: 'sup-003', supplier_name: 'CCM Duopharma Biotech Berhad', order_count: 5, total_value: 45000 },
    ],
  }
}

/**
 * Calculate distribution summary from mock data
 */
function calculateDistributionSummary(): DistributionSummary {
  const transfers = mockTransferRequests

  return {
    pending_requests: transfers.filter(t => t.status === 'pending').length,
    in_transit: transfers.filter(t => t.status === 'in_transit' || t.status === 'preparing').length,
    completed_today: transfers.filter(t => {
      if (!t.received_at) return false
      const today = new Date().toISOString().split('T')[0]
      return t.received_at.startsWith(today)
    }).length,
    completed_this_month: transfers.filter(t => {
      if (!t.received_at) return false
      const thisMonth = new Date().toISOString().slice(0, 7)
      return t.received_at.startsWith(thisMonth)
    }).length,
    inter_facility_pending: transfers.filter(t => 
      t.transfer_type === 'inter_facility' && t.status === 'pending'
    ).length,
    intra_facility_pending: transfers.filter(t => 
      t.transfer_type === 'intra_facility' && t.status === 'pending'
    ).length,
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
    let alerts = [...mockPharmacyAlerts]
    
    if (unreadOnly) {
      alerts = alerts.filter(a => !a.is_read)
    }
    
    return {
      data: alerts.slice(0, limit),
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
    // In mock mode, just return success
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
    return {
      data: mockPharmacyActivityLogs.slice(0, limit),
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

