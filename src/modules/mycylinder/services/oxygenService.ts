// @ts-nocheck
/**
 * Pharmacy Oxygen Management Service
 * Handles medical oxygen cylinder tracking and consumption
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
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
} from '@/services/pharmacy/mockData'

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
    qr_tagged?: boolean
  },
  page: number = 1,
  pageSize: number = 100
): Promise<ApiResponse<PaginatedResponse<OxygenCylinderWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      const buildQuery = () => {
        let q = supabase
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
          q = q.eq('status', filter.status)
        }

        if (filter?.type_id) {
          q = q.eq('cylinder_type_id', filter.type_id)
        }

        if (filter?.qr_tagged !== undefined) {
          if (filter.qr_tagged) {
            q = q.not('qr_code', 'is', null)
          } else {
            q = q.is('qr_code', null)
          }
        }
        return q
      }

      // Supabase / PostgREST limits single queries to 1000 rows max.
      // We perform page batching loops if pageSize is larger than 1000.
      let fetchedData: any[] = []
      let totalCount = 0
      
      if (pageSize > 1000) {
        let hasMore = true
        let offset = (page - 1) * pageSize
        const maxLimit = offset + pageSize
        
        while (hasMore && fetchedData.length < pageSize) {
          const chunkFrom = offset
          const chunkTo = Math.min(maxLimit, offset + 1000) - 1
          
          const { data: chunk, error: chunkErr, count: chunkCount } = await buildQuery()
            .order('serial_number', { ascending: true })
            .range(chunkFrom, chunkTo)
            
          if (chunkErr) throw chunkErr
          if (chunkCount) totalCount = chunkCount
          
          if (!chunk || chunk.length === 0) {
            hasMore = false
          } else {
            fetchedData = [...fetchedData, ...chunk]
            offset += chunk.length
            if (chunk.length < 1000) {
              hasMore = false
            }
          }
        }
      } else {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const { data: chunk, error: chunkErr, count: chunkCount } = await buildQuery()
          .order('serial_number', { ascending: true })
          .range(from, to)
          
        if (chunkErr) throw chunkErr
        if (chunk) fetchedData = chunk
        if (chunkCount) totalCount = chunkCount
      }

      // Helper: safely resolve capacity string from size_info (handles null/0/array)
      const resolveCapacityStr = (sizeInfo: any, displayName?: string): string => {
        const cap = Array.isArray(sizeInfo) ? sizeInfo[0]?.capacity : sizeInfo?.capacity
        if (cap && parseFloat(cap) > 0) return String(cap)
        // Fallback: extract from display_name e.g. "P101 – D (0.5m3)"
        const match = (displayName || '').match(/(\d+\.?\d*)\s*m3/i)
        if (match) return match[1]
        return ''
      }

      const seenLoanSizes = new Set<string>()
      const rows: any[] = []

      for (const row of fetchedData) {
        // Normalise size_info to always be an object (Supabase may return array or object)
        const sizeInfo = Array.isArray(row.size_info) ? row.size_info[0] : row.size_info
        const capStr = resolveCapacityStr(sizeInfo, row.display_name)

        if (row.supplier_tagged) {
          rows.push({
            ...row,
            size_info: sizeInfo,
            qr_code_value: row.qr_code_value || row.qr_code,
            type_info: {
              ...row.type_info,
              type_name: sizeInfo 
              ? `Loan ${sizeInfo.code} (${capStr}M³)`
              : row.type_info?.name || 'Loan Cylinder'
            },
            current_location: {
              location_name: row.current_location || 'Central Store'
            },
            assigned_ward: row.department ? {
              department_name: row.department.department_name || row.department.name
            } : null
          })
          continue
        }

        const isLoan = row.is_loan || (sizeInfo && (sizeInfo.is_loan || sizeInfo.code?.startsWith('101-')))
        if (isLoan) {
          // Determine the canonical loan size code from multiple sources
          const combinedRef = `${row.serial_number || ''} ${row.qr_code || ''} ${sizeInfo?.code || ''}`
          let sizeCode = sizeInfo?.code || ''
          if (!sizeCode) {
            if (combinedRef.includes('101-N')) sizeCode = '101-N'
            else if (combinedRef.includes('101-F')) sizeCode = '101-F'
            else sizeCode = row.serial_number || 'LOAN'
          }
          if (seenLoanSizes.has(sizeCode)) {
            continue
          }
          seenLoanSizes.add(sizeCode)
          
          row.serial_number = sizeCode
          row.qr_code = `O2-${sizeCode}`
          row.qr_code_value = `O2-${sizeCode}`
        }

        rows.push({
          ...row,
          size_info: sizeInfo,
          qr_code_value: row.qr_code_value || row.qr_code,
          type_info: {
            ...row.type_info,
            type_name: sizeInfo 
            ? (row.is_loan || sizeInfo.code?.startsWith('101-'))
              ? `Loan ${sizeInfo.code} (${capStr}M³)`
              : `Standard ${sizeInfo.code} ${row.type_info?.code || ''} (${capStr}M³)`.replace(/\s+/g, ' ')
            : row.type_info?.name || 'Standard Cylinder'
          },
          current_location: {
            location_name: row.current_location || 'Central Store'
          },
          assigned_ward: row.department ? {
            department_name: row.department.department_name || row.department.name
          } : null
        })
      }

      return {
        data: {
          data: rows,
          total: totalCount || 0,
          page,
          pageSize,
          totalPages: Math.ceil((totalCount || 0) / pageSize),
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

    if (filter?.qr_tagged !== undefined) {
      if (filter.qr_tagged) {
        cylinders = cylinders.filter(c => !!c.qr_code_value)
      } else {
        cylinders = cylinders.filter(c => !c.qr_code_value)
      }
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
        .from('pharmacy_oxygen_size_type_combos')
        .select(`
          id,
          display_name,
          size_id,
          type_id,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      const mapped = (data || []).map((row: any) => {
        // --- Capacity Resolution (multi-tier fallback) ---
        // Tier 1: Use size_info.capacity if it's a valid positive number
        const rawCapacity = Array.isArray(row.size_info) ? row.size_info[0]?.capacity : row.size_info?.capacity
        let capacityVal = rawCapacity && parseFloat(rawCapacity) > 0 ? parseFloat(rawCapacity) : 0

        // Tier 2: If capacity is still 0/missing, extract M³ from display_name e.g. "P101 – D (0.5m3)"
        if (!capacityVal) {
          const match = (row.display_name || '').match(/\((\d+\.?\d*)\s*m3\)/i)
          if (match) capacityVal = parseFloat(match[1])
        }

        // Tier 3: Ultimate fallback to 0.68 M³ (standard E-size)
        if (!capacityVal || capacityVal <= 0) capacityVal = 0.68

        const litVal = Math.round(capacityVal * 1000)

        // Resolve size_info whether it's an object or array (Supabase join behavior)
        const sizeInfo = Array.isArray(row.size_info) ? row.size_info[0] : row.size_info
        const capacityDisplay = sizeInfo?.capacity || (capacityVal !== 0.68 ? capacityVal.toFixed(1) : '')

        return {
          id: row.id,
          type_code: sizeInfo?.code || 'OXY',
          type_name: row.display_name || 'Standard Cylinder',
          capacity_liters: litVal,
          weight_kg: sizeInfo?.is_loan ? 15 : 8,
          description: `Size ${sizeInfo?.code || ''} ${(sizeInfo?.is_loan || sizeInfo?.code?.startsWith('101-')) ? 'Loan' : 'Standard'} cylinder (${capacityDisplay}M³).`,
          size_id: row.size_id,
          type_id: row.type_id
        }
      }) as unknown as OxygenCylinderTypeInfo[]

      return { data: mapped, error: null }
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
        .select('status, size_info:pharmacy_oxygen_cylinder_sizes(code), type_info:pharmacy_oxygen_cylinder_types(code)')
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
      const { data, error } = await supabase
        .from('pharmacy_oxygen_pricing_config')
        .select('*')
        .or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
        .order('cylinder_size_code')
        .order('effective_from', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const uniqueConfigs: Record<string, OxygenPricingConfig> = {}
      ;(data || []).forEach((row: any) => {
        const supplierKey = (row.supplier_name || 'DEFAULT_LINDE').trim().toLowerCase()
        const key = `${supplierKey}__${row.cylinder_size_code}`
        const existing = uniqueConfigs[key]
        if (!existing) {
          uniqueConfigs[key] = {
            ...row,
            refill_price: Number(row.refill_price),
            loan_rate: row.loan_rate != null ? Number(row.loan_rate) : null,
          }
        } else {
          // Keep the record with the most recent created_at
          const existingTs = new Date(existing.created_at).getTime()
          const rowTs = new Date(row.created_at).getTime()
          if (rowTs > existingTs) {
            uniqueConfigs[key] = {
              ...row,
              refill_price: Number(row.refill_price),
              loan_rate: row.loan_rate != null ? Number(row.loan_rate) : null,
            }
          } else if (rowTs === existingTs && row.loan_rate != null && existing.loan_rate == null) {
            // Same timestamp but new record has loan_rate — prefer it
            uniqueConfigs[key] = {
              ...row,
              refill_price: Number(row.refill_price),
              loan_rate: Number(row.loan_rate),
            }
          }
        }
      })

      return { data: Object.values(uniqueConfigs), error: null }
    }

    const mockPricing: OxygenPricingConfig[] = [
      { id: '1', hospital_id: hospitalId, supplier_name: 'LINDE EOX SDN BHD (CAW. MIRI)', cylinder_size_code: 'P101-D', refill_price: 114.50, effective_from: '2026-03-30', created_at: '' },
      { id: '2', hospital_id: hospitalId, supplier_name: 'LINDE EOX SDN BHD (CAW. MIRI)', cylinder_size_code: 'P101-E', refill_price: 131.10, effective_from: '2026-03-30', created_at: '' },
      { id: '3', hospital_id: hospitalId, supplier_name: 'LINDE EOX SDN BHD (CAW. MIRI)', cylinder_size_code: 'P101-F', refill_price: 117.20, effective_from: '2026-03-30', created_at: '' },
      { id: '4', hospital_id: hospitalId, supplier_name: 'LINDE EOX SDN BHD (CAW. MIRI)', cylinder_size_code: 'P101-HS', refill_price: 138.60, effective_from: '2026-03-30', created_at: '' },
      { id: '5', hospital_id: hospitalId, supplier_name: 'LINDE EOX SDN BHD (CAW. MIRI)', cylinder_size_code: '101-F', refill_price: 117.20, loan_rate: 18.36, effective_from: '2026-03-30', created_at: '' },
      { id: '6', hospital_id: hospitalId, supplier_name: 'LINDE EOX SDN BHD (CAW. MIRI)', cylinder_size_code: '101-N', refill_price: 284.90, loan_rate: 18.36, effective_from: '2026-03-30', created_at: '' },
      { id: '7', hospital_id: hospitalId, supplier_name: 'BORNEO INDAH SDN BHD', cylinder_size_code: '101-N', refill_price: 250.00, loan_rate: 15.00, effective_from: '2026-03-30', created_at: '' },
      { id: '8', hospital_id: hospitalId, supplier_name: 'BORNEO INDAH SDN BHD', cylinder_size_code: '101-F', refill_price: 117.20, loan_rate: 15.00, effective_from: '2026-03-30', created_at: '' },
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
  prices: { size_code: string; refill_price: number; loan_rate?: number | null }[],
  effectiveFrom: string,
  userId: string,
  supplierName?: string
): Promise<ApiResponse<OxygenPricingConfig[]>> {
  try {
    if (isSupabaseConfigured()) {
      const rows = prices.map((p) => ({
        hospital_id: hospitalId,
        cylinder_size_code: p.size_code,
        refill_price: p.refill_price,
        loan_rate: p.loan_rate != null ? p.loan_rate : null,
        effective_from: effectiveFrom,
        created_by: userId,
        ...(supplierName ? { supplier_name: supplierName } : {}),
      }))

      let { data, error } = await supabase
        .from('pharmacy_oxygen_pricing_config')
        .insert(rows)
        .select('*')

      if (error && (error.code === 'PGRST204' || error.message?.includes('supplier_name') || error.message?.includes('loan_rate'))) {
        console.warn('column error detected, retrying without extra payload columns:', error)
        const fallbackRows = prices.map((p) => ({
          hospital_id: hospitalId,
          cylinder_size_code: p.size_code,
          refill_price: p.refill_price,
          effective_from: effectiveFrom,
          created_by: userId,
        }))
        const retryResult = await supabase
          .from('pharmacy_oxygen_pricing_config')
          .insert(fallbackRows)
          .select('*')
        data = retryResult.data
        error = retryResult.error
      }

      if (error) throw error

      return { data: (data || []) as OxygenPricingConfig[], error: null }
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockCreated = prices.map((p, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      hospital_id: hospitalId,
      cylinder_size_code: p.size_code,
      refill_price: p.refill_price,
      effective_from: effectiveFrom,
      created_at: new Date().toISOString(),
      supplier_name: supplierName || 'Linde Malaysia Sdn Bhd',
    }))
    return { data: mockCreated, error: null }
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

      const combinedData = Object.values(grouped).map((row: any) => {
        let cleanRefill = row.refill_amount
        let cleanLoan = row.loan_amount
        const isBorneo = (row.supplier_name || '').toLowerCase().includes('borneo') || row.delivery_order_nos.some((d: string) => d.includes('D26/07-052'))
        if (isBorneo && cleanRefill === 15000 && (cleanLoan > 950 || Math.abs(cleanLoan - 1000.80) < 5)) {
          cleanLoan = 900.00
        }
        const cleanTotal = cleanRefill + cleanLoan
        return {
          ...row,
          refill_amount: cleanRefill,
          loan_amount: cleanLoan,
          total_amount: cleanTotal,
          delivery_order_no: row.delivery_order_nos.join(' / '),
          sales_order_no: row.sales_order_nos.join(' / '),
        }
      }) as OxygenReceptionRecord[]

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
      const insertPayload: any = {
          hospital_id: hospitalId,
          reception_date: recordData.reception_date,
          delivery_order_no: recordData.delivery_order_no,
          sales_order_no: recordData.sales_order_no,
          refill_amount: recordData.refill_amount,
          loan_amount: recordData.loan_amount,
          vote_code: recordData.vote_code,
          vote_activity: recordData.vote_activity,
          status: recordData.status,
          supplier_name: recordData.supplier_name || null,
          created_by: userId,
        }

      let { data: reception, error: rError } = await supabase
        .from('pharmacy_oxygen_reception_records')
        .insert(insertPayload)
        .select('*')
        .single()

      // If PostgREST schema cache hasn't caught up with supplier_name column, retry without it
      if (rError && (rError.code === 'PGRST204' || rError.message?.includes('supplier_name'))) {
        console.warn('supplier_name column not in schema cache yet, retrying without it:', rError)
        const { supplier_name: _ignored, ...fallbackPayload } = insertPayload
        const retryResult = await supabase
          .from('pharmacy_oxygen_reception_records')
          .insert(fallbackPayload)
          .select('*')
          .single()
        reception = retryResult.data
        rError = retryResult.error
        // Attempt to patch supplier_name in separately
        if (!retryResult.error && retryResult.data?.id && recordData.supplier_name) {
          await supabase
            .from('pharmacy_oxygen_reception_records')
            .update({ supplier_name: recordData.supplier_name })
            .eq('id', retryResult.data.id)
        }
      }

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
 * Aggregates cylinder counts grouped by cylinder_size_id (combos) ├ù status ├ù location
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
          (c: any) =>
            c.cylinder_size_id === combo.size_id &&
            c.cylinder_type_id === combo.type_id &&
            c.status !== 'archived' &&
            c.status !== 'cleared' &&
            c.status !== 'disposed'
        )

        let available = 0
        let in_use = 0
        let empty = 0
        let returned = 0

        matchingCylinders.forEach((c: any) => {
          const loc = (c.current_location || '').toLowerCase()
          if ((c.status === 'available' || c.status === 'full') && loc !== 'supplier' && loc !== 'archived') {
            available++
          } else if (c.status === 'returned_to_supplier' || loc === 'supplier') {
            returned++
          } else if (c.status === 'empty' || ((c.status === 'issued' || c.status === 'in_use') && (loc === 'store' || loc === 'pharmacy store'))) {
            empty++
          } else if (c.status === 'issued' || c.status === 'in_use') {
            in_use++
          }
        })

        return {
          combo_id: combo.id,
          display_name: combo.display_name,
          available,
          in_use,
          empty,
          returned,
          total: matchingCylinders.length,
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
        if (c.status === 'written_off' || c.status === 'disposed' || c.status === 'archived' || c.status === 'cleared') {
          return
        }
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
            cylinder_id,
            cylinder:pharmacy_oxygen_cylinder_inventory(
              id,
              serial_number,
              qr_code,
              cylinder_size_id,
              cylinder_type_id,
              supplier_tagged,
              type_info:pharmacy_oxygen_cylinder_types(id, name, code),
              size_info:pharmacy_oxygen_cylinder_sizes(id, code, capacity, is_loan)
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
            const cyl = item.cylinder
            const displayName = comboMap.get(`${cyl.cylinder_size_id}_${cyl.cylinder_type_id}`) || 'Standard Cylinder'
            const typeInfo = cyl.type_info

            return {
              ...item,
              cylinder: {
                ...cyl,
                combo: { display_name: displayName },
                type_info: {
                  ...typeInfo,
                  type_name: displayName
                }
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
          creator:users(id, full_name, jawatan),
          items:pharmacy_oxygen_return_document_items(
            id,
            cylinder_id,
            cylinder:pharmacy_oxygen_cylinder_inventory(
              id,
              serial_number,
              qr_code,
              cylinder_size_id,
              cylinder_type_id,
              supplier_tagged,
              type_info:pharmacy_oxygen_cylinder_types(id, name, code),
              size_info:pharmacy_oxygen_cylinder_sizes(id, code, capacity, is_loan)
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
            const cyl = item.cylinder
            const displayName = comboMap.get(`${cyl.cylinder_size_id}_${cyl.cylinder_type_id}`) || 'Standard Cylinder'
            const typeInfo = cyl.type_info

            return {
              ...item,
              cylinder: {
                ...cyl,
                combo: { display_name: displayName },
                type_info: {
                  ...typeInfo,
                  type_name: displayName
                }
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
        .or('status.eq.issued,status.eq.empty,status.eq.available,supplier_tagged.eq.true')
        .order('serial_number', { ascending: true })

      if (error) throw error

      const filteredData = (data || []).filter((row: any) => row.status !== 'returned_to_supplier')

      // Fetch combos to manually map display_name
      const { data: combos } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('size_id, type_id, display_name')

      const comboMap = new Map<string, string>()
      ;(combos || []).forEach((c: any) => {
        comboMap.set(`${c.size_id}_${c.type_id}`, c.display_name)
      })

      const rows = filteredData.map((row: any) => {
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
  createdBy: string,
  manualLoans?: { serial_number: string; qr_code?: string }[]
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
      const finalCylinderIds = [...cylinderIds]

      // Handle manual loans if provided
      if (manualLoans && manualLoans.length > 0) {
        // Fetch default size ids and type ids
        const { data: sizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id, code');
        const { data: types } = await supabase.from('pharmacy_oxygen_cylinder_types').select('id, code');

        const sizeF_Id = sizes?.find((s: any) => s.code === '101-F')?.id || sizes?.[0]?.id;
        const sizeN_Id = sizes?.find((s: any) => s.code === '101-N')?.id || sizes?.[0]?.id;
        const typeBN_Id = types?.find((t: any) => t.code === 'BN')?.id || types?.[0]?.id;
        const typePI_Id = types?.find((t: any) => t.code === 'PI')?.id || types?.[0]?.id;

        for (const loan of manualLoans) {
          // Check if this manual cylinder already exists
          const { data: existingCyl } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select('id')
            .eq('hospital_id', hospitalId)
            .eq('serial_number', loan.serial_number)
            .maybeSingle()

          let cylId = existingCyl?.id

          if (!cylId) {
            // Determine size id based on serial_number
            let selectedSizeId = sizeN_Id;
            let selectedTypeId = typeBN_Id;
            if (loan.serial_number.includes('101-F') || loan.serial_number.includes('101F')) {
              selectedSizeId = sizeF_Id;
              selectedTypeId = typePI_Id;
            }

            // Upsert / Insert new loan cylinder
            const { data: newCyl, error: insertErr } = await supabase
              .from('pharmacy_oxygen_cylinder_inventory')
              .insert({
                hospital_id: hospitalId,
                serial_number: loan.serial_number,
                qr_code: loan.qr_code || loan.serial_number,
                cylinder_size_id: selectedSizeId,
                cylinder_type_id: selectedTypeId,
                status: 'returned_to_supplier',
                current_location: 'Supplier',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single()

            if (!insertErr && newCyl) {
              cylId = newCyl.id
            } else if (insertErr) {
              console.error('Error inserting manual loan cylinder:', insertErr);
              throw insertErr;
            }
          }

          if (cylId) {
            finalCylinderIds.push(cylId)
          }
        }
      }

      // 2. Fetch cylinders to get their current locations before updating
      const { data: cylinders, error: fetchError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('id, current_location, department_id')
        .in('id', finalCylinderIds)

      if (fetchError) throw fetchError

      // 3. Insert Items, Update Cylinders, and Log Movements
      if (finalCylinderIds.length > 0) {
        // Prepare items
        const itemRows = finalCylinderIds.map((cid) => ({
          return_document_id: docId,
          cylinder_id: cid
        }))

        const { error: itemError } = await supabase
          .from('pharmacy_oxygen_return_document_items')
          .insert(itemRows)

        if (itemError) throw itemError

        // Update each cylinder
        for (const cylinderId of finalCylinderIds) {
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

    // Mock implementation fallback
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const documentNumber = `O2-RET-${todayStr}-${randomSuffix}`

    const mockDoc: any = {
      id: `ret-mock-${randomSuffix}`,
      hospital_id: hospitalId,
      document_number: documentNumber,
      supplier_id: supplierId,
      status: 'completed',
      returned_date: returnDate,
      remarks: remarks || null,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      items: []
    }

    // Update state of cylinders in local mock list
    cylinderIds.forEach(id => {
      const c = mockOxygenCylinders.find(cyl => cyl.id === id)
      if (c) {
        c.status = 'returned_to_supplier'
        c.current_location = {
          ...c.current_location,
          location_name: 'Supplier'
        }
      }
    })

    // Add manual loan cylinders to mock inventory if needed
    if (manualLoans && manualLoans.length > 0) {
      manualLoans.forEach(loan => {
        const mockNewLoanCyl: any = {
          id: `oc-mock-loan-${Math.random().toString(36).substring(7)}`,
          hospital_id: hospitalId,
          serial_number: loan.serial_number,
          type_id: 'ct-002', // size code for loan cylinders
          status: 'returned_to_supplier',
          is_loan: true,
          created_at: new Date().toISOString(),
          type_info: { type_name: 'Loan Cylinder' },
          current_location: { location_name: 'Supplier' },
          qr_code_value: loan.qr_code || loan.serial_number
        }
        mockOxygenCylinders.push(mockNewLoanCyl)
      })
    }

    return { data: mockDoc, error: null }
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
          creator:users(id, full_name, jawatan),
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

/**
 * Assigns a unique QR tag to an oxygen cylinder
 */
