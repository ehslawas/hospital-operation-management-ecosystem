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

    // 2. Add cylinders to inventory and record movement
    for (const cyl of cylinders) {
      // Upsert inventory
      const { data: inventoryItem, error: invError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .upsert({
          hospital_id: data.hospital_id,
          cylinder_size_id: cyl.cylinder_size_id,
          cylinder_type_id: cyl.cylinder_type_id,
          qr_code: cyl.qr_code,
          serial_number: cyl.serial_number,
          status: 'available',
          current_location: 'Store',
        })
        .select()
        .single()

      if (invError) throw invError

      // Record movement
      const { error: moveError } = await supabase.from('pharmacy_oxygen_cylinder_movements').insert({
        hospital_id: data.hospital_id,
        cylinder_id: inventoryItem.id,
        movement_type: 'received',
        from_location: 'Supplier',
        to_location: 'Store',
        moved_by: data.created_by,
        remarks: `Received via DO ${data.delivery_order_no}`,
      })

      if (moveError) throw moveError

      // Link to reception record
      const { error: itemError } = await supabase.from('pharmacy_oxygen_reception_items').insert({
        reception_id: record.id,
        cylinder_id: inventoryItem.id,
        cylinder_size_id: cyl.cylinder_size_id,
        cylinder_type_id: cyl.cylinder_type_id,
        unit_price: cyl.refill_price + cyl.loan_price
      })

      if (itemError) throw itemError
    }

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
    const { error: updateError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .update({
        status: newStatus,
        current_location: location,
      })
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
    if (kpisRes.error) throw new Error(kpisRes.error)

    // 2. Get Inventory Stats and Usage
    const { data: inv, error: invError } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*), type_info:pharmacy_oxygen_cylinder_types(*)')
      .eq('hospital_id', hospitalId)

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

    // Aggregate inventory by size/type
    const inventoryMap: Record<string, any> = {}

    // Pre-populate with sizes
    allSizes?.forEach(s => {
      const key = `Medical Oxygen-${s.code}`
      inventoryMap[key] = {
        size_code: s.code,
        type_code: 'MO', // Default or fetch if available
        type_name: 'Medical Oxygen',
        capacity: s.capacity,
        unit: s.unit,
        total: 0,
        available: 0,
        empty: 0,
        issued: 0,
        avg_usage_month: 0
      }
    })

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

    // Usage stats
    usageMovements?.forEach((move: any) => {
      const sizeId = move.cylinder?.cylinder_size_id
      if (sizeId) {
        const s = allSizes?.find(x => x.id === sizeId)
        if (s) {
          const key = `Medical Oxygen-${s.code}`
          if (inventoryMap[key]) inventoryMap[key].avg_usage_month++
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
        kpis: kpisRes.data!,
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
      .upsert(settings)

    if (error) throw error
    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update' }
  }
}

/**
 * Find a cylinder by its QR code
 */
export async function findCylinderByQR(
  hospitalId: string,
  qrCode: string
): Promise<ApiResponse<OxygenCylinderInventoryWithRelations | null>> {
  try {
    const { data, error } = await supabase
      .from('pharmacy_oxygen_cylinder_inventory')
      .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*), type_info:pharmacy_oxygen_cylinder_types(*)')
      .eq('hospital_id', hospitalId)
      .eq('qr_code', qrCode)
      .maybeSingle()

    if (error) throw error
    return { data: data as OxygenCylinderInventoryWithRelations, error: null }
  } catch (error) {
    console.error('Error finding cylinder by QR:', error)
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
  items: {
    size: string
    count: number
  }[]
  cylinders: {
    id: string
    qr_code: string
    status: 'available' | 'empty' | 'issued' | 'damaged' | 'returned_to_supplier'
    size_code: string
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
        department:departments(id, department_name),
        size_info:cylinder_size_id(code)
      `)
      .eq('hospital_id', hospitalId)
      .neq('status', 'maintenance')

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
      // In the schema: current_location is often 'Store' or 'Department'
      // If it's 'Department', department_id should be present.
      if (item.current_location === 'Store' || (!item.department_id && (!item.current_location || item.current_location === 'Store'))) {
        locEntry = storeEntry
      } else if (item.department) {
        locEntry = ensureLocation(item.department.id, item.department.department_name, 'department')
      } else if (item.current_location && item.current_location !== 'Department') {
        // If it's a string like 'Ward 1' directly in current_location
        locEntry = ensureLocation(item.current_location, item.current_location, 'department')
      } else {
        // Fallback
        locEntry = storeEntry
      }

      // Update Counts
      locEntry.total_cylinders++
      if (item.status === 'empty') {
        locEntry.empty_cylinders++
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
        status: item.status,
        size_code: sizeCode
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
