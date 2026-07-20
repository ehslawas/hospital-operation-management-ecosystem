import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type {
  CylinderMaintenance,
  CylinderMaintenanceWithRelations
} from '@/types/pharmacy'

export async function getCylinderMaintenanceRequests(
  hospitalId: string
): Promise<ApiResponse<CylinderMaintenanceWithRelations[]>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: [], error: 'Supabase is not configured' }
    }

    const { data, error } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance')
      .select(`
        *,
        supplier:suppliers(id, company_name),
        requested_by_user:users(id, full_name)
      `)
      .eq('hospital_id', hospitalId)
      .order('requested_date', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err: any) {
    console.error('Error fetching maintenance requests:', err)
    return { data: [], error: err.message || 'Failed to fetch maintenance requests' }
  }
}

export async function getCylinderMaintenanceDetails(
  id: string
): Promise<ApiResponse<CylinderMaintenanceWithRelations | null>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' }
    }

    const { data: parent, error: parentError } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance')
      .select(`
        *,
        supplier:suppliers(id, company_name),
        requested_by_user:users(id, full_name)
      `)
      .eq('id', id)
      .single()

    if (parentError) throw parentError
    if (!parent) return { data: null, error: null }

    const { data: items, error: itemsError } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance_items')
      .select(`
        *,
        cylinder:pharmacy_oxygen_cylinder_inventory(
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*)
        )
      `)
      .eq('maintenance_id', id)

    if (itemsError) throw itemsError

    return {
      data: {
        ...parent,
        items: items || []
      },
      error: null
    }
  } catch (err: any) {
    console.error('Error fetching maintenance details:', err)
    return { data: null, error: err.message || 'Failed to fetch maintenance details' }
  }
}

export async function createCylinderMaintenanceRequest(
  data: {
    hospital_id: string
    supplier_id?: string | null
    budget_source?: 'warrant' | 'appl' | 'cc' | 'lp' | null
    justification?: string | null
    notes?: string | null
    requested_by: string
    items: {
      cylinder_id: string
      maintenance_type: 'replacing_valve' | 'painting' | 'general_maintenance' | 'hydrostatic_testing' | 'other'
      cost: number
      notes?: string | null
    }[]
  }
): Promise<ApiResponse<CylinderMaintenance | null>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' }
    }

    // Generate unique maintenance number
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '') // YYMM
    const rand = Math.floor(1000 + Math.random() * 9000)
    const maintenanceNo = `MNT-${dateStr}-${rand}`

    const totalCost = data.items.reduce((sum, item) => sum + item.cost, 0)

    // Insert parent record
    const { data: parent, error: parentError } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance')
      .insert({
        hospital_id: data.hospital_id,
        maintenance_no: maintenanceNo,
        supplier_id: data.supplier_id || null,
        budget_source: data.budget_source || null,
        justification: data.justification || null,
        notes: data.notes || null,
        requested_by: data.requested_by,
        total_cost: totalCost,
        status: 'draft'
      })
      .select()
      .single()

    if (parentError) throw parentError

    // Insert items
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map(item => ({
        maintenance_id: parent.id,
        cylinder_id: item.cylinder_id,
        maintenance_type: item.maintenance_type,
        cost: item.cost,
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_oxygen_cylinder_maintenance_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Update cylinder status to maintenance
      const cylinderIds = data.items.map(i => i.cylinder_id)
      const { error: cylUpdateError } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .update({ status: 'maintenance' })
        .in('id', cylinderIds)

      if (cylUpdateError) {
        console.error('Warning: Failed to update cylinder statuses to maintenance:', cylUpdateError)
      }
    }

    return { data: parent, error: null }
  } catch (err: any) {
    console.error('Error creating maintenance request:', err)
    return { data: null, error: err.message || 'Failed to create maintenance request' }
  }
}

export async function updateCylinderMaintenanceRequest(
  id: string,
  data: {
    supplier_id?: string | null
    budget_source?: 'warrant' | 'appl' | 'cc' | 'lp' | null
    justification?: string | null
    notes?: string | null
    items: {
      cylinder_id: string
      maintenance_type: 'replacing_valve' | 'painting' | 'general_maintenance' | 'hydrostatic_testing' | 'other'
      cost: number
      notes?: string | null
    }[]
  }
): Promise<ApiResponse<void>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' }
    }

    // Get old items to restore their cylinder status
    const { data: oldItems } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance_items')
      .select('cylinder_id')
      .eq('maintenance_id', id)

    const totalCost = data.items.reduce((sum, item) => sum + item.cost, 0)

    // Update parent
    const { error: parentError } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance')
      .update({
        supplier_id: data.supplier_id || null,
        budget_source: data.budget_source || null,
        justification: data.justification || null,
        notes: data.notes || null,
        total_cost: totalCost
      })
      .eq('id', id)

    if (parentError) throw parentError

    // Delete old items
    const { error: deleteError } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance_items')
      .delete()
      .eq('maintenance_id', id)

    if (deleteError) throw deleteError

    // Insert new items
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map(item => ({
        maintenance_id: id,
        cylinder_id: item.cylinder_id,
        maintenance_type: item.maintenance_type,
        cost: item.cost,
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('pharmacy_oxygen_cylinder_maintenance_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    // Update cylinder statuses
    const oldCylIds = (oldItems || []).map(i => i.cylinder_id)
    const newCylIds = data.items.map(i => i.cylinder_id)
    const removedCylIds = oldCylIds.filter(id => !newCylIds.includes(id))

    if (removedCylIds.length > 0) {
      await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .update({ status: 'empty' })
        .in('id', removedCylIds)
    }

    if (newCylIds.length > 0) {
      await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .update({ status: 'maintenance' })
        .in('id', newCylIds)
    }

    return { data: null, error: null }
  } catch (err: any) {
    console.error('Error updating maintenance request:', err)
    return { data: null, error: err.message || 'Failed to update maintenance request' }
  }
}

export async function updateCylinderMaintenanceStatus(
  id: string,
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_supplier' | 'in_progress' | 'completed' | 'cancelled',
  completionDate?: string | null
): Promise<ApiResponse<void>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' }
    }

    const updateFields: any = { status }
    if (status === 'completed') {
      updateFields.completion_date = completionDate || new Date().toISOString()
    }

    const { error: parentError } = await supabase
      .from('pharmacy_oxygen_cylinder_maintenance')
      .update(updateFields)
      .eq('id', id)

    if (parentError) throw parentError

    // If completed or cancelled, release/update the cylinders back to 'empty'
    if (status === 'completed' || status === 'cancelled') {
      const { data: items } = await supabase
        .from('pharmacy_oxygen_cylinder_maintenance_items')
        .select('cylinder_id')
        .eq('maintenance_id', id)

      if (items && items.length > 0) {
        const cylinderIds = items.map(i => i.cylinder_id)
        const { error: cylError } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .update({ status: 'empty' })
          .in('id', cylinderIds)

        if (cylError) throw cylError
      }
    }

    return { data: null, error: null }
  } catch (err: any) {
    console.error('Error updating maintenance status:', err)
    return { data: null, error: err.message || 'Failed to update maintenance status' }
  }
}
