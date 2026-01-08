/**
 * Pharmacy Maintenance Service
 * Handles unit catalog, stock locations, and stock verification
 */

import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  UnitOfMeasure,
  StockLocation,
  StockVerification,
  StockVerificationWithRelations,
  StockVerificationItem,
} from '@/types/pharmacy'
import { mockStockLocations, mockUnitsOfMeasure } from './mockData'

// =====================================================
// UNIT OF MEASURE MANAGEMENT
// =====================================================

/**
 * Get all units of measure
 */
export async function getUnitsOfMeasure(): Promise<ApiResponse<UnitOfMeasure[]>> {
  try {
    return { data: mockUnitsOfMeasure, error: null }
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
    const units = mockUnitsOfMeasure.filter(u => u.unit_type === unitType)
    return { data: units, error: null }
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
    let locations = [...mockStockLocations]

    if (filter?.location_type) {
      locations = locations.filter(l => l.location_type === filter.location_type)
    }

    if (filter?.is_active !== undefined) {
      locations = locations.filter(l => l.is_active === filter.is_active)
    }

    return { data: locations, error: null }
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
    await new Promise(resolve => setTimeout(resolve, 500))

    const newLocation: StockLocation = {
      id: `loc-${Date.now()}`,
      hospital_id: hospitalId,
      ...data,
      created_at: new Date().toISOString(),
    }

    return { data: newLocation, error: null }
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
    // Mock verifications
    let verifications: StockVerificationWithRelations[] = [
      {
        id: 'ver-001',
        hospital_id: hospitalId,
        verification_number: 'VER-2024-001',
        verification_type: 'cycle',
        location_id: 'loc-001',
        scheduled_date: '2024-03-15',
        started_at: '2024-03-15T08:00:00Z',
        completed_at: '2024-03-15T12:00:00Z',
        status: 'completed',
        performed_by: 'user-003',
        approved_by: 'user-002',
        created_at: '2024-03-10T00:00:00Z',
        location: mockStockLocations[0],
      },
      {
        id: 'ver-002',
        hospital_id: hospitalId,
        verification_number: 'VER-2024-002',
        verification_type: 'spot',
        location_id: 'loc-002',
        scheduled_date: '2024-03-25',
        status: 'scheduled',
        created_at: '2024-03-20T00:00:00Z',
        location: mockStockLocations[1],
      },
    ]

    if (filter?.status) {
      verifications = verifications.filter(v => v.status === filter.status)
    }

    if (filter?.verification_type) {
      verifications = verifications.filter(v => v.verification_type === filter.verification_type)
    }

    if (filter?.location_id) {
      verifications = verifications.filter(v => v.location_id === filter.location_id)
    }

    const total = verifications.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = verifications.slice(start, start + pageSize)

    return {
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages,
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
    await new Promise(resolve => setTimeout(resolve, 500))

    const newVerification: StockVerification = {
      id: `ver-${Date.now()}`,
      hospital_id: hospitalId,
      verification_number: `VER-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      verification_type: data.verification_type,
      location_id: data.location_id,
      scheduled_date: data.scheduled_date,
      status: 'scheduled',
      notes: data.notes,
      created_at: new Date().toISOString(),
    }

    return { data: newVerification, error: null }
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
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      data: {
        id: verificationId,
        hospital_id: 'hosp-001',
        verification_number: 'VER-2024-003',
        verification_type: 'cycle',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        performed_by: userId,
        created_at: new Date().toISOString(),
      },
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
    await new Promise(resolve => setTimeout(resolve, 500))

    const verificationItems: StockVerificationItem[] = items.map((item, index) => ({
      id: `vi-${Date.now()}-${index}`,
      verification_id: verificationId,
      item_type: item.item_type,
      item_id: item.item_id,
      batch_id: item.batch_id,
      system_quantity: item.system_quantity,
      counted_quantity: item.counted_quantity,
      variance: item.counted_quantity - item.system_quantity,
      variance_reason: item.variance_reason,
      adjustment_approved: false,
      created_at: new Date().toISOString(),
    }))

    return { data: verificationItems, error: null }
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
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      data: {
        id: verificationId,
        hospital_id: 'hosp-001',
        verification_number: 'VER-2024-003',
        verification_type: 'cycle',
        status: 'completed',
        completed_at: new Date().toISOString(),
        approved_by: approverId,
        created_at: new Date().toISOString(),
      },
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

