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
  OxygenPricingConfig,
  OxygenSystemSettings,
  OxygenReceptionRecord,
  OxygenReceptionItem,
  OxygenFinancialSummary,
  OxygenReturnDocument,
  OxygenReturnDocumentItem,
  OxygenReturnDocumentWithRelations,
  OxygenRequestDocument,
  OxygenRequestDocumentItem,
  OxygenRequestDocumentWithRelations,
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
  pageSize: number = 100
): Promise<ApiResponse<PaginatedResponse<OxygenCylinderWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select(
          `
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*),
          department:departments(*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)

      if (filter?.status) {
        query = query.eq('status', filter.status)
      }

      if (filter?.type_id) {
        query = query.eq('cylinder_type_id', filter.type_id)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('serial_number', { ascending: true })
        .range(from, to)

      if (error) throw error

      const rows = (data || []).map((row: any) => ({
        ...row,
        // Adapt standard field names for components
        type_info: {
          ...row.type_info,
          type_name: row.size_info 
            ? `${row.is_loan ? 'Loan' : 'Standard'} ${row.size_info.code} (${row.size_info.capacity}M³)`
            : row.type_info?.name || 'Standard Cylinder'
        },
        current_location: {
          location_name: row.current_location || 'Central Store'
        },
        assigned_ward: row.department ? {
          department_name: row.department.department_name || row.department.name
        } : null
      })) as unknown as OxygenCylinderWithRelations[]

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
        .select(`
          *,
          cylinder:pharmacy_oxygen_cylinders(*),
          department:departments(*)
        `)
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
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*), type_info:pharmacy_oxygen_cylinder_types(*)')
        .eq('hospital_id', hospitalId)

      if (error) throw error

      const list = (cylinders || []) as any[]

      // Calculate summaries based on actual statuses
      const summary: OxygenSummary = {
        total_cylinders: list.length,
        full_cylinders: list.filter(c => c.status === 'available').length,
        empty_cylinders: list.filter(c => c.status === 'returned_to_supplier').length,
        in_use_cylinders: list.filter(c => c.status === 'issued').length,
        maintenance_cylinders: 0, // No maintenance status exists in active DB
        cylinders_by_type: [
          { type: 'B', count: list.filter(c => c.type_info?.code === 'BN').length },
          { type: 'D', count: list.filter(c => c.size_info?.code === 'P101-D').length },
          { type: 'E', count: list.filter(c => c.size_info?.code === 'P101-E').length },
          { type: 'M', count: 0 },
        ],
        daily_consumption: 45,
        monthly_consumption: 1350,
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

/**
 * Get oxygen financial summary KPIs (Total Allocation, Total Expenses, Liabilities, Current Balance, Loan Charges)
 */
export async function getOxygenFinancialSummary(
  hospitalId: string
): Promise<ApiResponse<OxygenFinancialSummary>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Get Allocation from Warrants
      const { data: warrants, error: wError } = await supabase
        .from('pharmacy_warrants')
        .select('amount')
        .eq('hospital_id', hospitalId)
        .eq('category', 'medical_oxygen')

      if (wError) throw wError

      const totalAllocation = (warrants || []).reduce((sum, w) => sum + Number(w.amount), 0)

      // 2. Get Receptions expenses and loan charges
      const { data: receptions, error: rError } = await supabase
        .from('pharmacy_oxygen_reception_records')
        .select('refill_amount, loan_amount, total_amount, status')
        .eq('hospital_id', hospitalId)

      if (rError) throw rError

      let totalExpenses = 0
      let liabilities = 0
      let loanCharges = 0

      ;(receptions || []).forEach((rec) => {
        const refill = Number(rec.refill_amount || 0)
        const loan = Number(rec.loan_amount || 0)
        const total = Number(rec.total_amount || 0)

        if (rec.status === 'completed') {
          totalExpenses += refill
          loanCharges += loan
        } else {
          // Liabilities include receptions that are pending invoice, outstanding POs, etc.
          liabilities += total
        }
      })

      // Current Balance = Allocation - (Expenses + Liabilities)
      const currentBalance = totalAllocation - (totalExpenses + liabilities)

      return {
        data: {
          total_allocation: totalAllocation,
          total_expenses: totalExpenses,
          liabilities,
          current_balance: currentBalance,
          loan_charges: loanCharges,
        },
        error: null,
      }
    }

    // Mock data fallback
    return {
      data: {
        total_allocation: 274000.0,
        total_expenses: 261037.7,
        liabilities: 0.0,
        current_balance: -2717.14,
        loan_charges: 15679.44,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching oxygen financial summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen financial summary',
    }
  }
}

/**
 * Get active cylinder pricing configuration
 */
export async function getOxygenLatestPricing(
  hospitalId: string
): Promise<ApiResponse<OxygenPricingConfig[]>> {
  try {
    if (isSupabaseConfigured()) {
      // Query distinct on cylinder_size_code, ordered by effective_from DESC, created_at DESC
      // To get the latest active price for each size code.
      const { data, error } = await supabase
        .from('pharmacy_oxygen_pricing_config')
        .select('*')
        .or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
        .order('cylinder_size_code')
        .order('effective_from', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Manual distinct filter in TS since Postgres DISTINCT ON needs specific order in client queries
      const uniqueConfigs: Record<string, OxygenPricingConfig> = {}
      ;(data || []).forEach((row: any) => {
        if (!uniqueConfigs[row.cylinder_size_code]) {
          uniqueConfigs[row.cylinder_size_code] = {
            ...row,
            refill_price: Number(row.refill_price),
          }
        }
      })

      return { data: Object.values(uniqueConfigs), error: null }
    }

    // Mock prices
    const mockPricing: OxygenPricingConfig[] = [
      { id: '1', hospital_id: hospitalId, cylinder_size_code: 'P101-D', refill_price: 114.50, effective_from: '2026-03-30', created_at: '' },
      { id: '2', hospital_id: hospitalId, cylinder_size_code: 'P101-E', refill_price: 131.10, effective_from: '2026-03-30', created_at: '' },
      { id: '3', hospital_id: hospitalId, cylinder_size_code: 'P101-F', refill_price: 117.20, effective_from: '2026-03-30', created_at: '' },
      { id: '4', hospital_id: hospitalId, cylinder_size_code: 'P101-HS', refill_price: 138.60, effective_from: '2026-03-30', created_at: '' },
      { id: '5', hospital_id: hospitalId, cylinder_size_code: '101-F', refill_price: 117.20, effective_from: '2026-03-30', created_at: '' },
      { id: '6', hospital_id: hospitalId, cylinder_size_code: '101-N', refill_price: 284.90, effective_from: '2026-03-30', created_at: '' },
    ]

    return { data: mockPricing, error: null }
  } catch (error) {
    console.error('Error fetching oxygen pricing:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen pricing',
    }
  }
}

/**
 * Update cylinder prices (insert new pricing configuration rows to preserve history)
 */
export async function updateCylinderPrices(
  hospitalId: string,
  prices: { size_code: string; refill_price: number }[],
  effectiveFrom: string,
  userId: string
): Promise<ApiResponse<OxygenPricingConfig[]>> {
  try {
    if (isSupabaseConfigured()) {
      const rows = prices.map((p) => ({
        hospital_id: hospitalId,
        cylinder_size_code: p.size_code,
        refill_price: p.refill_price,
        effective_from: effectiveFrom,
        created_by: userId,
      }))

      const { data, error } = await supabase
        .from('pharmacy_oxygen_pricing_config')
        .insert(rows)
        .select('*')

      if (error) throw error

      return { data: (data || []) as OxygenPricingConfig[], error: null }
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    return { data: [], error: null }
  } catch (error) {
    console.error('Error updating cylinder prices:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update cylinder prices',
    }
  }
}

/**
 * Get full history of oxygen pricing configurations
 */
export async function getOxygenPricingHistory(
  hospitalId: string
): Promise<ApiResponse<any[]>> {
  try {
    if (isSupabaseConfigured()) {
      // Try to select with joined creator
      const { data, error } = await supabase
        .from('pharmacy_oxygen_pricing_config')
        .select('*, creator:users(id, full_name, email, jawatan)')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Direct join failed, falling back to separate queries for users:', error)
        // If join fails due to complex foreign keys or RLS, select without join
        const { data: dataNoJoin, error: errorNoJoin } = await supabase
          .from('pharmacy_oxygen_pricing_config')
          .select('*')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })

        if (errorNoJoin) throw errorNoJoin

        // Fetch users separately
        const userIds = Array.from(new Set((dataNoJoin || []).map(row => row.created_by).filter(Boolean)))
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email, jawatan')
            .in('id', userIds)
          
          if (!usersError && users) {
            const userMap = new Map(users.map(u => [u.id, u]))
            const enriched = dataNoJoin.map(row => ({
              ...row,
              creator: userMap.get(row.created_by) || null
            }))
            return { data: enriched, error: null }
          }
        }

        return { data: dataNoJoin || [], error: null }
      }

      return { data: data || [], error: null }
    }

    // Mock pricing history fallback when Supabase is not configured
    const mockPricingHistory = [
      { id: '1', hospital_id: hospitalId, cylinder_size_code: 'P101-D', refill_price: 114.50, effective_from: '2026-03-30', created_at: '2026-03-30T10:00:00Z', creator: { full_name: 'Dr. Mohd Faisal', email: 'faisal@kkm.gov.my', jawatan: 'Pegawai Perolehan' } },
      { id: '2', hospital_id: hospitalId, cylinder_size_code: 'P101-E', refill_price: 131.10, effective_from: '2026-03-30', created_at: '2026-03-30T10:00:00Z', creator: { full_name: 'Dr. Mohd Faisal', email: 'faisal@kkm.gov.my', jawatan: 'Pegawai Perolehan' } },
      { id: '3', hospital_id: hospitalId, cylinder_size_code: 'P101-F', refill_price: 117.20, effective_from: '2026-03-30', created_at: '2026-03-30T10:00:00Z', creator: { full_name: 'Dr. Mohd Faisal', email: 'faisal@kkm.gov.my', jawatan: 'Pegawai Perolehan' } },
      { id: '4', hospital_id: hospitalId, cylinder_size_code: 'P101-HS', refill_price: 138.60, effective_from: '2026-03-30', created_at: '2026-03-30T10:00:00Z', creator: { full_name: 'Dr. Mohd Faisal', email: 'faisal@kkm.gov.my', jawatan: 'Pegawai Perolehan' } },
      { id: '5', hospital_id: hospitalId, cylinder_size_code: '101-F', refill_price: 117.20, effective_from: '2026-03-30', created_at: '2026-03-30T10:00:00Z', creator: { full_name: 'Dr. Mohd Faisal', email: 'faisal@kkm.gov.my', jawatan: 'Pegawai Perolehan' } },
      { id: '6', hospital_id: hospitalId, cylinder_size_code: '101-N', refill_price: 284.90, effective_from: '2026-03-30', created_at: '2026-03-30T10:00:00Z', creator: { full_name: 'Dr. Mohd Faisal', email: 'faisal@kkm.gov.my', jawatan: 'Pegawai Perolehan' } },
    ]
    return { data: mockPricingHistory, error: null }
  } catch (error) {
    console.error('Error fetching oxygen pricing history:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen pricing history',
    }
  }
}

/**
 * Get past oxygen reception records
 */
export async function getOxygenReceptionsList(
  hospitalId: string
): Promise<ApiResponse<OxygenReceptionRecord[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_reception_records')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('reception_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const grouped: Record<string, any> = {}
      ;(data || []).forEach((row: any) => {
        const date = row.reception_date
        const refill = Number(row.refill_amount)
        const loan = Number(row.loan_amount)
        const total = Number(row.total_amount || (refill + loan))

        if (!grouped[date]) {
          grouped[date] = {
            ...row,
            ids: [row.id],
            refill_amount: refill,
            loan_amount: loan,
            total_amount: total,
            delivery_order_nos: [row.delivery_order_no],
            sales_order_nos: row.sales_order_no ? [row.sales_order_no] : [],
          }
        } else {
          grouped[date].ids.push(row.id)
          grouped[date].refill_amount += refill
          grouped[date].loan_amount += loan
          grouped[date].total_amount += total
          if (row.delivery_order_no && !grouped[date].delivery_order_nos.includes(row.delivery_order_no)) {
            grouped[date].delivery_order_nos.push(row.delivery_order_no)
          }
          if (row.sales_order_no && !grouped[date].sales_order_nos.includes(row.sales_order_no)) {
            grouped[date].sales_order_nos.push(row.sales_order_no)
          }
          if (row.status === 'completed') {
            grouped[date].status = 'completed'
          }
        }
      })

      const combinedData = Object.values(grouped).map((row: any) => ({
        ...row,
        delivery_order_no: row.delivery_order_nos.join(' / '),
        sales_order_no: row.sales_order_nos.join(' / '),
      })) as OxygenReceptionRecord[]

      return {
        data: combinedData,
        error: null,
      }
    }

    // Mock receptions fallback
    const mockReceptions: OxygenReceptionRecord[] = [
      { id: 'r1', hospital_id: hospitalId, reception_date: '2026-05-18', delivery_order_no: '0238333719', sales_order_no: '132963488', refill_amount: 1804.50, loan_amount: 0, total_amount: 1804.50, vote_code: '080702', vote_activity: '27402', status: 'completed', created_at: '' },
      { id: 'r2', hospital_id: hospitalId, reception_date: '2026-04-16', delivery_order_no: '0238206047', sales_order_no: '132862148', refill_amount: 7221.60, loan_amount: 605.88, total_amount: 7827.48, vote_code: '080702', vote_activity: '27402', status: 'completed', created_at: '' },
    ]

    return { data: mockReceptions, error: null }
  } catch (error) {
    console.error('Error fetching oxygen receptions list:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen receptions list',
    }
  }
}

/**
 * Get oxygen system settings (such as loan rate)
 */
export async function getOxygenSystemSettings(
  hospitalId: string
): Promise<ApiResponse<OxygenSystemSettings>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_system_settings')
        .select('*')
        .eq('hospital_id', hospitalId)
        .single()

      if (error) {
        if ((error as any).code === 'PGRST116') {
          // If not exists, insert a default row
          const { data: inserted, error: iError } = await supabase
            .from('pharmacy_oxygen_system_settings')
            .insert({ hospital_id: hospitalId, loan_cylinder_rate: 18.36 })
            .select('*')
            .single()
          if (iError) throw iError
          return { data: { ...inserted, loan_cylinder_rate: Number(inserted.loan_cylinder_rate) } as OxygenSystemSettings, error: null }
        }
        throw error
      }

      return { data: { ...data, loan_cylinder_rate: Number(data.loan_cylinder_rate) } as OxygenSystemSettings, error: null }
    }

    return { data: { id: 's1', hospital_id: hospitalId, loan_cylinder_rate: 18.36, created_at: '', updated_at: '' }, error: null }
  } catch (error) {
    console.error('Error fetching oxygen system settings:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch oxygen system settings',
    }
  }
}

/**
 * Create a new oxygen reception record with received items in a transaction
 */
export async function createOxygenReceptionRecord(
  hospitalId: string,
  recordData: Omit<OxygenReceptionRecord, 'id' | 'hospital_id' | 'created_at'>,
  items: Omit<OxygenReceptionItem, 'id' | 'reception_id' | 'created_at'>[],
  userId: string
): Promise<ApiResponse<OxygenReceptionRecord>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Insert the main reception record
      const { data: reception, error: rError } = await supabase
        .from('pharmacy_oxygen_reception_records')
        .insert({
          hospital_id: hospitalId,
          reception_date: recordData.reception_date,
          delivery_order_no: recordData.delivery_order_no,
          sales_order_no: recordData.sales_order_no,
          refill_amount: recordData.refill_amount,
          loan_amount: recordData.loan_amount,
          vote_code: recordData.vote_code,
          vote_activity: recordData.vote_activity,
          status: recordData.status,
          created_by: userId,
        })
        .select('*')
        .single()

      if (rError) throw rError

      const receptionId = reception.id

      // 2. Insert items
      if (items.length > 0) {
        const itemRows = items.map((itm) => ({
          reception_id: receptionId,
          cylinder_id: itm.cylinder_id || null,
          cylinder_size_id: itm.cylinder_size_id,
          cylinder_type_id: itm.cylinder_type_id,
          unit_price: itm.unit_price,
        }))

        const { error: iError } = await supabase
          .from('pharmacy_oxygen_reception_items')
          .insert(itemRows)

        if (iError) throw iError
      }

      return { data: reception as OxygenReceptionRecord, error: null }
    }

    await new Promise((resolve) => setTimeout(resolve, 800))
    const mockCreated: OxygenReceptionRecord = {
      id: `r-${Date.now()}`,
      hospital_id: hospitalId,
      ...recordData,
      created_at: new Date().toISOString(),
    }
    return { data: mockCreated, error: null }
  } catch (error) {
    console.error('Error creating oxygen reception:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to record oxygen delivery',
    }
  }
}

/**
 * Aggregates cylinder counts grouped by cylinder_size_id (combos) × status × location
 */
export async function getCylinderInventoryByType(
  hospitalId: string
): Promise<ApiResponse<{
  combo_id: string
  display_name: string
  available: number
  in_use: number
  empty: number
  returned: number
  total: number
}[]>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch active combos
      const { data: combos, error: comboError } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (comboError) throw comboError

      // 2. Fetch inventory
      const { data: inventory, error: invError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('cylinder_size_id, cylinder_type_id, status, current_location, updated_at')
        .eq('hospital_id', hospitalId)

      if (invError) throw invError

      const now = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)

      const results = (combos || []).map((combo: any) => {
        const matchingCylinders = (inventory || []).filter(
          (c: any) => c.cylinder_size_id === combo.size_id && c.cylinder_type_id === combo.type_id
        )

        let available = 0
        let in_use = 0
        let empty = 0
        let returned = 0

        matchingCylinders.forEach((c: any) => {
          const loc = (c.current_location || '').toLowerCase()
          if (c.status === 'available' && (loc === 'store' || loc === 'pharmacy store')) {
            available++
          } else if (c.status === 'returned_to_supplier' || loc === 'supplier') {
            returned++
          } else if (c.status === 'issued') {
            if (loc === 'store' || loc === 'pharmacy store') {
              empty++
            } else {
              // Time-based heuristic for empty vs in-use in department
              const updatedAt = new Date(c.updated_at)
              if (updatedAt < thirtyDaysAgo) {
                empty++
              } else {
                in_use++
              }
            }
          } else {
            // Default fallback
            available++
          }
        })

        return {
          combo_id: combo.id,
          display_name: combo.display_name,
          available,
          in_use,
          empty,
          returned,
          total: matchingCylinders.length
        }
      })

      return { data: results, error: null }
    }

    // Fallback if supabase not configured (never used, but for typescript)
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching aggregated cylinder inventory:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch cylinder inventory aggregates',
    }
  }
}

/**
 * Groups issued/available cylinders by department for the Unit Monitor
 */
export async function getCylindersByDepartment(
  hospitalId: string
): Promise<ApiResponse<{
  department_id: string
  department_name: string
  in_use: number
  available: number
  total: number
  status: 'OK' | 'Low' | 'Critical'
  cylinders: {
    id: string
    serial_number: string
    qr_code: string
    display_name: string
    status: string
    updated_at: string
  }[]
  requests?: {
    id: string
    request_number: string
    status: string
    created_at: string
    items: {
      size_code: string
      quantity: number
      quantity_issued: number
    }[]
  }[]
}[]>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch departments
      const { data: depts, error: deptError } = await supabase
        .from('departments')
        .select('id, department_name')

      if (deptError) throw deptError

      // Fetch combos for display name mapping
      const { data: combos, error: comboError } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('size_id, type_id, display_name')

      if (comboError) throw comboError

      const comboMap = new Map<string, string>()
      ;(combos || []).forEach((c: any) => {
        comboMap.set(`${c.size_id}_${c.type_id}`, c.display_name)
      })

      // Fetch sizes for code mapping
      const { data: sizes } = await supabase
        .from('pharmacy_oxygen_cylinder_sizes')
        .select('id, code')

      const sizeMap = new Map<string, string>()
      ;(sizes || []).forEach((s: any) => {
        sizeMap.set(s.id, s.code)
      })

      // 2. Fetch inventory where department_id is not null
      const { data: inventory, error: invError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select(`
          id,
          serial_number,
          qr_code,
          status,
          updated_at,
          department_id,
          cylinder_size_id,
          cylinder_type_id
        `)
        .eq('hospital_id', hospitalId)
        .not('department_id', 'is', null)

      if (invError) throw invError

      const deptMap: { [key: string]: any[] } = {}
      ;(inventory || []).forEach((c: any) => {
        if (!deptMap[c.department_id]) {
          deptMap[c.department_id] = []
        }
        const displayName = comboMap.get(`${c.cylinder_size_id}_${c.cylinder_type_id}`) || 'Unknown Type'
        deptMap[c.department_id].push({
          id: c.id,
          serial_number: c.serial_number,
          qr_code: c.qr_code,
          display_name: displayName,
          status: c.status,
          updated_at: c.updated_at
        })
      })

      // 3. Fetch requests for this hospital
      const { data: deptRequests, error: reqError } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .select(`
          id,
          request_id,
          status,
          created_at,
          department_id,
          items:pharmacy_oxygen_dept_request_items(
            id,
            cylinder_size_id,
            quantity,
            quantity_issued
          )
        `)
        .eq('hospital_id', hospitalId)

      if (reqError) throw reqError

      const requestsByDept: { [key: string]: any[] } = {}
      ;(deptRequests || []).forEach((r: any) => {
        if (!requestsByDept[r.department_id]) {
          requestsByDept[r.department_id] = []
        }
        const mappedItems = (r.items || []).map((itm: any) => ({
          size_code: sizeMap.get(itm.cylinder_size_id) || 'Unknown Size',
          quantity: itm.quantity,
          quantity_issued: itm.quantity_issued || 0
        }))
        requestsByDept[r.department_id].push({
          id: r.id,
          request_number: r.request_id,
          status: r.status,
          created_at: r.created_at,
          items: mappedItems
        })
      })

      const results = (depts || [])
        .map((d: any) => {
          const cylinders = deptMap[d.id] || []
          const requests = requestsByDept[d.id] || []

          if (cylinders.length === 0 && requests.length === 0) return null

          const in_use = cylinders.filter((c: any) => c.status === 'issued').length
          const available = cylinders.filter((c: any) => c.status === 'available').length
          const total = cylinders.length

          // Determine department status
          let status: 'OK' | 'Low' | 'Critical' = 'OK'
          if (total > 0) {
            const availRatio = available / total
            if (availRatio === 0) {
              status = 'Critical'
            } else if (availRatio < 0.25) {
              status = 'Low'
            }
          } else if (requests.some(r => r.status === 'pending' || r.status === 'approved')) {
            // If they have pending requests but no cylinders allocated yet
            status = 'Critical'
          }

          return {
            department_id: d.id,
            department_name: d.department_name || d.name,
            in_use,
            available,
            total,
            status,
            cylinders,
            requests
          }
        })
        .filter(Boolean) as any[]

      return { data: results, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching cylinders by department:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch cylinders by department',
    }
  }
}

/**
 * Calculates store usage balance ledger per cylinder type using movement history
 */
export async function getStoreUsageBalance(
  hospitalId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<{
  combo_id: string
  display_name: string
  opening: number
  received: number
  issued: number
  returned: number
  closing: number
}[]>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch combos
      const { data: combos, error: comboError } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (comboError) throw comboError

      // 2. Fetch all movements for hospital
      const { data: movements, error: movError } = await supabase
        .from('pharmacy_oxygen_cylinder_movements')
        .select(`
          id,
          moved_at,
          movement_type,
          from_location,
          to_location,
          cylinder:pharmacy_oxygen_cylinder_inventory(cylinder_size_id, cylinder_type_id)
        `)
        .eq('hospital_id', hospitalId)

      if (movError) throw movError

      // 3. Fetch current available count in Store
      const { data: currentInventory, error: invError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('cylinder_size_id, cylinder_type_id, status, current_location')
        .eq('hospital_id', hospitalId)

      if (invError) throw invError

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30))
      const end = endDate ? new Date(endDate) : new Date()

      const results = (combos || []).map((combo: any) => {
        // Filter current available in store
        const currentAvailable = (currentInventory || []).filter(
          (c: any) => c.cylinder_size_id === combo.size_id && 
                      c.cylinder_type_id === combo.type_id && 
                      c.status === 'available' && 
                      (c.current_location || '').toLowerCase().includes('store')
        ).length

        // Filter movements after end date (to compute closing balance back to end date)
        const postEndMovements = (movements || []).filter((m: any) => {
          if (!m.cylinder || m.cylinder.cylinder_size_id !== combo.size_id || m.cylinder.cylinder_type_id !== combo.type_id) return false
          const moveDate = new Date(m.moved_at)
          return moveDate > end
        })

        // Filter movements within range
        const rangeMovements = (movements || []).filter((m: any) => {
          if (!m.cylinder || m.cylinder.cylinder_size_id !== combo.size_id || m.cylinder.cylinder_type_id !== combo.type_id) return false
          const moveDate = new Date(m.moved_at)
          return moveDate >= start && moveDate <= end
        })

        // Reverse account from Now to End to get Closing Balance at End Date
        let closing = currentAvailable
        postEndMovements.forEach((m: any) => {
          const type = m.movement_type
          const from = (m.from_location || '').toLowerCase()
          const to = (m.to_location || '').toLowerCase()

          if (type === 'received' || to.includes('store')) {
            closing--
          }
          if (type === 'issued' || from.includes('store')) {
            closing++
          }
        })

        // Compute aggregates inside the selected range
        let received = 0
        let issued = 0
        let returned = 0

        rangeMovements.forEach((m: any) => {
          const type = m.movement_type
          const from = (m.from_location || '').toLowerCase()
          const to = (m.to_location || '').toLowerCase()

          if (type === 'received' || to.includes('store')) {
            received++
          } else if (type === 'issued' || from.includes('store')) {
            issued++
          } else if (type === 'sent_to_supplier' || (from.includes('store') && to.includes('supplier'))) {
            returned++
          }
        })

        // Opening = Closing - Received + Issued
        const opening = Math.max(0, closing - received + issued)

        return {
          combo_id: combo.id,
          display_name: combo.display_name,
          opening,
          received,
          issued,
          returned,
          closing
        }
      })

      return { data: results, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error calculating store usage balance:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate store usage balance',
    }
  }
}

/**
 * Lists return documents for a hospital
 */
export async function getReturnDocuments(
  hospitalId: string
): Promise<ApiResponse<OxygenReturnDocumentWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .select(`
          *,
          supplier:suppliers(id, company_name, supplier_code),
          items:pharmacy_oxygen_return_document_items(
            id,
            cylinder:pharmacy_oxygen_cylinder_inventory(
              id,
              serial_number,
              qr_code,
              cylinder_size_id,
              cylinder_type_id
            )
          )
        `)
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch combos to manually map display_name
      const { data: combos } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('size_id, type_id, display_name')

      const comboMap = new Map<string, string>()
      ;(combos || []).forEach((c: any) => {
        comboMap.set(`${c.size_id}_${c.type_id}`, c.display_name)
      })

      const enriched = (data || []).map((doc: any) => ({
        ...doc,
        items: (doc.items || []).map((item: any) => {
          if (item.cylinder) {
            const displayName = comboMap.get(`${item.cylinder.cylinder_size_id}_${item.cylinder.cylinder_type_id}`) || 'Standard Cylinder'
            return {
              ...item,
              cylinder: {
                ...item.cylinder,
                combo: { display_name: displayName }
              }
            }
          }
          return item
        })
      }))

      return { data: enriched as unknown as OxygenReturnDocumentWithRelations[], error: null }
    }
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching return documents:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch return documents',
    }
  }
}

/**
 * Fetches a single return document with its items
 */
export async function getReturnDocumentById(
  documentId: string
): Promise<ApiResponse<OxygenReturnDocumentWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .select(`
          *,
          supplier:suppliers(*),
          creator:users(id, full_name),
          items:pharmacy_oxygen_return_document_items(
            id,
            cylinder:pharmacy_oxygen_cylinder_inventory(
              id,
              serial_number,
              qr_code,
              cylinder_size_id,
              cylinder_type_id
            )
          )
        `)
        .eq('id', documentId)
        .single()

      if (error) throw error

      // Fetch combos to manually map display_name
      const { data: combos } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('size_id, type_id, display_name')

      const comboMap = new Map<string, string>()
      ;(combos || []).forEach((c: any) => {
        comboMap.set(`${c.size_id}_${c.type_id}`, c.display_name)
      })

      const enriched = {
        ...data,
        items: (data.items || []).map((item: any) => {
          if (item.cylinder) {
            const displayName = comboMap.get(`${item.cylinder.cylinder_size_id}_${item.cylinder.cylinder_type_id}`) || 'Standard Cylinder'
            return {
              ...item,
              cylinder: {
                ...item.cylinder,
                combo: { display_name: displayName }
              }
            }
          }
          return item
        })
      }

      return { data: enriched as unknown as OxygenReturnDocumentWithRelations, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching return document details:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch return document details',
    }
  }
}

/**
 * Filters cylinders that are empty (status='issued') for the return document creator
 */
export async function getEmptyCylindersInStore(
  hospitalId: string
): Promise<ApiResponse<OxygenCylinderWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('hospital_id', hospitalId)
        .eq('status', 'issued')
        .order('serial_number', { ascending: true })

      if (error) throw error

      // Fetch combos to manually map display_name
      const { data: combos } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('size_id, type_id, display_name')

      const comboMap = new Map<string, string>()
      ;(combos || []).forEach((c: any) => {
        comboMap.set(`${c.size_id}_${c.type_id}`, c.display_name)
      })

      const rows = (data || []).map((row: any) => {
        const displayName = comboMap.get(`${row.cylinder_size_id}_${row.cylinder_type_id}`) || 'Standard Cylinder'
        return {
          ...row,
          type_info: {
            type_name: displayName
          },
          current_location: {
            location_name: row.current_location || 'Department'
          },
          assigned_ward: row.department ? {
            department_name: row.department.department_name || row.department.name
          } : null
        }
      }) as unknown as OxygenCylinderWithRelations[]

      return { data: rows, error: null }
    }
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching empty cylinders in store:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch empty cylinders',
    }
  }
}

/**
 * Creates a return document, updates cylinder statuses, and records movements
 */
export async function createReturnDocument(
  hospitalId: string,
  supplierId: string,
  returnDate: string,
  cylinderIds: string[],
  remarks: string,
  createdBy: string
): Promise<ApiResponse<OxygenReturnDocument>> {
  try {
    if (isSupabaseConfigured()) {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const todayStr = `${yyyy}${mm}${dd}`
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const documentNumber = `O2-RET-${todayStr}-${randomSuffix}`

      // 1. Insert Return Document
      const { data: doc, error: docError } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .insert({
          hospital_id: hospitalId,
          document_number: documentNumber,
          supplier_id: supplierId,
          status: 'completed',
          returned_date: returnDate,
          remarks: remarks || null,
          created_by: createdBy
        })
        .select('*')
        .single()

      if (docError) throw docError

      const docId = doc.id

      // 2. Fetch cylinders to get their current locations before updating
      const { data: cylinders, error: fetchError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('id, current_location, department_id')
        .in('id', cylinderIds)

      if (fetchError) throw fetchError

      // 3. Insert Items, Update Cylinders, and Log Movements
      if (cylinderIds.length > 0) {
        // Prepare items
        const itemRows = cylinderIds.map((cid) => ({
          return_document_id: docId,
          cylinder_id: cid
        }))

        const { error: itemError } = await supabase
          .from('pharmacy_oxygen_return_document_items')
          .insert(itemRows)

        if (itemError) throw itemError

        // Update each cylinder
        for (const cylinderId of cylinderIds) {
          const cyl = (cylinders || []).find((c) => c.id === cylinderId)
          const fromLoc = cyl?.current_location || 'Department'
          const deptId = cyl?.department_id || null

          // Update status to returned_to_supplier
          const { error: updateError } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update({
              status: 'returned_to_supplier',
              current_location: 'Supplier',
              department_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', cylinderId)

          if (updateError) throw updateError

          // Log movement
          const { error: moveError } = await supabase
            .from('pharmacy_oxygen_cylinder_movements')
            .insert({
              hospital_id: hospitalId,
              cylinder_id: cylinderId,
              movement_type: 'sent_to_supplier',
              from_location: fromLoc,
              to_location: 'Supplier',
              department_id: deptId,
              moved_by: createdBy,
              moved_at: new Date().toISOString(),
              remarks: `Returned via return doc ${documentNumber}. Remarks: ${remarks || ''}`
            })

          if (moveError) throw moveError
        }
      }

      return { data: doc as OxygenReturnDocument, error: null }
    }

    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error creating return document:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create return document',
    }
  }
}

/**
 * Lists request documents for a hospital
 */
export async function getRequestDocuments(
  hospitalId: string
): Promise<ApiResponse<OxygenRequestDocumentWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .select(`
          *,
          supplier:suppliers(id, company_name, supplier_code),
          items:pharmacy_oxygen_request_document_items(*)
        `)
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { data: (data || []) as unknown as OxygenRequestDocumentWithRelations[], error: null }
    }
    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching request documents:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch request documents',
    }
  }
}

/**
 * Fetches a single request document with its items
 */
export async function getRequestDocumentById(
  documentId: string
): Promise<ApiResponse<OxygenRequestDocumentWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .select(`
          *,
          supplier:suppliers(*),
          creator:users(id, full_name),
          items:pharmacy_oxygen_request_document_items(*)
        `)
        .eq('id', documentId)
        .single()

      if (error) throw error

      return { data: data as unknown as OxygenRequestDocumentWithRelations, error: null }
    }
    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error fetching request document details:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch request document details',
    }
  }
}

/**
 * Creates a request document with item rows
 */
export async function createRequestDocument(
  hospitalId: string,
  supplierId: string,
  requestedDate: string,
  remarks: string,
  items: { size_code: string; quantity: number; usage_notes: string }[],
  createdBy: string
): Promise<ApiResponse<OxygenRequestDocument>> {
  try {
    if (isSupabaseConfigured()) {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const todayStr = `${yyyy}${mm}${dd}`
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const documentNumber = `O2-REQ-${todayStr}-${randomSuffix}`

      // 1. Insert Request Document
      const { data: doc, error: docError } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .insert({
          hospital_id: hospitalId,
          document_number: documentNumber,
          supplier_id: supplierId,
          status: 'completed',
          requested_date: requestedDate,
          remarks: remarks || null,
          created_by: createdBy
        })
        .select('*')
        .single()

      if (docError) throw docError

      const docId = doc.id

      // 2. Insert Items
      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          request_document_id: docId,
          size_code: item.size_code,
          quantity: item.quantity,
          usage_notes: item.usage_notes || null
        }))

        const { error: itemError } = await supabase
          .from('pharmacy_oxygen_request_document_items')
          .insert(itemRows)

        if (itemError) throw itemError
      }

      return { data: doc as OxygenRequestDocument, error: null }
    }

    return { data: null, error: 'Supabase not configured' }
  } catch (error) {
    console.error('Error creating request document:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create request document',
    }
  }
}

