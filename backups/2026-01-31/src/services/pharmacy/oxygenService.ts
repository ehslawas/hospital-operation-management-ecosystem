/**
 * Pharmacy Oxygen Management Service
 * Handles medical oxygen cylinder tracking, reception, and inventory management.
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  OxygenCylinderSize,
  OxygenCylinderType,
  OxygenReceptionRecord,
  OxygenReceptionRecordWithRelations,
  OxygenCylinderInventoryWithRelations,
  OxygenCylinderMovementWithRelations,
  OxygenDashboardKPIs,
  OxygenSummary,
  OxygenPricingConfig,
  OxygenSystemSettings,
} from '@/types/pharmacy'

/**
 * Get all oxygen cylinder sizes
 */
export async function getOxygenCylinderSizes(): Promise<ApiResponse<OxygenCylinderSize[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_cylinder_sizes')
      .select('*')
      .order('code', { ascending: true })

    if (error) throw error
    return { data: data as OxygenCylinderSize[], error: null }
  } catch (error) {
    console.error('Error fetching oxygen cylinder sizes:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Get all oxygen cylinder types
 */
export async function getOxygenCylinderTypes(): Promise<ApiResponse<OxygenCylinderType[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_cylinder_types')
      .select('*')
      .order('code', { ascending: true })

    if (error) throw error
    return { data: data as OxygenCylinderType[], error: null }
  } catch (error) {
    console.error('Error fetching oxygen cylinder types:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Get oxygen reception records
 */
export async function getOxygenReceptionRecords(
  hospitalId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<OxygenReceptionRecordWithRelations>>> {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .select(`
        *, 
        created_by_user:users(*),
        items:pharmacy_oxygen_reception_items(
          *,
          cylinder:pharmacy_oxygen_cylinder_inventory(*),
          cylinder_size:pharmacy_oxygen_cylinder_sizes(*),
          cylinder_type:pharmacy_oxygen_cylinder_types(*)
        )
      `, { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .order('reception_date', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: {
        data: data as OxygenReceptionRecordWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching reception records:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Create a new oxygen reception record and update inventory
 */
export async function createOxygenReceptionRecord(
  data: Omit<OxygenReceptionRecord, 'id' | 'created_at' | 'updated_at' | 'total_amount'>,
  cylinders: Array<{
    cylinder_size_id: string
    cylinder_type_id: string
    qr_code: string
    serial_number?: string
    refill_price: number
    loan_price: number
  }>
): Promise<ApiResponse<OxygenReceptionRecord>> {
  try {
    // 1. Create reception record
    const { data: record, error: recordError } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .insert(data)
      .select()
      .single()

    if (recordError) throw recordError

    // 2. Prepare inventory data for bulk upsert
    const inventoryData = cylinders.map(cyl => ({
      hospital_id: data.hospital_id,
      cylinder_size_id: cyl.cylinder_size_id,
      cylinder_type_id: cyl.cylinder_type_id,
      qr_code: cyl.qr_code.trim(),
      serial_number: cyl.serial_number?.trim(),
      status: 'available',
      current_location: 'Store',
    }))

    // Perform bulk upsert and retrieve IDs
    const { data: inventoryItems, error: invError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .upsert(inventoryData, { onConflict: 'qr_code' })
      .select('id, qr_code')

    if (invError) throw invError
    if (!inventoryItems) throw new Error('Failed to retrieve inventory items after bulk upsert')

    // Create a map for quick ID lookup by QR code
    const inventoryMap = new Map(inventoryItems.map(item => [item.qr_code, item.id]))

    // 3. Prepare bulk movements and reception items
    const movementData: any[] = []
    const itemData: any[] = []

    for (const cyl of cylinders) {
      const inventoryId = inventoryMap.get(cyl.qr_code.trim())
      if (!inventoryId) continue

      movementData.push({
        hospital_id: data.hospital_id,
        cylinder_id: inventoryId,
        movement_type: 'received',
        from_location: 'Supplier',
        to_location: 'Store',
        moved_by: data.created_by,
        remarks: `Received via DO ${data.delivery_order_no}`,
      })

      itemData.push({
        reception_id: record.id,
        cylinder_id: inventoryId,
        cylinder_size_id: cyl.cylinder_size_id,
        cylinder_type_id: cyl.cylinder_type_id,
        unit_price: cyl.refill_price + cyl.loan_price
      })
    }

    // 4. Execute batch inserts
    const [moveRes, itemRes] = await Promise.all([
      supabase.from('pharmacy_oxygen_cylinder_movements').insert(movementData),
      supabase.from('pharmacy_oxygen_reception_items').insert(itemData)
    ])

    if (moveRes.error) throw moveRes.error
    if (itemRes.error) throw itemRes.error

    return { data: record as OxygenReceptionRecord, error: null }
  } catch (error) {
    console.error('Error creating reception record:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create' }
  }
}

/**
 * Get oxygen cylinder inventory
 */
export async function getOxygenCylinderInventory(
  hospitalId: string,
  filters: {
    status?: string
    size_id?: string
    type_id?: string
    search?: string
  },
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<OxygenCylinderInventoryWithRelations>>> {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*), type_info:pharmacy_oxygen_cylinder_types(*)', {
        count: 'exact',
      })
      .eq('hospital_id', hospitalId)

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.size_id) query = query.eq('cylinder_size_id', filters.size_id)
    if (filters.type_id) query = query.eq('cylinder_type_id', filters.type_id)
    if (filters.search) {
      query = query.or(`qr_code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: {
        data: data as OxygenCylinderInventoryWithRelations[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching cylinder inventory:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Update cylinder status and record movement
 */
export async function updateCylinderStatus(
  hospitalId: string,
  cylinderId: string,
  newStatus: string,
  location: string,
  userId: string,
  remarks?: string
): Promise<ApiResponse<void>> {
  try {
    // 1. Get current status/location
    const { data: current, error: getError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('status, current_location')
      .eq('id', cylinderId)
      .single()

    if (getError) throw getError

    // 2. Update inventory
    const updatePayload: any = {
      status: newStatus,
      current_location: location,
    }

    // Clear department assignment if cylinder is returned/empty/available (back in store)
    if (['empty', 'returned_to_supplier', 'available'].includes(newStatus)) {
      updatePayload.department_id = null
    }

    const { error: updateError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .update(updatePayload)
      .eq('id', cylinderId)

    if (updateError) throw updateError

    // 3. Record movement
    let movementType: 'received' | 'issued' | 'returned_from_dept' | 'sent_to_supplier' = 'issued'
    if (newStatus === 'available') movementType = 'received'
    if (newStatus === 'empty') movementType = 'returned_from_dept'
    if (newStatus === 'returned_to_supplier') movementType = 'sent_to_supplier'

    const { error: moveError } = await supabase.from('pharmacy_oxygen_cylinder_movements').insert({
      hospital_id: hospitalId,
      cylinder_id: cylinderId,
      movement_type: movementType,
      from_location: current.current_location,
      to_location: location,
      moved_by: userId,
      remarks: remarks || `Status updated to ${newStatus}`,
    })

    if (moveError) throw moveError

    return { data: null, error: null }
  } catch (error) {
    console.error('Error updating cylinder status:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update' }
  }
}

/**
 * Get cylinder movement history
 */
export async function getCylinderMovements(
  cylinderId: string
): Promise<ApiResponse<OxygenCylinderMovementWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_cylinder_movements')
      .select('*, moved_by_user:users(*)')
      .eq('cylinder_id', cylinderId)
      .order('moved_at', { ascending: false })

    if (error) throw error
    return { data: data as OxygenCylinderMovementWithRelations[], error: null }
  } catch (error) {
    console.error('Error fetching cylinder movements:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Get Oxygen Dashboard KPIs (Financial)
 * Vote Code: 080702, Activity: 27402
 */
export async function getOxygenDashboardKPIs(hospitalId: string): Promise<ApiResponse<OxygenDashboardKPIs>> {
  try {
    const voteCode = '080702'
    const activity = '27402'

    // 1. Get Warrants (Allocation)
    const { data: warrants, error: wError } = await supabase
      .from('pharmacy_warrants')
      .select('amount')
      .eq('hospital_id', hospitalId)
      .eq('vote_code', voteCode)
      .eq('vote_activity', activity)

    if (wError) throw wError

    // 2. Get Expenses (from reception records)
    const { data: receptions, error: rError } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .select('refill_amount, loan_amount, total_amount, status')
      .eq('hospital_id', hospitalId)
      .eq('vote_code', voteCode)
      .eq('vote_activity', activity)

    if (rError) throw rError

    const totalAllocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0)
    const totalRefillExpenses = receptions
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.refill_amount || 0), 0)
    const totalLoanAmount = receptions
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.loan_amount || 0), 0)
    const totalLiabilities = receptions
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + Number(r.refill_amount || 0), 0)

    return {
      data: {
        cc_allocation: totalAllocation,
        total_allocation: totalAllocation,
        expense: totalRefillExpenses,
        balance: totalAllocation - totalRefillExpenses,
        liabilities: totalLiabilities,
        net_expenses: totalRefillExpenses + totalLiabilities,
        loan_total: totalLoanAmount,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching oxygen KPIs:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Get overall oxygen summary for dashboard
 */
export async function getOxygenSummary(hospitalId: string): Promise<ApiResponse<OxygenSummary>> {
  try {
    // 1. Get KPIs
    const kpisRes = await getOxygenDashboardKPIs(hospitalId)
    // Silently handle KPI errors to ensure inventory data still loads
    if (kpisRes.error) {
      console.warn('Failed to load Oxygen KPIs, defaulting to zero:', kpisRes.error)
    }
    const kpis = kpisRes.data || {
      cc_allocation: 0,
      total_allocation: 0,
      expense: 0,
      balance: 0,
      liabilities: 0,
      net_expenses: 0,
      loan_total: 0
    }

    // 2. Get Inventory Stats and Usage (only cylinders with a valid department)
    const { data: inv, error: invError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*), type_info:pharmacy_oxygen_cylinder_types(*)')
      .eq('hospital_id', hospitalId)
      .not('department_id', 'is', null) // Exclude cylinders without assigned department

    if (invError) throw invError

    // Get all sizes to ensure they appear even if 0 stock
    const { data: allSizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('*')

    // Get Usage (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: usageMovements } = await supabase
      .from('pharmacy_oxygen_cylinder_movements')
      .select('*, cylinder:pharmacy_oxygen_cylinder_inventory(cylinder_size_id, cylinder_type_id)')
      .eq('hospital_id', hospitalId)
      .eq('movement_type', 'issued')
      .gte('moved_at', thirtyDaysAgo.toISOString())

    // Aggregate inventory by size/type - NO pre-population to avoid empty 'MO' entries
    const inventoryMap: Record<string, any> = {}

    inv.forEach((item: any) => {
      const sizeCode = item.size_info?.code || 'Unknown'
      const typeCode = item.type_info?.code || 'MO'
      const typeName = item.type_info?.name || 'Medical Oxygen'
      const key = `${typeName}-${sizeCode}`

      if (!inventoryMap[key]) {
        inventoryMap[key] = {
          size_code: sizeCode,
          type_code: typeCode,
          type_name: typeName,
          capacity: item.size_info?.capacity || 0,
          unit: item.size_info?.unit || 'm3',
          total: 0,
          available: 0,
          empty: 0,
          issued: 0,
          avg_usage_month: 0
        }
      }

      inventoryMap[key].total++
      if (item.status === 'available') {
        inventoryMap[key].available++
      } else if (item.status === 'empty') {
        inventoryMap[key].empty++
      } else if (item.status === 'issued') {
        inventoryMap[key].issued++
      }
    })

    // Usage stats - find matching inventory entries by size code
    usageMovements?.forEach((move: any) => {
      const sizeId = move.cylinder?.cylinder_size_id
      if (sizeId) {
        const s = allSizes?.find(x => x.id === sizeId)
        if (s) {
          // Find matching inventory entries by size_code
          Object.keys(inventoryMap).forEach(key => {
            if (inventoryMap[key].size_code === s.code) {
              inventoryMap[key].avg_usage_month++
            }
          })
        }
      }
    })

    // 3. Get Recent Receptions
    const { data: recentReceptions, error: recError } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('reception_date', { ascending: false })
      .limit(5)

    if (recError) throw recError

    const full_cylinders = inv.filter((c: any) => c.status === 'available').length
    const empty_cylinders = inv.filter((c: any) => c.status === 'empty').length
    const issued_cylinders = inv.filter((c: any) => c.status === 'issued').length
    const maintenance_cylinders = inv.filter((c: any) => c.status === 'damaged').length

    // Aggregate by type
    const typeCounts: Record<string, number> = {}
    inv.forEach((c: any) => {
      const typeName = c.type_info?.name || 'Unknown'
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1
    })

    return {
      data: {
        kpis: kpis,
        inventory_summary: Object.values(inventoryMap),
        recent_receptions: recentReceptions as OxygenReceptionRecord[],
        total_cylinders: inv.length,
        full_cylinders,
        empty_cylinders,
        in_use_cylinders: issued_cylinders,
        maintenance_cylinders,
        cylinders_by_type: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
        daily_consumption: 0, // Placeholder or calculate if possible
        monthly_consumption: 0, // Placeholder or calculate if possible
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching oxygen summary:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}
/**
 * Get pricing configuration for oxygen cylinder refills
 */
export async function getOxygenPricingConfig(hospitalId: string): Promise<ApiResponse<OxygenPricingConfig[]>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_pricing_config')
      .select('*')
      .or(`hospital_id.eq.${hospitalId},hospital_id.is.null`)
      .order('effective_from', { ascending: false })

    if (error) throw error

    // Group by cylinder_size_code and take the latest
    const latestPrices: Record<string, OxygenPricingConfig> = {}
    data.forEach((price: any) => {
      if (!latestPrices[price.cylinder_size_code]) {
        latestPrices[price.cylinder_size_code] = price
      }
    })

    return { data: Object.values(latestPrices), error: null }
  } catch (error) {
    console.error('Error fetching pricing config:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Get system settings for oxygen (loan rate, etc)
 */
export async function getOxygenSystemSettings(hospitalId: string): Promise<ApiResponse<OxygenSystemSettings>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_system_settings')
      .select('*')
      .eq('hospital_id', hospitalId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      // Return defaults if not set
      return {
        data: {
          hospital_id: hospitalId,
          loan_cylinder_rate: 14.00,
        },
        error: null,
      }
    }

    return { data: data as OxygenSystemSettings, error: null }
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

/**
 * Update refill price for a cylinder size
 */
export async function updateOxygenPricing(
  hospitalId: string,
  priceConfig: Omit<OxygenPricingConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('pharmacy_oxygen_pricing_config')
      .insert({
        ...priceConfig,
        hospital_id: hospitalId,
      })

    if (error) throw error
    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error updating pricing:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update' }
  }
}

/**
 * Update oxygen system settings
 */
export async function updateOxygenSystemSettings(
  settings: OxygenSystemSettings
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('pharmacy_oxygen_system_settings')
      .upsert(settings, { onConflict: 'hospital_id' })

    if (error) throw error
    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update' }
  }
}

/**
 * Find a cylinder by its QR code or Serial Number
 */
export async function findCylinderByQR(
  hospitalId: string,
  identifier: string
): Promise<ApiResponse<OxygenCylinderInventoryWithRelations | null>> {
  try {
    const term = identifier.trim()
    const { data, error } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*), type_info:pharmacy_oxygen_cylinder_types(*), department:departments(id, department_name)')
      .eq('hospital_id', hospitalId)
      .or(`qr_code.ilike.${term},serial_number.ilike.${term}`)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data: data as OxygenCylinderInventoryWithRelations, error: null }
  } catch (error) {
    console.error('Error finding cylinder by ID:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to find cylinder' }
  }
}

/**
 * Register new cylinders (Bulk)
 * Used by QR Generator to persist cylinders to DB
 */
export async function registerNewCylinders(
  hospitalId: string,
  cylinders: Array<{
    qr_code: string
    serial_number: string
    size_code: string
    type_name: string
  }>
): Promise<ApiResponse<void>> {
  try {
    // 1. Resolve size and type IDs first
    const { data: sizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id, code')
    const { data: types } = await supabase.from('pharmacy_oxygen_cylinder_types').select('id, name')

    if (!sizes || !types) throw new Error('Failed to load metadata')

    const cylinderData = cylinders.map(cyl => {
      const sizeId = sizes.find(s => s.code === cyl.size_code)?.id
      const typeId = types.find(t => t.name === cyl.type_name)?.id

      if (!sizeId || !typeId) return null

      return {
        hospital_id: hospitalId,
        qr_code: cyl.qr_code.trim(),
        serial_number: cyl.serial_number.trim(),
        cylinder_size_id: sizeId,
        cylinder_type_id: typeId,
        status: 'available',
        current_location: 'Store'
      }
    }).filter(Boolean)

    if (cylinderData.length === 0) throw new Error('No valid cylinder data to insert')

    // 2. Bulk upsert
    // using upsert with ignoreDuplicates: true (or onConflict action)
    // For now, standard insert. If conflict, it will throw.
    const { error } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .upsert(cylinderData as any, { onConflict: 'qr_code' }) // Upsert based on unique QR

    if (error) throw error

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error registering cylinders:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to register' }
  }
}


export interface LocationInventory {
  location_id: string
  location_name: string
  type: 'store' | 'department'
  total_cylinders: number
  available_cylinders: number
  empty_cylinders: number
  issued_cylinders: number
  items: {
    size: string
    count: number
  }[]
  cylinders: {
    id: string
    qr_code: string
    status: 'available' | 'empty' | 'issued' | 'damaged' | 'returned_to_supplier'
    size_code: string
    location?: string
    updated_at?: string
    created_at?: string
    last_reconciled_at?: string
  }[]
}

/**
* Get detailed oxygen distribution by location
*/
export async function getOxygenDistribution(hospitalId: string): Promise<ApiResponse<LocationInventory[]>> {
  try {
    // 1. Fetch all inventory with department and size info
    const { data: inventory, error } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select(`
        id,
        qr_code,
        current_location,
        department_id,
        status,
        cylinder_size_id,
        updated_at,
        created_at,
        last_reconciled_at,
        department:departments(id, department_name),
        size_info:pharmacy_oxygen_cylinder_sizes(code)
      `)
      .eq('hospital_id', hospitalId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // 2. Group by Location
    const locationMap = new Map<string, LocationInventory>()

    const ensureLocation = (id: string, name: string, type: 'store' | 'department') => {
      if (!locationMap.has(id)) {
        locationMap.set(id, {
          location_id: id,
          location_name: name,
          type,
          total_cylinders: 0,
          available_cylinders: 0,
          empty_cylinders: 0,
          issued_cylinders: 0,
          items: [],
          cylinders: []
        })
      }
      return locationMap.get(id)!
    }

    // Initialize Store
    const storeEntry = ensureLocation('Store', 'Medical Cylinder Store', 'store')

    inventory?.forEach((item: any) => {
      let locEntry: LocationInventory

      // Determine Location Logic
      // 0. If returned to supplier, strictly assign to Store (regardless of old department_id)
      if (item.status === 'returned_to_supplier') {
        locEntry = storeEntry
      }
      // 1. If it has a department assigned
      else if (item.department) {
        locEntry = ensureLocation(item.department.id, item.department.department_name, 'department')
      }
      // 2. If it has a custom location string that's not 'Store' or 'Department'
      else if (item.current_location && item.current_location !== 'Store' && item.current_location !== 'Department') {
        locEntry = ensureLocation(item.current_location, item.current_location, 'department')
      }
      // 3. Fallback to Store
      else {
        locEntry = storeEntry
      }

      // Update Counts
      // Don't count 'returned_to_supplier' in the total active cylinders for the location if it's a department (though we forced it to store above, so this is safe)
      locEntry.total_cylinders++
      if (item.status === 'empty') {
        locEntry.empty_cylinders++
      } else if (item.status === 'issued') {
        locEntry.issued_cylinders++
      } else {
        locEntry.available_cylinders++
      }

      // Track Size Breakdown
      const sizeCode = item.size_info?.code || 'Unknown'
      const existingItem = locEntry.items.find(i => i.size === sizeCode)
      if (existingItem) {
        existingItem.count++
      } else {
        locEntry.items.push({ size: sizeCode, count: 1 })
      }

      // Track Individual Cylinders
      locEntry.cylinders.push({
        id: item.id,
        qr_code: item.qr_code,
        status: item.status as any,
        size_code: sizeCode,
        location: (item.current_location === 'Store' && item.department)
          ? item.department.department_name
          : (item.current_location || 'Store'),
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_reconciled_at: item.last_reconciled_at
      })
    })

    // Sort items within locations
    locationMap.forEach(loc => {
      loc.items.sort((a, b) => a.size.localeCompare(b.size))
    })

    // Convert map to array, Store first, then Departments alphabetically
    const result = Array.from(locationMap.values()).sort((a, b) => {
      if (a.type === 'store') return -1
      if (b.type === 'store') return 1
      return a.location_name.localeCompare(b.location_name)
    })

    return { data: result, error: null }

  } catch (error) {
    console.error('Error fetching oxygen distribution:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch' }
  }
}

export const deleteOxygenReceptionRecord = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { data: undefined, error: null }
  } catch (err) {
    console.error('Failed to delete oxygen record', err)
    return { data: undefined, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export const updateOxygenReceptionRecord = async (id: string, updates: Partial<OxygenReceptionRecord>): Promise<ApiResponse<OxygenReceptionRecord>> => {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as OxygenReceptionRecord, error: null }
  } catch (err) {
    console.error('Failed to update oxygen record', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Wipe all registry data for a hospital
 * DANGER: This is a destructive operation
 */
export async function clearOxygenCylinderRegistry(hospitalId: string): Promise<ApiResponse<void>> {
  try {
    // 1. Delete movements first (FK constraint)
    const { error: moveError } = await supabase
      .from('pharmacy_oxygen_cylinder_movements')
      .delete()
      .eq('hospital_id', hospitalId)

    if (moveError) throw moveError

    // 2. Delete inventory
    const { error: invError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .delete()
      .eq('hospital_id', hospitalId)

    if (invError) throw invError

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error clearing registry:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to clear registry' }
  }
}

/**
 * Delete specific registry data by size and type
 */
export async function deleteCylindersBySizeAndType(
  hospitalId: string,
  sizeId: string,
  typeId?: string
): Promise<ApiResponse<void>> {
  try {
    // 1. Get cylinder IDs first to delete movements (Cascade is usually handled by DB, but safe to do here)
    let query = supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('id')
      .eq('hospital_id', hospitalId)
      .eq('cylinder_size_id', sizeId)

    if (typeId) {
      query = query.eq('cylinder_type_id', typeId)
    }

    const { data: cylinders, error: fetchError } = await query
    if (fetchError) throw fetchError

    if (!cylinders || cylinders.length === 0) return { data: undefined, error: null }

    const cylinderIds = cylinders.map(c => c.id)

    // 2. Delete movements
    const { error: moveError } = await supabase
      .from('pharmacy_oxygen_cylinder_movements')
      .delete()
      .in('cylinder_id', cylinderIds)

    if (moveError) throw moveError

    // 3. Delete inventory
    const { error: invError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .delete()
      .in('id', cylinderIds)

    if (invError) throw invError

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error deleting cylinders by size/type:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete records' }
  }
}

/**
 * Get Oxygen Analytics Data
 * - Monthly usage by cylinder type (Refill Count/Cost)
 * - Monthly loan analytics (Loan Count/Cost)
 * - Quarterly summary
 */
export async function getOxygenAnalytics(hospitalId: string, year: number) {
  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // 1. Fetch all completed reception records for the year
    const { data: records, error } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .select(`
        *,
        items:pharmacy_oxygen_reception_items(
          *,
          cylinder_size:pharmacy_oxygen_cylinder_sizes(*),
          cylinder_type:pharmacy_oxygen_cylinder_types(*)
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('status', 'completed')
      .gte('reception_date', startDate)
      .lte('reception_date', endDate)
      .order('reception_date', { ascending: true })

    if (error) throw error

    // Initialize containers for 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 1)
      return d.toLocaleString('default', { month: 'short' })
    })

    // Data Structures
    const usageByType: Record<string, number[]> = {} // "Type-Size": [Jan, Feb, ...]
    const costByType: Record<string, number[]> = {}
    const loanCounts = new Array(12).fill(0)
    const loanCosts = new Array(12).fill(0)

    // Helper to get month index (0-11)
    const getMonthIdx = (dateStr: string) => new Date(dateStr).getMonth()

    records?.forEach(record => {
      const mIdx = getMonthIdx(record.reception_date)

      // Calculate effective loan rate for THIS specific record (History Safe)
      const loanItems = record.items?.filter((i: any) => !i.cylinder_size?.code?.toUpperCase().startsWith('P')) || []
      let effectiveRecordLoanRate = 14.00 // Default fallback for very old records

      if (loanItems.length > 0 && record.loan_amount !== undefined && record.loan_amount !== null) {
        effectiveRecordLoanRate = Number(record.loan_amount) / loanItems.length
      }

      record.items?.forEach((item: any) => {
        const sizeCode = item.cylinder_size?.code || 'Unknown'
        const capacity = item.cylinder_size?.capacity ? `(${item.cylinder_size.capacity}m3)` : ''

        // Logic: Hospital owned (starts with P) vs Loan (others)
        const isHospitalOwned = sizeCode.toUpperCase().startsWith('P')
        const typeName = `Medical Oxygen - ${sizeCode} ${capacity}`.trim()

        // 1. Usage (Refills) - Applied to ALL cylinders
        if (!usageByType[typeName]) {
          usageByType[typeName] = new Array(12).fill(0)
          costByType[typeName] = new Array(12).fill(0)
        }

        // Count represents one cylinder refill
        usageByType[typeName][mIdx] += 1

        // Refill Cost
        // If loan cylinder, refill price is unit_price - effectiveRecordLoanRate
        // If hospital cylinder, refill price is full unit_price
        let refillCost = Number(item.unit_price || 0)
        if (!isHospitalOwned) {
          refillCost = Math.max(0, refillCost - effectiveRecordLoanRate)

          // 2. Loan Analytics - Only for non-P cylinders
          loanCounts[mIdx] += 1
          loanCosts[mIdx] += effectiveRecordLoanRate
        }

        costByType[typeName][mIdx] += refillCost
      })
    })

    // Format for Recharts
    const monthlyUsage = months.map((month, idx) => {
      const entry: any = { name: month, totalRefills: 0, totalRefillCost: 0 }
      Object.keys(usageByType).forEach(type => {
        entry[type] = usageByType[type][idx]
        entry[`${type}_cost`] = costByType[type][idx]
        entry.totalRefills += usageByType[type][idx]
        entry.totalRefillCost += costByType[type][idx]
      })
      return entry
    })

    const monthlyLoans = months.map((month, idx) => ({
      name: month,
      count: loanCounts[idx],
      cost: loanCosts[idx]
    }))

    // Quarterly Stats per Type
    // Q1: 0-2, Q2: 3-5, Q3: 6-8, Q4: 9-11
    const quarterlyBreakdown: any[] = []

    Object.keys(usageByType).forEach(type => {
      const months = usageByType[type]
      const q1 = months[0] + months[1] + months[2]
      const q2 = months[3] + months[4] + months[5]
      const q3 = months[6] + months[7] + months[8]
      const q4 = months[9] + months[10] + months[11]

      quarterlyBreakdown.push({
        type,
        q1,
        q2,
        q3,
        q4,
        total: q1 + q2 + q3 + q4,
        avg_q1: Math.round(q1 / 3),
        avg_q2: Math.round(q2 / 3),
        avg_q3: Math.round(q3 / 3),
        avg_q4: Math.round(q4 / 3)
      })
    })

    // Sort by type name
    quarterlyBreakdown.sort((a, b) => a.type.localeCompare(b.type))

    return {
      data: {
        monthly_usage: monthlyUsage,
        monthly_loans: monthlyLoans,
        quarterly_stats: quarterlyBreakdown,
        cylinder_types: Object.keys(usageByType)
      },
      error: null
    }

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch analytics' }
  }
}

/**
 * Recalculate and Update Prices for an existing reception
 * This updates both the header totals and individual item unit prices
 */
export async function updateOxygenReceptionPrices(
  receptionId: string,
  updates: {
    refill_amount: number
    loan_amount: number
    items: Array<{
      id: string
      unit_price: number
    }>
  }
): Promise<ApiResponse<void>> {
  try {
    // 1. Update Header
    const { error: headerError } = await supabase
      .from('pharmacy_oxygen_reception_records')
      .update({
        refill_amount: updates.refill_amount,
        loan_amount: updates.loan_amount,
        // Trigger total_amount computation if DB trigger exists, or update it manually if needed but schema implies generated?
        // Let's assume we update only components. If total_amount is stored, we should update it too.
        total_amount: updates.refill_amount + updates.loan_amount
      })
      .eq('id', receptionId)

    if (headerError) throw headerError

    // 2. Update Items (Bulk Upsert)
    // We only update ID and unit_price. We need to respect other fields so upsert relies on ID match.
    // However, upsert might require other non-nullable fields if we are not careful? 
    // Actually, 'update' on a list of IDs is hard.
    // We will loop for safety as batch size is small (usually <50 items).
    // Or use upsert with a restricted column set if we had the full objects.
    // Given we only have ID and price, independent updates are safer unless we fetch-modify-upsert.

    // Optimizing: Use Promise.all 
    const itemUpdates = updates.items.map(item =>
      supabase
        .from('pharmacy_oxygen_reception_items')
        .update({ unit_price: item.unit_price })
        .eq('id', item.id)
    )

    const results = await Promise.all(itemUpdates)
    const firstError = results.find(r => r.error)?.error
    if (firstError) throw firstError

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error recalculating prices:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update prices' }
  }
}

/**
 * TEMPORARY: Recover 101-N Cylinders using Adjustment Logs (Smart Recovery)
 * Parses the "remarks" field from pharmacy_oxygen_stock_adjustments
 */
export async function recoverFromAdjustmentLogs(hospitalId: string): Promise<void> {
  try {
    console.log('Starting Smart Recovery for 101-N...')

    // 1. Get 101-N Size ID
    const { data: size } = await supabase
      .from('pharmacy_oxygen_cylinder_sizes')
      .select('id')
      .eq('code', '101-N')
      .single()

    if (!size) {
      console.error('Size 101-N not found')
      return
    }

    // 2. Fetch all 101-N cylinders
    const { data: cylinders } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('id, qr_code')
      .eq('hospital_id', hospitalId)
      .eq('cylinder_size_id', size.id)

    if (!cylinders || cylinders.length === 0) return

    console.log(`Checking ${cylinders.length} cylinders...`)
    let restoredCount = 0

    // 3. For each cylinder, look for recent "Adjustment" logs (last 48 hours)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    for (const cyl of cylinders) {
      const { data: logs } = await supabase
        .from('pharmacy_oxygen_stock_adjustments')
        .select('*')
        .eq('cylinder_id', cyl.id)
        .gte('created_at', twoDaysAgo)
        .order('created_at', { ascending: false })
        .limit(1)

      if (logs && logs.length > 0) {
        const log = logs[0]
        const remarks = log.remarks || ''

        // Format: "Bulk Update: Location=GW, Dept=2fa7..."
        const deptMatch = remarks.match(/Dept[=:]\s*([a-f0-9\-]+)/i)
        const locationMatch = remarks.match(/Location[=:]\s*([^,]+)/i)

        if (deptMatch && deptMatch[1] && deptMatch[1] !== 'N/A' && deptMatch[1] !== 'undefined' && deptMatch[1] !== 'null') {
          const deptId = deptMatch[1]
          const location = locationMatch ? locationMatch[1].trim() : 'Department'

          // Determine status based on location.
          // If location is 'Pharmacy Logistic' or 'Store', it should be 'available' (Ready).
          // Otherwise, if it's a ward/department, it is 'issued' (In Use).
          const isStore = /pharmacy|store/i.test(location)
          const newStatus = isStore ? 'available' : 'issued'

          await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update({
              status: newStatus,
              current_location: location,
              department_id: deptId
            })
            .eq('id', cyl.id)

          restoredCount++
          console.log(`Restored ${cyl.qr_code} to Dept ${deptId}`)
        }
      }
    }

    // 4. FINAL SAFEGUARD: Force all 101-N in "Pharmacy Logistic" to be 'available'
    // This fixes any that might have been missed by the log parsing or found themselves in Store but with 'In Use' status.

    // First, find the Pharmacy Logistic department ID
    const { data: pharmDept } = await supabase
      .from('departments')
      .select('id')
      .ilike('department_name', '%Pharmacy logistic%')
      .maybeSingle()

    let query = supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .update({ status: 'available' })
      .eq('cylinder_size_id', size.id)
      .eq('status', 'issued')

    if (pharmDept) {
      // If we found the department, check strictly for it OR the string location
      query = query.or(`current_location.ilike.%Pharmacy logistic%,department_id.eq.${pharmDept.id}`)
    } else {
      // Fallback to just string match
      query = query.ilike('current_location', '%Pharmacy logistic%')
    }

    const { error: fixError } = await query

    if (fixError) {
      console.error('Error fixing Pharmacy Logistic status:', fixError)
    } else {
      console.log('Safeguard applied: Checked for 101-N in Pharmacy Logistic.')
    }

    console.log(`Smart Recovery Complete. Restored ${restoredCount} cylinders.`)
    alert(`Smart Recovery Complete. Restored ${restoredCount} cylinders to their previous departments based on Adjustment Logs.`)

  } catch (e) {
    console.error('Smart Recovery failed', e)
    alert('Recovery failed. See console for details.')
  }
}