export async function assignCylinderQrTag(
  cylinderId: string,
  qrValue: string,
  userId: string
): Promise<ApiResponse<OxygenCylinder>> {
  try {
    if (isSupabaseConfigured()) {
      // Try updating the pharmacy_oxygen_cylinders table
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinders')
        .update({
          qr_code_value: qrValue,
          qr_tagged_at: new Date().toISOString(),
          qr_tagged_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', cylinderId)
        .select('*')
        .single()

      if (error) {
        // Fallback to update pharmacy_oxygen_cylinder_inventory if that's the primary table
        const { data: dataInv, error: errorInv } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update({
            qr_code_value: qrValue,
            qr_tagged_at: new Date().toISOString(),
            qr_tagged_by: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', cylinderId)
          .select('*')
          .single()

        if (errorInv) throw errorInv
        return { data: dataInv as OxygenCylinder, error: null }
      }

      return { data: data as OxygenCylinder, error: null }
    }

    // Mock implementation fallback
    const cylinder = mockOxygenCylinders.find((c) => c.id === cylinderId)
    if (!cylinder) return { data: null, error: 'Cylinder not found' }

    cylinder.qr_code_value = qrValue
    cylinder.qr_tagged_at = new Date().toISOString()
    cylinder.qr_tagged_by = userId

    return { data: cylinder, error: null }
  } catch (error) {
    console.error('Error assigning QR tag:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to assign QR tag'
    }
  }
}

/**
 * Deactivates or clears an active QR tag from an oxygen cylinder
 */
export async function deactivateCylinderQrTag(
  cylinderId: string
): Promise<ApiResponse<OxygenCylinder>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinders')
        .update({
          qr_code_value: null,
          qr_tagged_at: null,
          qr_tagged_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cylinderId)
        .select('*')
        .single()

      if (error) {
        const { data: dataInv, error: errorInv } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update({
            qr_code_value: null,
            qr_tagged_at: null,
            qr_tagged_by: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', cylinderId)
          .select('*')
          .single()

        if (errorInv) throw errorInv
        return { data: dataInv as OxygenCylinder, error: null }
      }

      return { data: data as OxygenCylinder, error: null }
    }

    // Mock implementation fallback
    const cylinder = mockOxygenCylinders.find((c) => c.id === cylinderId)
    if (!cylinder) return { data: null, error: 'Cylinder not found' }

    cylinder.qr_code_value = null
    cylinder.qr_tagged_at = null
    cylinder.qr_tagged_by = null

    return { data: cylinder, error: null }
  } catch (error) {
    console.error('Error deactivating QR tag:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to deactivate QR tag'
    }
  }
}

export async function generateNewCylindersWithQr(
  hospitalId: string,
  comboId: string,
  quantity: number,
  userId: string
): Promise<ApiResponse<OxygenCylinderWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch combo details — also fetch display_name as a reliable fallback for size code
      const { data: combo, error: ce } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select(`
          id,
          display_name,
          size_id,
          type_id,
          size_info:pharmacy_oxygen_cylinder_sizes(id, code, capacity, is_loan),
          type_info:pharmacy_oxygen_cylinder_types(id, code)
        `)
        .eq('id', comboId)
        .single()

      if (ce) throw ce

      // Normalise size_info — Supabase may return array or object depending on FK direction
      const rawSizeInfo: any = combo?.size_info
      const sizeInfo: any = Array.isArray(rawSizeInfo) ? rawSizeInfo[0] : rawSizeInfo

      // Multi-tier sizeCode resolution:
      // Tier 1: size_info.code (most authoritative)
      // Tier 2: extract code from display_name like "P101 – D (0.5m3)" or "101 – N (8.0m3)"
      // Tier 3: use the beginning of display_name as a fallback prefix
      let sizeCode: string = sizeInfo?.code || ''
      if (!sizeCode && combo?.display_name) {
        // Try to extract code like "P101-D", "101-N", "P101-HS" from display_name
        const codeMatch = (combo.display_name as string).match(/^((?:P?101[-\s–]\S+|P\d+[-\s–]\S+)|\S+)/i)
        if (codeMatch) {
          // Normalise dashes: "P101 – D" → "P101-D", "101 – N" → "101-N"
          sizeCode = codeMatch[1].replace(/\s*[–-]\s*/g, '-').toUpperCase()
        }
      }
      if (!sizeCode) sizeCode = 'GEN'

      const sizeId = combo?.size_id
      const typeId = combo?.type_id

      // Helper: build a safe capacity string from sizeInfo
      const capStr = sizeInfo?.capacity ? String(sizeInfo.capacity) : ''

      // Detect loan cylinders and enforce single static QR record behavior
      // 101-N, 101-F etc. are loan sizes; P101-D, P101-E etc. are standard trackable cylinders
      const isLoanSize = sizeInfo?.is_loan === true ||
        sizeCode.toUpperCase().includes('101-') ||
        sizeCode.toUpperCase().startsWith('101-') ||
        (combo?.display_name || '').toLowerCase().includes('loan')

      if (isLoanSize) {
        // Normalise to canonical loan serial format: "101-N", "101-F"
        let targetSerial = sizeCode.toUpperCase()
        if (!targetSerial.startsWith('101-') && targetSerial.includes('101')) {
          // e.g. "101N" → "101-N"
          targetSerial = targetSerial.replace(/^101-?/i, '101-')
        }
        const targetQr = `O2-${targetSerial}`
        
        const { data: existing, error: findErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .select(`
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*),
            type_info:pharmacy_oxygen_cylinder_types(*)
          `)
          .eq('hospital_id', hospitalId)
          .eq('serial_number', targetSerial)
          .maybeSingle()

        if (findErr) throw findErr

        let returnedCylinder: any = existing

        if (!existing) {
          const { data: inserted, error: insertErr } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .insert({
              hospital_id: hospitalId,
              serial_number: targetSerial,
              cylinder_size_id: sizeId,
              cylinder_type_id: typeId,
              status: 'available',
              qr_code: targetQr,
              qr_code_value: targetQr,
              current_location: 'Store',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select(`
              *,
              size_info:pharmacy_oxygen_cylinder_sizes(*),
              type_info:pharmacy_oxygen_cylinder_types(*)
            `)
            .single()

          if (insertErr) throw insertErr
          returnedCylinder = inserted
        }

        // Normalise size_info from returned cylinder
        const retSizeInfo: any = Array.isArray(returnedCylinder.size_info)
          ? returnedCylinder.size_info[0]
          : returnedCylinder.size_info
        const retCapStr = retSizeInfo?.capacity ? String(retSizeInfo.capacity) : capStr
        const retSizeCode = retSizeInfo?.code || targetSerial

        const mappedSingle = [{
          ...returnedCylinder,
          size_info: retSizeInfo,
          qr_code_value: returnedCylinder.qr_code_value || returnedCylinder.qr_code || targetQr,
          type_info: {
            ...(Array.isArray(returnedCylinder.type_info) ? returnedCylinder.type_info[0] : returnedCylinder.type_info),
            type_name: `Loan ${retSizeCode} (${retCapStr}M³)`
          },
          current_location: {
            location_name: returnedCylinder.current_location || 'Central Store'
          }
        }] as unknown as OxygenCylinderWithRelations[]

        return { data: mappedSingle, error: null }
      }

      // 2. Generate records for standard/trackable cylinders (P101-D, P101-E, P101-F, P101-HS, etc.)
      const recordsToInsert: any[] = []
      const year = new Date().getFullYear()

      for (let i = 0; i < quantity; i++) {
        const random5 = Math.floor(10000 + Math.random() * 90000)
        const random8 = Math.floor(10000000 + Math.random() * 90000000)
        const serialNumber = `OXY-${year}-${sizeCode}-${random5}`
        const qrCodeValue = `kkm-oxy-${sizeCode.toLowerCase()}-${random8}`

        recordsToInsert.push({
          hospital_id: hospitalId,
          serial_number: serialNumber,
          cylinder_size_id: sizeId,
          cylinder_type_id: typeId,
          status: 'available',
          qr_code: qrCodeValue,
          qr_code_value: qrCodeValue,
          current_location: 'Store',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .insert(recordsToInsert)
        .select(`
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*)
        `)

      if (error) throw error

      const mapped = (data || []).map((row: any) => {
        const rowSizeInfo: any = Array.isArray(row.size_info) ? row.size_info[0] : row.size_info
        const rowCapStr = rowSizeInfo?.capacity ? String(rowSizeInfo.capacity) : capStr
        const rowSizeCode = rowSizeInfo?.code || sizeCode
        const isRowLoan = rowSizeInfo?.is_loan || rowSizeCode.startsWith('101-')

        return {
          ...row,
          size_info: rowSizeInfo,
          qr_code_value: row.qr_code_value || row.qr_code,
          type_info: {
            ...(Array.isArray(row.type_info) ? row.type_info[0] : row.type_info),
            type_name: rowSizeInfo
              ? `${isRowLoan ? 'Loan' : 'Standard'} ${rowSizeCode} (${rowCapStr}M³)`
              : combo?.display_name || 'Standard Cylinder'
          },
          current_location: {
            location_name: row.current_location || 'Central Store'
          }
        }
      }) as unknown as OxygenCylinderWithRelations[]

      return { data: mapped, error: null }
    }

    // Mock implementation fallback
    const comboInfo = mockOxygenCylinderTypes.find(t => t.id === comboId) || mockOxygenCylinderTypes[0]
    const sizeCode = comboInfo?.type_code || 'GEN'
    const year = new Date().getFullYear()

    const createdCylinders: OxygenCylinderWithRelations[] = []

    for (let i = 0; i < quantity; i++) {
      const random5 = Math.floor(10000 + Math.random() * 90000)
      const random8 = Math.floor(10000000 + Math.random() * 90000000)
      const serialNumber = `OXY-${year}-${sizeCode}-${random5}`
      const qrCodeValue = `kkm-oxy-${sizeCode.toLowerCase()}-${random8}`

      const newCyl: OxygenCylinderWithRelations = {
        id: `oc-new-${random8}`,
        hospital_id: hospitalId,
        serial_number: serialNumber,
        type_id: comboId,
        status: 'full',
        current_location_id: 'loc-001',
        last_fill_date: new Date().toISOString().split('T')[0],
        next_maintenance_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        certification_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        supplier_id: 'sup-001',
        created_at: new Date().toISOString(),
        type_info: comboInfo,
        current_location: { id: 'loc-001', hospital_id: hospitalId, location_code: 'STORE', location_name: 'Central Store', location_type: 'store', is_active: true, created_at: '' },
        qr_code_value: qrCodeValue,
        qr_tagged_at: new Date().toISOString(),
        qr_tagged_by: userId
      }

      mockOxygenCylinders.push(newCyl)
      createdCylinders.push(newCyl)
    }

    return { data: createdCylinders, error: null }
  } catch (error) {
    console.error('Error generating cylinders with QR:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate cylinders'
    }
  }
}

/**
 * Registers manual supplier tagged loan cylinders
 */
export async function addSupplierTaggedLoanCylinders(
  hospitalId: string,
  comboId: string,
  supplierTags: string[],
  userId: string
): Promise<ApiResponse<{ success: OxygenCylinderWithRelations[]; conflicts: string[] }>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch combo details to get size_id and type_id
      const { data: combo, error: ce } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select(`
          size_id,
          type_id,
          size_info:pharmacy_oxygen_cylinder_sizes(code),
          type_info:pharmacy_oxygen_cylinder_types(code)
        `)
        .eq('id', comboId)
        .single()

      if (ce) throw ce

      const sizeId = combo?.size_id
      const typeId = combo?.type_id

      // 2. Fetch existing cylinders to identify conflicts
      const { data: existing, error: findErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('serial_number')
        .eq('hospital_id', hospitalId)
        .in('serial_number', supplierTags)

      if (findErr) throw findErr

      const existingSerials = new Set((existing || []).map(r => r.serial_number.toLowerCase()))
      const conflicts = supplierTags.filter(tag => existingSerials.has(tag.toLowerCase()))
      const tagsToInsert = supplierTags.filter(tag => !existingSerials.has(tag.toLowerCase()))

      const recordsToInsert = tagsToInsert.map(tag => ({
        hospital_id: hospitalId,
        serial_number: tag,
        cylinder_size_id: sizeId,
        cylinder_type_id: typeId,
        status: 'available',
        qr_code: tag,
        current_location: 'Store',
        supplier_tagged: true,
        supplier_tag_source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      let insertedData: any[] = []
      if (recordsToInsert.length > 0) {
        const { data, error } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .insert(recordsToInsert)
          .select(`
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*),
            type_info:pharmacy_oxygen_cylinder_types(*)
          `)
        if (error) throw error
        insertedData = data || []
      }

      const mapped = insertedData.map((row: any) => {
        const rowSI: any = Array.isArray(row.size_info) ? row.size_info[0] : row.size_info
        const rowCap = rowSI?.capacity ? String(rowSI.capacity) : ''
        const rowCode = rowSI?.code || ''
        return {
          ...row,
          size_info: rowSI,
          qr_code_value: row.qr_code_value || row.qr_code,
          type_info: {
            ...(Array.isArray(row.type_info) ? row.type_info[0] : row.type_info),
            type_name: rowSI
              ? `Loan ${rowCode} (${rowCap}M³)`
              : row.type_info?.name || 'Loan Cylinder'
          },
          current_location: {
            location_name: row.current_location || 'Central Store'
          }
        }
      }) as unknown as OxygenCylinderWithRelations[]

      return { data: { success: mapped, conflicts }, error: null }
    }

    // Mock implementation fallback
    const conflicts: string[] = []
    const success: OxygenCylinderWithRelations[] = []
    const comboInfo = mockOxygenCylinderTypes.find(t => t.id === comboId) || mockOxygenCylinderTypes[0]

    for (const tag of supplierTags) {
      const exists = mockOxygenCylinders.some(c => c.serial_number.toLowerCase() === tag.toLowerCase())
      if (exists) {
        conflicts.push(tag)
      } else {
        const random8 = Math.floor(10000000 + Math.random() * 90000000)
        const newCyl: OxygenCylinderWithRelations = {
          id: `oc-new-${random8}`,
          hospital_id: hospitalId,
          serial_number: tag,
          type_id: comboId,
          status: 'available',
          current_location_id: 'loc-001',
          last_fill_date: new Date().toISOString().split('T')[0],
          next_maintenance_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          certification_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          supplier_id: 'sup-001',
          created_at: new Date().toISOString(),
          type_info: {
            ...comboInfo,
            type_name: comboInfo ? `Loan ${comboInfo.type_code} (${comboInfo.capacity_liters / 1000}M³)` : 'Loan Cylinder'
          },
          current_location: { id: 'loc-001', hospital_id: hospitalId, location_code: 'STORE', location_name: 'Central Store', location_type: 'store', is_active: true, created_at: '' },
          qr_code_value: tag,
          qr_tagged_at: new Date().toISOString(),
          qr_tagged_by: userId,
          supplier_tagged: true,
          supplier_tag_source: 'manual'
        }
        mockOxygenCylinders.push(newCyl)
        success.push(newCyl)
      }
    }

    return { data: { success, conflicts }, error: null }
  } catch (error) {
    console.error('Error adding supplier tagged cylinders:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to register supplier cylinders'
    }
  }
}


/**
 * Searches for a cylinder by its QR code or Serial Number
 */
export async function getCylinderByQrOrSerial(
  hospitalId: string,
  code: string
): Promise<ApiResponse<OxygenCylinderWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      // Always trim the code first to avoid whitespace causing silent failures
      let cleanCode = code.trim();
      if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
        try {
          const url = new URL(cleanCode);
          const segments = url.pathname.split('/').filter(Boolean);
          if (segments.length > 0) {
            cleanCode = segments[segments.length - 1];
          }
        } catch (e) {}
      }

      // Safe hospital ID resolution (fallback to known valid hospital UUID if empty or uninitialized)
      let targetHospitalId = (hospitalId || '').trim();
      if (!targetHospitalId || targetHospitalId === 'undefined' || targetHospitalId === 'null') {
        targetHospitalId = '85bb6adc-b868-428b-83f4-e5af2f5cf904';
      }

      /**
       * Helper to fetch a cylinder and its relations by an exact QR or serial match.
       * Uses ilike (case-insensitive) so that O2-P101-F-BN-0044 and o2-p101-f-bn-0044 both work.
       */
      const fetchByExact = async (searchCode: string) => {
        try {
          const cleanSearch = searchCode.replace(/[,()"]/g, '').trim();
          if (!cleanSearch) return { data: null, error: null };

          let query = supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select(`
              *,
              size_info:pharmacy_oxygen_cylinder_sizes(*),
              type_info:pharmacy_oxygen_cylinder_types(*),
              department:departments(*)
            `)
            .or(`qr_code.ilike.${cleanSearch},serial_number.ilike.${cleanSearch}`);

          if (targetHospitalId) {
            query = query.eq('hospital_id', targetHospitalId);
          }

          const { data: rows, error } = await query.limit(2);

          if (error) {
            console.warn('fetchByExact query notice:', error);
            return { data: null, error: null };
          }
          if (!rows || rows.length === 0) return { data: null, error: null };
          if (rows.length === 1) return { data: rows[0], error: null };

          // If 2+ records match, sort by status priority (active/scannable first)
          const STATUS_PRIORITY: Record<string, number> = {
            available: 0,
            allocated: 1,
            in_use: 2,
            issued: 3,
            returned_to_supplier: 4,
          };
          const sorted = [...rows].sort((a, b) =>
            (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5)
          );
          return { data: sorted[0], error: null };
        } catch (e) {
          console.warn('fetchByExact exception:', e);
          return { data: null, error: null };
        }
      };

      // ── PASS 1: Exact match (case-insensitive) ──────────────────────────────
      let { data } = await fetchByExact(cleanCode);

      // ── PASS 2: Swap O2↔02 prefix (scanner character confusion) ────────────
      // e.g. scanner reads "02-P101-F-BN-0044" but DB has "O2-P101-F-BN-0044"
      if (!data) {
        let swappedCode = cleanCode
        if (cleanCode.startsWith('02-')) {
          swappedCode = 'O2-' + cleanCode.substring(3)
        } else if (/^O2-/i.test(cleanCode)) {
          swappedCode = '02-' + cleanCode.substring(3)
        }
        if (swappedCode !== cleanCode) {
          const { data: d2, error: e2 } = await fetchByExact(swappedCode)
          if (!e2 && d2) data = d2
        }
      }

      // ── PASS 3: Try stripping the "O2-" / "02-" prefix entirely ───────────
      // Some QR stickers print just "P101-F-BN-0044" without the O2 prefix.
      if (!data) {
        const withoutPrefix = cleanCode.replace(/^(?:O2-|02-)/i, '')
        if (withoutPrefix !== cleanCode) {
          const { data: d3, error: e3 } = await fetchByExact(withoutPrefix)
          if (!e3 && d3) data = d3
        }
      }

      // ── PASS 4: Wildcard suffix match ──────────────────────────────────────
      // Handles abbreviated codes where the valve-type segment is missing.
      // e.g. scanned "O2-P101-F-0044" but DB has "O2-P101-F-BN-0044" or "O2-P101-F-PI-0044".
      if (!data) {
        // Strip optional O2/02 prefix for pattern matching
        const stripped = cleanCode.replace(/^(?:O2-|02-)/i, '')
        // Extract the last 4-digit numeric segment and everything before it
        const suffixMatch = stripped.match(/^([A-Za-z0-9-]+?)-(\d{4})$/)
        if (suffixMatch) {
          const sizePart = suffixMatch[1]  // e.g. "P101-F"
          const numSuffix = suffixMatch[2] // e.g. "0044"

          const { data: wildcardData, error: wildcardErr } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select(`
              *,
              size_info:pharmacy_oxygen_cylinder_sizes(*),
              type_info:pharmacy_oxygen_cylinder_types(*),
              department:departments(*)
            `)
            .eq('hospital_id', hospitalId)
            .or([
              `serial_number.ilike.${sizePart}-%-${numSuffix}`,
              `serial_number.ilike.${sizePart}-${numSuffix}`,
              `qr_code.ilike.O2-${sizePart}-%-${numSuffix}`,
              `qr_code.ilike.O2-${sizePart}-${numSuffix}`,
              `qr_code.ilike.02-${sizePart}-%-${numSuffix}`,
              `qr_code.ilike.02-${sizePart}-${numSuffix}`,
            ].join(','))
            .limit(20)

          if (!wildcardErr && wildcardData && wildcardData.length > 0) {
            // Strict filter: ensure candidate serial or QR ends with exact -numSuffix
            const validCandidates = wildcardData.filter((c: any) => {
              const sn = (c.serial_number || '').toUpperCase()
              const qr = (c.qr_code || '').toUpperCase()
              return sn.endsWith(`-${numSuffix}`) || qr.endsWith(`-${numSuffix}`)
            })

            if (validCandidates.length > 0) {
              const STATUS_PRIORITY: Record<string, number> = {
                available: 0,
                allocated: 1,
                in_use: 2,
                issued: 3,
                returned_to_supplier: 4,
              }
              const sorted = [...validCandidates].sort((a, b) =>
                (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5)
              )
              data = sorted[0]
            }
          }
        }
      }

      // ── PASS 5: Contains / Partial Query Match (e.g. "sabox", "saboxy", "0071") ──
      if (!data && cleanCode.length >= 2) {
        const { data: containsData } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .select(`
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*),
            type_info:pharmacy_oxygen_cylinder_types(*),
            department:departments(*)
          `)
          .eq('hospital_id', hospitalId)
          .or(`serial_number.ilike.%${cleanCode}%,qr_code.ilike.%${cleanCode}%`)
          .limit(5)

        if (containsData && containsData.length > 0) {
          data = containsData[0]
        }
      }

      if (!data) return { data: null, error: 'Cylinder not found' }

      // Fetch combos to manually map display_name
      const { data: combos } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select('size_id, type_id, display_name')

      const comboMap = new Map<string, string>()
      ;(combos || []).forEach((c: any) => {
        comboMap.set(`${c.size_id}_${c.type_id}`, c.display_name)
      })

      const displayName = comboMap.get(`${data.cylinder_size_id}_${data.cylinder_type_id}`) || 'Standard Cylinder'
      const mapped = {
        ...data,
        type_info: {
          ...data.type_info,
          type_name: displayName
        },
        current_location: {
          location_name: data.current_location || 'Central Store'
        },
        assigned_ward: data.department ? {
          department_name: data.department.department_name || data.department.name
        } : null
      } as unknown as OxygenCylinderWithRelations

      return { data: mapped, error: null }
    }

    // Mock search fallback
    const matched = mockOxygenCylinders.find(
      c => c.serial_number.toLowerCase() === code.toLowerCase() ||
           (c.qr_code_value && c.qr_code_value.toLowerCase() === code.toLowerCase())
    )

    if (matched) {
      return { data: matched, error: null }
    }

    return { data: null, error: 'Cylinder not found' }
  } catch (error) {
    console.error('Error finding cylinder:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to retrieve cylinder information'
    }
  }
}

/**
 * Auto-registers an unknown cylinder directly on scan and synchronises with Supabase.
 * Useful for scanning physical tags during audit/reconciliation when the inventory table is being repopulated.
 */
export async function registerScannedCylinderOnTheFly(
  hospitalId: string,
  rawCode: string,
  options?: {
    location?: string
    status?: string
    userId?: string
    userName?: string
    preferredSizeCode?: string
    preferredTypeCode?: string
  }
): Promise<ApiResponse<OxygenCylinderWithRelations>> {
  try {
    let cleanCode = (rawCode || '').trim()
    if (!cleanCode) {
      return { data: null, error: 'Invalid cylinder code.' }
    }

    if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
      try {
        const url = new URL(cleanCode);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          cleanCode = segments[segments.length - 1];
        }
      } catch (e) {}
    }
    cleanCode = cleanCode.replace(/[\r\n]+/g, ' ').trim();

    // Safe hospital ID resolution
    let targetHospitalId = (hospitalId || '').trim();
    if (!targetHospitalId || targetHospitalId === 'undefined' || targetHospitalId === 'null') {
      targetHospitalId = '85bb6adc-b868-428b-83f4-e5af2f5cf904';
    }

    const targetLocation = options?.location || 'Pharmacy Store'
    const isStore = targetLocation.toLowerCase().includes('store') || 
                    targetLocation.toLowerCase().includes('farmasi') || 
                    targetLocation.toLowerCase().includes('depot') || 
                    targetLocation === 'Pharmacy';

    // Status must adhere to DB constraint: ('available', 'issued', 'empty', 'damaged', 'returned_to_supplier')
    let dbStatus = options?.status;
    if (!dbStatus) {
      dbStatus = isStore ? 'available' : 'issued';
    } else {
      if (dbStatus === 'used' || dbStatus === 'in_use' || dbStatus === 'allocated') {
        dbStatus = 'issued';
      } else if (dbStatus === 'full') {
        dbStatus = isStore ? 'available' : 'issued';
      } else if (dbStatus === 'available' && !isStore) {
        // If at Emergency & Trauma or any Ward, cylinder is in use (issued)
        dbStatus = 'issued';
      } else if (!['available', 'issued', 'empty', 'damaged', 'returned_to_supplier'].includes(dbStatus)) {
        dbStatus = isStore ? 'available' : 'issued';
      }
    }

    if (isSupabaseConfigured()) {
      // 1. Check if cylinder already exists to update its location and audit data
      const existing = await getCylinderByQrOrSerial(targetHospitalId, cleanCode)
      if (existing.data && !existing.error) {
        const updatePayload: any = {
          current_location: targetLocation,
          scanned_location: targetLocation,
          status: dbStatus,
          updated_at: new Date().toISOString(),
          qr_tagged_at: new Date().toISOString(),
          last_reconciled_at: new Date().toISOString(),
        };
        if (options?.userId) updatePayload.qr_tagged_by = options.userId;
        if (options?.userName) updatePayload.scanned_by_name = options.userName;

        const { data: updated, error: updErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update(updatePayload)
          .eq('id', existing.data.id)
          .select(`
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*),
            type_info:pharmacy_oxygen_cylinder_types(*)
          `)
          .single();

        return { data: updated || existing.data, error: null }
      }

      // 2. Query available sizes and types from Supabase
      const [sizesRes, typesRes, combosRes] = await Promise.all([
        supabase.from('pharmacy_oxygen_cylinder_sizes').select('*'),
        supabase.from('pharmacy_oxygen_cylinder_types').select('*'),
        supabase.from('pharmacy_oxygen_size_type_combos').select('*')
      ])

      const sizes = sizesRes.data || []
      const types = typesRes.data || []
      const combos = combosRes.data || []

      // 3. Smart resolution of Size & Valve Type from the scanned code
      const upper = cleanCode.toUpperCase()
      let resolvedSize = sizes.find(s => s.code === options?.preferredSizeCode)
      let resolvedType = types.find(t => t.code === options?.preferredTypeCode)

      if (!resolvedSize) {
        if (upper.includes('P101-HS') || upper.includes('P101HS')) {
          resolvedSize = sizes.find(s => s.code === 'P101-HS')
        } else if (upper.includes('P101-D') || upper.includes('P101D')) {
          resolvedSize = sizes.find(s => s.code === 'P101-D')
        } else if (upper.includes('P101-E') || upper.includes('P101E')) {
          resolvedSize = sizes.find(s => s.code === 'P101-E')
        } else if (upper.includes('P101-F') || upper.includes('P101F')) {
          resolvedSize = sizes.find(s => s.code === 'P101-F')
        } else if (upper.includes('101-N') || upper.includes('101N')) {
          resolvedSize = sizes.find(s => s.code === '101-N')
        } else if (upper.includes('101-F') || upper.includes('101F')) {
          resolvedSize = sizes.find(s => s.code === '101-F')
        }
      }

      // Default fallback size (P101-F is the most common standard cylinder)
      if (!resolvedSize) {
        resolvedSize = sizes.find(s => s.code === 'P101-F') || sizes[0]
      }

      if (!resolvedType) {
        if (upper.includes('-PI') || upper.includes('PIN') || upper.includes('PIN INDEX')) {
          resolvedType = types.find(t => t.code === 'PI')
        } else if (upper.includes('-BN') || upper.includes('BULL') || upper.includes('BULLNOSE')) {
          resolvedType = types.find(t => t.code === 'BN')
        } else {
          // Default valve according to size standards
          if (resolvedSize?.code === 'P101-D' || resolvedSize?.code === 'P101-E' || resolvedSize?.code === '101-F') {
            resolvedType = types.find(t => t.code === 'PI') || types[0]
          } else {
            resolvedType = types.find(t => t.code === 'BN') || types[0]
          }
        }
      }

      if (!resolvedType) {
        resolvedType = types[0]
      }

      // 4. Insert new cylinder row
      const payload: any = {
        hospital_id: targetHospitalId,
        serial_number: cleanCode,
        qr_code: cleanCode,
        qr_code_value: cleanCode,
        cylinder_size_id: resolvedSize?.id,
        cylinder_type_id: resolvedType?.id,
        status: dbStatus,
        current_location: targetLocation,
        scanned_location: targetLocation,
        scanned_by_name: options?.userName || null,
        qr_tagged_by: options?.userId || null,
        supplier_tagged: Boolean(resolvedSize?.is_loan),
        supplier_tag_source: resolvedSize?.is_loan ? 'scanned_auto_reg' : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        qr_tagged_at: new Date().toISOString(),
        last_reconciled_at: new Date().toISOString()
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .insert(payload)
        .select(`
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*)
        `)
        .single()

      if (insertErr) throw insertErr

      // 5. Write audit log
      try {
        await supabase.from('audit_logs').insert({
          user_id: options?.userId || 'AUTO_SCANNER',
          action: 'AUTO_REGISTER_ON_SCAN',
          module: 'OXYGEN_INVENTORY',
          entity_type: 'pharmacy_oxygen_cylinder_inventory',
          entity_id: inserted.id,
          new_values: {
            serial_number: cleanCode,
            size_code: resolvedSize?.code,
            type_code: resolvedType?.code,
            location: targetLocation,
            status: dbStatus
          },
          created_at: new Date().toISOString()
        })
      } catch (logErr) {
        console.warn('Audit log write error:', logErr)
      }

      // 6. Build display name
      const matchingCombo = combos.find(c => c.size_id === resolvedSize?.id && c.type_id === resolvedType?.id)
      const capStr = resolvedSize?.capacity ? String(resolvedSize.capacity) : '1.4'
      const displayName = matchingCombo?.display_name || (
        resolvedSize?.is_loan
          ? `Loan ${resolvedSize.code} (${capStr}M³)`
          : `Standard ${resolvedSize?.code || ''} ${resolvedType?.code || ''} (${capStr}M³)`
      )

      const mapped: OxygenCylinderWithRelations = {
        ...inserted,
        size_info: resolvedSize,
        qr_code_value: cleanCode,
        type_info: {
          ...inserted.type_info,
          type_name: displayName
        },
        current_location: {
          location_name: targetLocation
        }
      } as unknown as OxygenCylinderWithRelations

      return { data: mapped, error: null }
    }

    return { data: null, error: 'Database is not configured.' }
  } catch (error) {
    console.error('Error auto-registering cylinder:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to register cylinder on scan.'
    }
  }
}

/**
 * Updates a cylinder status to 'empty' (ready for supplier return)
 */
export async function markCylinderAsEmpty(
  hospitalId: string,
  cylinderId: string,
  userId: string
): Promise<ApiResponse<OxygenCylinderWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch current cylinder state for movement logging
      const { data: cyl, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('*')
        .eq('id', cylinderId)
        .single()

      if (fetchErr) throw fetchErr

      // 2. Update status to empty and relocate to Store
      const { data: updated, error: updateErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .update({
          status: 'empty',
          current_location: 'Pharmacy Store',
          department_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cylinderId)
        .select('*')
        .single()

      if (updateErr) throw updateErr

      // 3. Log empty reporting movement
      const { error: moveErr } = await supabase
        .from('pharmacy_oxygen_cylinder_movements')
        .insert({
          hospital_id: hospitalId,
          cylinder_id: cylinderId,
          movement_type: 'returned_from_dept',
          from_location: cyl.current_location || 'Department',
          to_location: 'Pharmacy Store',
          department_id: cyl.department_id,
          moved_by: userId,
          moved_at: new Date().toISOString(),
          remarks: 'Reported as depleted / empty from Ward.'
        })

      if (moveErr) console.error('Error logging cylinder empty movement:', moveErr)

      return { data: updated as unknown as OxygenCylinderWithRelations, error: null }
    }

    // Mock implementation fallback
    const matched = mockOxygenCylinders.find(c => c.id === cylinderId)
    if (matched) {
      matched.status = 'empty'
      matched.current_location = { location_name: 'Pharmacy Store' }
      return { data: matched, error: null }
    }

    return { data: null, error: 'Cylinder not found' }
  } catch (error) {
    console.error('Error updating cylinder empty status:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update cylinder status to empty.'
    }
  }
}

/**
 * Batch updates multiple cylinders to 'empty' (ready for supplier return)
 */
export async function markMultipleCylindersAsEmpty(
  hospitalId: string,
  cylinderIds: string[],
  userId: string
): Promise<ApiResponse<number>> {
  try {
    if (!cylinderIds || cylinderIds.length === 0) {
      return { data: 0, error: null }
    }

    if (isSupabaseConfigured()) {
      const { data: cyls, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select('id, current_location, department_id')
        .in('id', cylinderIds)

      if (fetchErr) throw fetchErr

      const { error: updateErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .update({
          status: 'empty',
          current_location: 'Pharmacy Store',
          department_id: null,
          updated_at: new Date().toISOString()
        })
        .in('id', cylinderIds)

      if (updateErr) throw updateErr

      const movements = (cyls || []).map(cyl => ({
        hospital_id: hospitalId,
        cylinder_id: cyl.id,
        movement_type: 'returned_from_dept',
        from_location: cyl.current_location || 'Department',
        to_location: 'Pharmacy Store',
        department_id: cyl.department_id,
        moved_by: userId,
        moved_at: new Date().toISOString(),
        remarks: 'Reported as depleted / empty from Ward.'
      }))

      if (movements.length > 0) {
        await supabase.from('pharmacy_oxygen_cylinder_movements').insert(movements)
      }

      return { data: cylinderIds.length, error: null }
    }

    // Mock fallback
    cylinderIds.forEach(id => {
      const matched = mockOxygenCylinders.find(c => c.id === id)
      if (matched) {
        matched.status = 'empty'
        matched.current_location = { location_name: 'Pharmacy Store' }
      }
    })

    return { data: cylinderIds.length, error: null }
  } catch (error) {
    console.error('Error batch marking cylinders as empty:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark cylinders as empty.'
    }
  }
}

/**
 * Updates a return document and logs the action
 */
export async function updateReturnDocument(
  documentId: string,
  updates: { returned_date: string; supplier_id: string; status: 'draft' | 'completed' | 'cancelled'; remarks: string },
  reason: string,
  userId: string
): Promise<ApiResponse<any>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: oldDoc, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchErr) throw fetchErr

      const { data: updatedDoc, error: updateErr } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .update({
          returned_date: updates.returned_date,
          supplier_id: updates.supplier_id,
          status: updates.status,
          remarks: updates.remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select('*')
        .single()

      if (updateErr) throw updateErr

      const { error: logErr } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'EDIT_RETURN_DOCUMENT',
        module: 'OXYGEN_INVENTORY',
        entity_type: 'return_document',
        entity_id: documentId,
        old_values: oldDoc,
        new_values: { ...updates, edit_reason: reason },
        created_at: new Date().toISOString()
      })

      if (logErr) console.error('Error writing audit log for edit return doc:', logErr)

      return { data: updatedDoc, error: null }
    }

    return { data: { id: documentId, ...updates }, error: null }
  } catch (error) {
    console.error('Error updating return document:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update return document' }
  }
}

/**
 * Updates cylinders list associated with a return document
 */
export async function updateReturnDocumentCylinders(
  documentId: string,
  newCylinderIds: string[]
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch current cylinder IDs
      const { data: currentItems, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_return_document_items')
        .select('cylinder_id')
        .eq('return_document_id', documentId);

      if (fetchErr) throw fetchErr;

      const currentCylinderIds = (currentItems || []).map((x: any) => x.cylinder_id).filter(Boolean);

      const cleanNewCylinderIds = (newCylinderIds || []).filter(Boolean);
      const removedIds = currentCylinderIds.filter(id => !cleanNewCylinderIds.includes(id));
      const addedIds = cleanNewCylinderIds.filter(id => !currentCylinderIds.includes(id));

      // 2. Handle removed cylinders (revert status back to 'issued' and location to 'Store')
      if (removedIds.length > 0) {
        const { error: deleteErr } = await supabase
          .from('pharmacy_oxygen_return_document_items')
          .delete()
          .eq('return_document_id', documentId)
          .in('cylinder_id', removedIds);

        if (deleteErr) throw deleteErr;

        const { error: revertErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update({
            status: 'issued',
            current_location: 'Store',
            updated_at: new Date().toISOString()
          })
          .in('id', removedIds);

        if (revertErr) throw revertErr;
      }

      // 3. Handle added cylinders (mark as returned_to_supplier and location to 'Supplier')
      if (addedIds.length > 0) {
        const insertRows = addedIds.map(cid => ({
          return_document_id: documentId,
          cylinder_id: cid
        }));

        const { error: insertErr } = await supabase
          .from('pharmacy_oxygen_return_document_items')
          .insert(insertRows);

        if (insertErr) throw insertErr;

        const { error: updateErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update({
            status: 'returned_to_supplier',
            current_location: 'Supplier',
            department_id: null,
            updated_at: new Date().toISOString()
          })
          .in('id', addedIds);

        if (updateErr) throw updateErr;
      }

      return { data: { success: true }, error: null };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error updating return document cylinders:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update return document cylinders' };
  }
}

/**
 * Deletes a return document and logs the action
 */
export async function deleteReturnDocument(
  documentId: string,
  reason: string,
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: oldDoc, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchErr) throw fetchErr

      const { error: deleteErr } = await supabase
        .from('pharmacy_oxygen_return_documents')
        .delete()
        .eq('id', documentId)

      if (deleteErr) throw deleteErr

      const { error: logErr } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'DELETE_RETURN_DOCUMENT',
        module: 'OXYGEN_INVENTORY',
        entity_type: 'return_document',
        entity_id: documentId,
        old_values: oldDoc,
        new_values: { delete_reason: reason },
        created_at: new Date().toISOString()
      })

      if (logErr) console.error('Error writing audit log for delete return doc:', logErr)

      return { data: true, error: null }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting return document:', error)
    return { data: false, error: error instanceof Error ? error.message : 'Failed to delete return document' }
  }
}

/**
 * Updates a request document and logs the action
 */
export async function updateRequestDocument(
  documentId: string,
  updates: { requested_date: string; supplier_id: string; status: 'draft' | 'completed' | 'cancelled'; remarks: string },
  reason: string,
  userId: string
): Promise<ApiResponse<any>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: oldDoc, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchErr) throw fetchErr

      const { data: updatedDoc, error: updateErr } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .update({
          requested_date: updates.requested_date,
          supplier_id: updates.supplier_id,
          status: updates.status,
          remarks: updates.remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select('*')
        .single()

      if (updateErr) throw updateErr

      const { error: logErr } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'EDIT_REQUEST_DOCUMENT',
        module: 'OXYGEN_INVENTORY',
        entity_type: 'request_document',
        entity_id: documentId,
        old_values: oldDoc,
        new_values: { ...updates, edit_reason: reason },
        created_at: new Date().toISOString()
      })

      if (logErr) console.error('Error writing audit log for edit request doc:', logErr)

      return { data: updatedDoc, error: null }
    }

    return { data: { id: documentId, ...updates }, error: null }
  } catch (error) {
    console.error('Error updating request document:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update request document' }
  }
}

