/**
 * Pharmacy Maintenance Service
 * Handles unit catalog, stock locations, and stock verification
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  UnitOfMeasure,
  StockLocation,
  StockVerification,
  StockVerificationWithRelations,
  StockVerificationItem,
} from '@/types/pharmacy'

// =====================================================
// UNIT OF MEASURE MANAGEMENT
// =====================================================

/**
 * Get all units of measure
 */
export async function getUnitsOfMeasure(): Promise<ApiResponse<UnitOfMeasure[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_units_of_measure')
      .select('*')
      .eq('is_active', true)
      .order('unit_name', { ascending: true })

    if (error) throw error

    return { data: (data || []) as UnitOfMeasure[], error: null }
  } catch (error) {
    console.error('Error fetching units of measure:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch units of measure',
    }
  }
}

/**
 * Get units by type
 */
export async function getUnitsByType(
  unitType: 'quantity' | 'volume' | 'weight' | 'pack'
): Promise<ApiResponse<UnitOfMeasure[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_units_of_measure')
      .select('*')
      .eq('is_active', true)
      .eq('unit_type', unitType)
      .order('unit_name', { ascending: true })

    if (error) throw error

    return { data: (data || []) as UnitOfMeasure[], error: null }
  } catch (error) {
    console.error('Error fetching units by type:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch units by type',
    }
  }
}

// =====================================================
// STOCK LOCATION MANAGEMENT
// =====================================================

/**
 * Get all stock locations
 */
export async function getStockLocations(
  hospitalId: string,
  filter?: {
    location_type?: string
    is_active?: boolean
  }
): Promise<ApiResponse<StockLocation[]>> {
  try {
    let query = supabase
      .from('pharmacy_stock_locations')
      .select('*')
      .eq('hospital_id', hospitalId)

    if (filter?.location_type) {
      query = query.eq('location_type', filter.location_type)
    }

    if (filter?.is_active !== undefined) {
      query = query.eq('is_active', filter.is_active)
    }

    const { data, error } = await query.order('location_name', { ascending: true })

    if (error) throw error

    return { data: (data || []) as StockLocation[], error: null }
  } catch (error) {
    console.error('Error fetching stock locations:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stock locations',
    }
  }
}

/**
 * Create stock location
 */
export async function createStockLocation(
  hospitalId: string,
  data: Omit<StockLocation, 'id' | 'created_at' | 'hospital_id'>
): Promise<ApiResponse<StockLocation>> {
  try {
    const { data: newLocation, error } = await supabase
      .from('pharmacy_stock_locations')
      .insert({
        hospital_id: hospitalId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    return { data: newLocation as StockLocation, error: null }
  } catch (error) {
    console.error('Error creating stock location:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create stock location',
    }
  }
}

// =====================================================
// STOCK VERIFICATION MANAGEMENT
// =====================================================

/**
 * Get stock verifications
 */
export async function getStockVerifications(
  hospitalId: string,
  filter?: {
    status?: string
    verification_type?: string
    location_id?: string
  },
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<StockVerificationWithRelations>>> {
  try {
    let query = supabase
      .from('pharmacy_stock_verifications')
      .select(`
        *,
        location:pharmacy_stock_locations (*),
        performed_by_user:users!performed_by (id, first_name, last_name, email),
        approved_by_user:users!approved_by (id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('hospital_id', hospitalId)

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    if (filter?.verification_type) {
      query = query.eq('verification_type', filter.verification_type)
    }

    if (filter?.location_id) {
      query = query.eq('location_id', filter.location_id)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: {
        data: (data || []) as StockVerificationWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching stock verifications:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stock verifications',
    }
  }
}

/**
 * Create stock verification
 */
export async function createStockVerification(
  hospitalId: string,
  userId: string,
  data: {
    verification_type: 'full' | 'cycle' | 'spot'
    location_id?: string
    scheduled_date: string
    notes?: string
  }
): Promise<ApiResponse<StockVerification>> {
  try {
    const verificationNumber = `VER-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    const { data: newVerification, error } = await supabase
      .from('pharmacy_stock_verifications')
      .insert({
        hospital_id: hospitalId,
        verification_number: verificationNumber,
        verification_type: data.verification_type,
        location_id: data.location_id,
        scheduled_date: data.scheduled_date,
        notes: data.notes,
        status: 'scheduled',
        performed_by: userId
      })
      .select()
      .single()

    if (error) throw error

    return { data: newVerification as StockVerification, error: null }
  } catch (error) {
    console.error('Error creating stock verification:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create stock verification',
    }
  }
}

/**
 * Start stock verification
 */
export async function startStockVerification(
  verificationId: string,
  userId: string
): Promise<ApiResponse<StockVerification>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_verifications')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        performed_by: userId
      })
      .eq('id', verificationId)
      .select()
      .single()

    if (error) throw error

    return {
      data: data as StockVerification,
      error: null,
    }
  } catch (error) {
    console.error('Error starting stock verification:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to start stock verification',
    }
  }
}

/**
 * Record verification count
 */
export async function recordVerificationCount(
  verificationId: string,
  items: {
    item_type: 'drug' | 'non_drug'
    item_id: string
    batch_id?: string
    system_quantity: number
    counted_quantity: number
    variance_reason?: string
  }[]
): Promise<ApiResponse<StockVerificationItem[]>> {
  try {
    const itemsToInsert = items.map(item => ({
      verification_id: verificationId,
      item_type: item.item_type,
      item_id: item.item_id,
      batch_id: item.batch_id,
      system_quantity: item.system_quantity,
      counted_quantity: item.counted_quantity,
      variance: item.counted_quantity - item.system_quantity,
      variance_reason: item.variance_reason,
      adjustment_approved: false
    }))

    const { data, error } = await supabase
      .from('pharmacy_stock_verification_items')
      .insert(itemsToInsert)
      .select()

    if (error) throw error

    return { data: (data || []) as StockVerificationItem[], error: null }
  } catch (error) {
    console.error('Error recording verification count:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to record verification count',
    }
  }
}

/**
 * Complete stock verification
 */
export async function completeStockVerification(
  verificationId: string,
  approverId: string
): Promise<ApiResponse<StockVerification>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_stock_verifications')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        approved_by: approverId
      })
      .eq('id', verificationId)
      .select()
      .single()

    if (error) throw error

    return {
      data: data as StockVerification,
      error: null,
    }
  } catch (error) {
    console.error('Error completing stock verification:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to complete stock verification',
    }
  }
}

