/**
 * Pharmacy Oxygen Management Service
 * Handles medical oxygen cylinder tracking and consumption
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  OxygenCylinder,
  OxygenCylinderWithRelations,
  OxygenCylinderTypeInfo,
  OxygenConsumption,
  OxygenConsumptionWithRelations,
  OxygenSummary,
} from '@/types/pharmacy'
import {
  mockOxygenCylinders,
  mockOxygenCylinderTypes,
} from './mockData'

/**
 * Get all oxygen cylinders
 */
export async function getOxygenCylinders(
  hospitalId: string,
  filter?: {
    status?: string
    type_id?: string
    location_id?: string
    assigned_ward_id?: string
  },
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<OxygenCylinderWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_oxygen_cylinders')
        .select(
          `
          *,
          type_info:pharmacy_oxygen_cylinder_types(*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)

      if (filter?.status) {
        query = query.eq('status', filter.status)
      }

      if (filter?.type_id) {
        query = query.eq('type_id', filter.type_id)
      }

      if (filter?.location_id) {
        query = query.eq('current_location_id', filter.location_id)
      }

      if (filter?.assigned_ward_id) {
        query = query.eq('assigned_ward_id', filter.assigned_ward_id)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('serial_number', { ascending: true })
        .range(from, to)

      if (error) throw error

      const rows = (data || []) as OxygenCylinderWithRelations[]

      return {
        data: {
          data: rows,
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        error: null,
      }
    }

    // Fallback to mock data when Supabase is not configured
    let cylinders = [...mockOxygenCylinders]

    if (filter?.status) {
      cylinders = cylinders.filter(c => c.status === filter.status)
    }

    if (filter?.type_id) {
      cylinders = cylinders.filter(c => c.type_id === filter.type_id)
    }

    if (filter?.location_id) {
      cylinders = cylinders.filter(c => c.current_location_id === filter.location_id)
    }

    if (filter?.assigned_ward_id) {
      cylinders = cylinders.filter(c => c.assigned_ward_id === filter.assigned_ward_id)
    }

    const total = cylinders.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = cylinders.slice(start, start + pageSize)

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
    console.error('Error fetching oxygen cylinders:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen cylinders',
    }
  }
}

/**
 * Get single oxygen cylinder by ID
 */
export async function getOxygenCylinderById(
  cylinderId: string
): Promise<ApiResponse<OxygenCylinderWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinders')
        .select(
          `
          *,
          type_info:pharmacy_oxygen_cylinder_types(*)
        `
        )
        .eq('id', cylinderId)
        .single()

      if (error) {
        if ((error as any).code === 'PGRST116') {
          return { data: null, error: 'Oxygen cylinder not found' }
        }
        throw error
      }

      return { data: data as unknown as OxygenCylinderWithRelations, error: null }
    }

    const cylinder = mockOxygenCylinders.find(c => c.id === cylinderId)
    
    if (!cylinder) {
      return { data: null, error: 'Oxygen cylinder not found' }
    }

    return { data: cylinder, error: null }
  } catch (error) {
    console.error('Error fetching oxygen cylinder:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen cylinder',
    }
  }
}

/**
 * Get oxygen cylinder types
 */
export async function getOxygenCylinderTypes(): Promise<ApiResponse<OxygenCylinderTypeInfo[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinder_types')
        .select('*')
        .order('type_code', { ascending: true })

      if (error) throw error

      return { data: (data || []) as OxygenCylinderTypeInfo[], error: null }
    }

    return { data: mockOxygenCylinderTypes, error: null }
  } catch (error) {
    console.error('Error fetching oxygen cylinder types:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen cylinder types',
    }
  }
}

/**
 * Update oxygen cylinder status
 */
export async function updateOxygenCylinderStatus(
  cylinderId: string,
  status: 'full' | 'empty' | 'in_use' | 'maintenance' | 'disposed',
  locationId?: string,
  assignedWardId?: string
): Promise<ApiResponse<OxygenCylinder>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinders')
        .update({
          status,
          current_location_id: locationId,
          assigned_ward_id: assignedWardId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cylinderId)
        .select('*')
        .single()

      if (error) throw error

      return { data: data as OxygenCylinder, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const cylinder = mockOxygenCylinders.find(c => c.id === cylinderId)
    if (!cylinder) {
      return { data: null, error: 'Oxygen cylinder not found' }
    }

    const updated: OxygenCylinder = {
      ...cylinder,
      status,
      current_location_id: locationId || cylinder.current_location_id,
      assigned_ward_id: assignedWardId || cylinder.assigned_ward_id,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error updating oxygen cylinder status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update oxygen cylinder status',
    }
  }
}

/**
 * Record oxygen consumption
 */
export async function recordOxygenConsumption(
  hospitalId: string,
  departmentId: string,
  userId: string,
  cylinderId: string | undefined,
  quantityUsed: number,
  unit: 'liters' | 'cylinders',
  notes?: string
): Promise<ApiResponse<OxygenConsumption>> {
  try {
    if (isSupabaseConfigured()) {
      const today = new Date().toISOString().split('T')[0]

      const { data: inserted, error } = await supabase
        .from('pharmacy_oxygen_consumption')
        .insert({
          hospital_id: hospitalId,
          cylinder_id: cylinderId,
          department_id: departmentId,
          consumption_date: today,
          quantity_used: quantityUsed,
          unit,
          recorded_by: userId,
          notes,
        })
        .select('*')
        .single()

      if (error) throw error

      return { data: inserted as OxygenConsumption, error: null }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const newConsumption: OxygenConsumption = {
      id: `oc-${Date.now()}`,
      hospital_id: hospitalId,
      cylinder_id: cylinderId,
      department_id: departmentId,
      consumption_date: new Date().toISOString().split('T')[0],
      quantity_used: quantityUsed,
      unit,
      recorded_by: userId,
      notes,
      created_at: new Date().toISOString(),
    }

    return { data: newConsumption, error: null }
  } catch (error) {
    console.error('Error recording oxygen consumption:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to record oxygen consumption',
    }
  }
}

/**
 * Get oxygen consumption history
 */
export async function getOxygenConsumptionHistory(
  hospitalId: string,
  filter?: {
    department_id?: string
    cylinder_id?: string
    date_from?: string
    date_to?: string
  }
): Promise<ApiResponse<OxygenConsumptionWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_oxygen_consumption')
        .select('*')
        .eq('hospital_id', hospitalId)

      if (filter?.department_id) {
        query = query.eq('department_id', filter.department_id)
      }

      if (filter?.cylinder_id) {
        query = query.eq('cylinder_id', filter.cylinder_id)
      }

      if (filter?.date_from) {
        query = query.gte('consumption_date', filter.date_from)
      }

      if (filter?.date_to) {
        query = query.lte('consumption_date', filter.date_to)
      }

      const { data, error } = await query
        .order('consumption_date', { ascending: false })

      if (error) throw error

      return { data: (data || []) as OxygenConsumptionWithRelations[], error: null }
    }

    // Simple mock history when Supabase is not configured
    const consumption: OxygenConsumptionWithRelations[] = []

    return { data: consumption, error: null }
  } catch (error) {
    console.error('Error fetching oxygen consumption history:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen consumption history',
    }
  }
}

/**
 * Get oxygen summary statistics
 */
export async function getOxygenSummary(hospitalId: string): Promise<ApiResponse<OxygenSummary>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: cylinders, error } = await supabase
        .from('pharmacy_oxygen_cylinders')
        .select('*')
        .eq('hospital_id', hospitalId)

      if (error) throw error

      const list = (cylinders || []) as OxygenCylinder[]

      // Simple summary; detailed analytics can be added later
      const summary: OxygenSummary = {
        total_cylinders: list.length,
        full_cylinders: list.filter(c => c.status === 'full').length,
        empty_cylinders: list.filter(c => c.status === 'empty').length,
        in_use_cylinders: list.filter(c => c.status === 'in_use').length,
        maintenance_cylinders: list.filter(c => c.status === 'maintenance').length,
        cylinders_by_type: [
          { type: 'B', count: list.filter(c => (c as any).type_info?.type_code === 'B').length },
          { type: 'D', count: list.filter(c => (c as any).type_info?.type_code === 'D').length },
          { type: 'E', count: list.filter(c => (c as any).type_info?.type_code === 'E').length },
          { type: 'M', count: list.filter(c => (c as any).type_info?.type_code === 'M').length },
        ],
        daily_consumption: 0,
        monthly_consumption: 0,
      }

      return { data: summary, error: null }
    }

    const cylinders = mockOxygenCylinders

    const summary: OxygenSummary = {
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
      daily_consumption: 45,
      monthly_consumption: 1350,
    }

    return { data: summary, error: null }
  } catch (error) {
    console.error('Error fetching oxygen summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen summary',
    }
  }
}

/**
 * Get cylinders requiring maintenance
 */
export async function getCylindersRequiringMaintenance(
  hospitalId: string
): Promise<ApiResponse<OxygenCylinderWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      const today = new Date()
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const cutoff = thirtyDaysFromNow.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinders')
        .select('*')
        .eq('hospital_id', hospitalId)
        .lte('next_maintenance_date', cutoff)

      if (error) throw error

      return { data: (data || []) as OxygenCylinderWithRelations[], error: null }
    }

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    const cylinders = mockOxygenCylinders.filter(c => {
      if (!c.next_maintenance_date) return false
      const maintenanceDate = new Date(c.next_maintenance_date)
      return maintenanceDate <= thirtyDaysFromNow
    })

    return { data: cylinders, error: null }
  } catch (error) {
    console.error('Error fetching cylinders requiring maintenance:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch cylinders requiring maintenance',
    }
  }
}