/**
 * Deletes a request document and logs the action
 */
export async function deleteRequestDocument(
  documentId: string,
  reason: string,
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: oldDoc, error: fetchErr } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchErr) throw fetchErr

      const { error: deleteErr } = await supabase
        .from('pharmacy_oxygen_request_documents')
        .delete()
        .eq('id', documentId)

      if (deleteErr) throw deleteErr

      const { error: logErr } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'DELETE_REQUEST_DOCUMENT',
        module: 'OXYGEN_INVENTORY',
        entity_type: 'request_document',
        entity_id: documentId,
        old_values: oldDoc,
        new_values: { delete_reason: reason },
        created_at: new Date().toISOString()
      })

      if (logErr) console.error('Error writing audit log for delete request doc:', logErr)

      return { data: true, error: null }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting request document:', error)
    return { data: false, error: error instanceof Error ? error.message : 'Failed to delete request document' }
  }
}

/**
 * Clear/reset cylinder inventory for hospital to start fresh with 0 stock until newly scanned.
 */
export async function clearCylinderInventory(
  hospitalId: string,
  userId?: string,
  passwordAttempt?: string
): Promise<ApiResponse<boolean>> {
  try {
    // 1. Password Protection Enforcement
    if (passwordAttempt !== 'F@rmasi.2016') {
      return {
        data: false,
        error: 'Akses Ditolak: Kata laluan pentadbir tidak sah (Access Denied: Invalid admin password).'
      }
    }

    if (isSupabaseConfigured()) {
      // 2. Write Audit Log for High-Risk Action
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId || 'SYSTEM_ADMIN',
          action: 'CLEAR_RESET_CYLINDER_INVENTORY_STOCK',
          module: 'OXYGEN_INVENTORY',
          entity_type: 'cylinder_inventory_fleet',
          entity_id: hospitalId,
          new_values: {
            reason: 'Administrator authorized full stock clear for fresh scanning',
            timestamp: new Date().toISOString(),
            hospital_id: hospitalId,
            status: 'EXECUTED_SUCCESS'
          },
          created_at: new Date().toISOString()
        })
      } catch (logErr) {
        console.warn('Could not write audit log:', logErr)
      }

      // 3. Clear child items referencing cylinders to avoid FK constraints
      try {
        await supabase.from('pharmacy_oxygen_stock_adjustments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (childErr) {
        console.warn('Could not clear pharmacy_oxygen_stock_adjustments:', childErr)
      }
      try {
        await supabase.from('pharmacy_oxygen_return_document_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (childErr) {
        console.warn('Could not clear pharmacy_oxygen_return_document_items:', childErr)
      }
      try {
        await supabase.from('pharmacy_oxygen_reception_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (childErr) {
        console.warn('Could not clear pharmacy_oxygen_reception_items:', childErr)
      }
      try {
        await supabase.from('pharmacy_oxygen_consumption').delete().eq('hospital_id', hospitalId)
      } catch (childErr) {
        console.warn('Could not clear pharmacy_oxygen_consumption:', childErr)
      }

      // DO NOT delete pharmacy_oxygen_dept_requests or pharmacy_oxygen_dept_request_items!
      // Request records are real transaction history and must never be deleted when clearing stock inventory.

      // 4. Attempt direct delete of inventory
      const { error: deleteErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .delete()
        .eq('hospital_id', hospitalId)

      if (deleteErr) {
        console.warn('Direct delete failed (HTTP 409 FK Conflict / RLS), switching to written_off status update:', deleteErr)

        // 5. Fallback: Update status to 'written_off' (or 'disposed') and unassign department_id
        const { error: writtenOffErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update({
            status: 'written_off',
            current_location: 'Written Off',
            department_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('hospital_id', hospitalId)

        if (writtenOffErr) {
          console.warn('written_off status update failed, trying disposed:', writtenOffErr)
          const { error: disposedErr } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update({
              status: 'disposed',
              current_location: 'Disposed',
              department_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('hospital_id', hospitalId)

          if (disposedErr) throw disposedErr
        }
      }

      return { data: true, error: null }
    }
    return { data: true, error: null }
  } catch (err: any) {
    console.error('Error clearing cylinder inventory:', err)
    return { data: false, error: err.message || 'Failed to clear inventory' }
  }
}

/**
 * Updates a cylinder's valve type (e.g. between Bullnose 'BN' and Pin Index 'PI')
 */
export async function updateCylinderValveType(
  hospitalId: string,
  cylinderId: string,
  targetTypeCode: 'BN' | 'PI'
): Promise<ApiResponse<any>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Get type ID for targetTypeCode
      const { data: typeRow, error: typeErr } = await supabase
        .from('pharmacy_oxygen_cylinder_types')
        .select('id')
        .eq('code', targetTypeCode)
        .single()

      if (typeErr || !typeRow) throw new Error(typeErr?.message || `Type ${targetTypeCode} not found`)

      // 2. Update cylinder
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .update({
          cylinder_type_id: typeRow.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', cylinderId)
        .select(`
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    }
    return { data: null, error: null }
  } catch (err) {
    console.error('Error updating cylinder valve type:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to update valve type'
    }
  }
}








