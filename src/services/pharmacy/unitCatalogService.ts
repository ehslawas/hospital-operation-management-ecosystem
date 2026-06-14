/**
 * Unit Catalog Service
 * Handles unit catalog management, change tracking, and inventory count syncing
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import type {
  UnitCatalog,
  UnitCatalogWithRelations,
  UnitCatalogWithItemCounts,
  UnitCatalogChange,
  UnitCatalogChangeWithRelations,
  UnitCatalogFormData,
  UnitCatalogSummary,
  UnitCatalogFilter,
} from '@/types/pharmacy'
import { getDepartments } from '../accessRequestService'
import { getHospitalModules } from '../moduleService'
import { getCatalogItemCounts } from './unitCatalogItemService'
import { MODULE_DEFINITIONS } from '@/lib/constants'

/**
 * Get unit catalogs for a hospital with filters and item counts
 */
export async function getUnitCatalogs(
  hospitalId: string,
  filters?: UnitCatalogFilter
): Promise<ApiResponse<UnitCatalogWithItemCounts[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_unit_catalog')
        .select(`
          *,
          department:departments(id, department_code, department_name, head_of_department_id, status),
          responsible_user:users!pharmacy_unit_catalog_responsible_user_id_fkey(id, full_name, email, employee_id),
          last_updated_by_user:users!pharmacy_unit_catalog_last_updated_by_fkey(id, full_name, email)
        `)
        .eq('hospital_id', hospitalId)

      if (filters?.department_id) {
        query = query.eq('department_id', filters.department_id)
      }

      if (filters?.module_code && filters.module_code !== 'all') {
        query = query.eq('module_code', filters.module_code)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        // Note: This search won't work directly on joined tables, so we filter after fetching
        // For now, we'll do client-side filtering for search
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      let catalogs = (data || []) as UnitCatalogWithRelations[]

      // Get item counts for each catalog
      const catalogsWithCounts: UnitCatalogWithItemCounts[] = await Promise.all(
        catalogs.map(async (catalog) => {
          const countsResult = await getCatalogItemCounts(catalog.id)
          const counts = countsResult.data || {
            drug_items_count: 0,
            non_drug_items_count: 0,
            active_drug_items_count: 0,
            active_non_drug_items_count: 0,
          }

          return {
            ...catalog,
            drug_items_count: counts.drug_items_count,
            non_drug_items_count: counts.non_drug_items_count,
            active_drug_items_count: counts.active_drug_items_count,
            active_non_drug_items_count: counts.active_non_drug_items_count,
          }
        })
      )

      // Apply search filter (client-side since we can't search nested relations in Supabase)
      let filteredCatalogs = catalogsWithCounts
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredCatalogs = filteredCatalogs.filter((catalog) => {
          const deptName = catalog.department?.department_name?.toLowerCase() || ''
          const deptCode = catalog.department?.department_code?.toLowerCase() || ''
          return deptName.includes(searchLower) || deptCode.includes(searchLower)
        })
      }

      return { data: filteredCatalogs, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching unit catalogs:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch unit catalogs',
    }
  }
}

/**
 * Get a single unit catalog by ID
 */
export async function getUnitCatalog(
  id: string
): Promise<ApiResponse<UnitCatalogWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_unit_catalog')
        .select(`
          *,
          department:departments(*),
          responsible_user:users!pharmacy_unit_catalog_responsible_user_id_fkey(*),
          last_updated_by_user:users!pharmacy_unit_catalog_last_updated_by_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data: data as UnitCatalogWithRelations, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error fetching unit catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch unit catalog',
    }
  }
}

/**
 * Get unit catalog by department ID
 */
export async function getUnitCatalogByDepartment(
  departmentId: string
): Promise<ApiResponse<UnitCatalogWithRelations | null>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_unit_catalog')
        .select(`
          *,
          department:departments(*),
          responsible_user:users!pharmacy_unit_catalog_responsible_user_id_fkey(*),
          last_updated_by_user:users!pharmacy_unit_catalog_last_updated_by_fkey(*)
        `)
        .eq('department_id', departmentId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return { data: (data || null) as UnitCatalogWithRelations | null, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error fetching unit catalog by department:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch unit catalog',
    }
  }
}

/**
 * Create a new unit catalog entry
 */
export async function createUnitCatalog(
  hospitalId: string,
  userId: string,
  data: UnitCatalogFormData
): Promise<ApiResponse<UnitCatalog>> {
  try {
    if (isSupabaseConfigured()) {
      // Get department to determine module code if not provided
      let departments: Array<{ id: string; department_code: string; department_name: string; status: string }>
      try {
        departments = await getDepartments(hospitalId)
        if (!departments || departments.length === 0) {
          return {
            data: null,
            error: 'No departments found for this hospital',
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch departments',
        }
      }

      const department = departments.find((d) => d.id === data.department_id)
      if (!department) {
        return {
          data: null,
          error: 'Department not found',
        }
      }

      // Get module code from department or use provided one
      let moduleCode = data.module_code
      if (!moduleCode) {
        // Try to get module from hospital_modules that matches department
        const modulesResult = await getHospitalModules(hospitalId)
        if (modulesResult.data) {
          // Find module that matches department name
          const matchingModule = modulesResult.data.find(
            (m) => m.is_enabled && department.department_name.toLowerCase().includes(m.module_code.replace('_', ' '))
          )
          if (matchingModule) {
            moduleCode = matchingModule.module_code
          }
        }
      }

      if (!moduleCode) {
        return {
          data: null,
          error: 'Module code is required and could not be determined from department',
        }
      }

      const catalogData = {
        hospital_id: hospitalId,
        department_id: data.department_id,
        module_code: moduleCode,
        status: data.status,
        responsible_user_id: data.responsible_user_id || null,
        notes: data.notes || null,
        last_updated_at: new Date().toISOString(),
        last_updated_by: userId,
        last_update_reason: data.update_reason || null,
        // Keep these fields for backward compatibility but they won't be used
        can_indent_drugs: true,
        can_indent_non_drugs: true,
        current_drug_count: 0,
        current_non_drug_count: 0,
      }

      const { data: inserted, error } = await supabase
        .from('pharmacy_unit_catalog')
        .insert(catalogData)
        .select()
        .single()

      if (error) throw error

      return { data: inserted as UnitCatalog, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error creating unit catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create unit catalog',
    }
  }
}

/**
 * Update unit catalog entry
 */
export async function updateUnitCatalog(
  id: string,
  userId: string,
  data: Partial<UnitCatalogFormData> & { update_reason?: string }
): Promise<ApiResponse<UnitCatalog>> {
  try {
    if (isSupabaseConfigured()) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        last_updated_by: userId,
        last_update_reason: data.update_reason || null,
      }

      if (data.status !== undefined) updateData.status = data.status
      if (data.responsible_user_id !== undefined) updateData.responsible_user_id = data.responsible_user_id || null
      if (data.notes !== undefined) updateData.notes = data.notes || null
      if (data.module_code !== undefined) updateData.module_code = data.module_code

      const { data: updated, error } = await supabase
        .from('pharmacy_unit_catalog')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: updated as UnitCatalog, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error updating unit catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update unit catalog',
    }
  }
}

/**
 * Delete unit catalog entry
 */
export async function deleteUnitCatalog(
  id: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('pharmacy_unit_catalog')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { data: undefined, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error deleting unit catalog:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete unit catalog',
    }
  }
}

/**
 * Get change log for a unit catalog
 */
export async function getUnitCatalogChanges(
  catalogId: string,
  filters?: {
    field_name?: string
    startDate?: string
    endDate?: string
    changed_by?: string
  }
): Promise<ApiResponse<UnitCatalogChangeWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_unit_catalog_changes')
        .select(`
          *,
          changed_by_user:users!pharmacy_unit_catalog_changes_changed_by_fkey(id, full_name, email, employee_id)
        `)
        .eq('catalog_id', catalogId)

      if (filters?.field_name) {
        query = query.eq('field_name', filters.field_name)
      }

      if (filters?.startDate) {
        query = query.gte('changed_at', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('changed_at', filters.endDate)
      }

      if (filters?.changed_by) {
        query = query.eq('changed_by', filters.changed_by)
      }

      const { data, error } = await query.order('changed_at', { ascending: false })

      if (error) throw error

      return { data: (data || []) as UnitCatalogChangeWithRelations[], error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching unit catalog changes:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch change log',
    }
  }
}

/**
 * Sync current counts from stock transactions
 * This should be called periodically or when stock transactions occur
 */
export async function syncUnitCatalogCounts(
  hospitalId: string
): Promise<ApiResponse<{ synced: number; errors: string[] }>> {
  try {
    if (!isSupabaseConfigured()) {
      return { data: { synced: 0, errors: [] }, error: null }
    }

    // Get all unit catalogs for the hospital
    const catalogsResult = await getUnitCatalogs(hospitalId)
    if (catalogsResult.error || !catalogsResult.data) {
      return {
        data: null,
        error: catalogsResult.error || 'Failed to fetch unit catalogs',
      }
    }

    const errors: string[] = []
    let synced = 0

    for (const catalog of catalogsResult.data) {
      try {
        // Get stock locations for this department
        const { data: locations } = await supabase
          .from('pharmacy_stock_locations')
          .select('id')
          .eq('hospital_id', hospitalId)
          .like('location_name', `%${catalog.department?.department_name || ''}%`)
          .limit(10)

        if (!locations || locations.length === 0) {
          continue
        }

        const locationIds = locations.map((l) => l.id)

        // Count drug items in stock batches for these locations
        const { data: drugBatches } = await supabase
          .from('pharmacy_stock_batches')
          .select('quantity_on_hand', { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .eq('item_type', 'drug')
          .in('location_id', locationIds)
          .eq('status', 'available')

        const drugCount =
          drugBatches?.reduce((sum, batch) => sum + (Number(batch.quantity_on_hand) || 0), 0) || 0

        // Count non-drug items
        const { data: nonDrugBatches } = await supabase
          .from('pharmacy_stock_batches')
          .select('quantity_on_hand', { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .eq('item_type', 'non_drug')
          .in('location_id', locationIds)
          .eq('status', 'available')

        const nonDrugCount =
          nonDrugBatches?.reduce((sum, batch) => sum + (Number(batch.quantity_on_hand) || 0), 0) || 0

        // Update catalog counts
        const { error: updateError } = await supabase
          .from('pharmacy_unit_catalog')
          .update({
            current_drug_count: drugCount,
            current_non_drug_count: nonDrugCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', catalog.id)

        if (updateError) {
          errors.push(`Failed to update catalog ${catalog.id}: ${updateError.message}`)
        } else {
          synced++
        }
      } catch (error) {
        errors.push(`Error syncing catalog ${catalog.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      data: { synced, errors },
      error: null,
    }
  } catch (error) {
    console.error('Error syncing unit catalog counts:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync unit catalog counts',
    }
  }
}

/**
 * Get unit catalog summary statistics
 */
export async function getUnitCatalogSummary(
  hospitalId: string
): Promise<ApiResponse<UnitCatalogSummary>> {
  try {
    if (isSupabaseConfigured()) {
      const catalogsResult = await getUnitCatalogs(hospitalId)
      if (catalogsResult.error || !catalogsResult.data) {
        return {
          data: null,
          error: catalogsResult.error || 'Failed to fetch unit catalogs',
        }
      }

      const catalogs = catalogsResult.data

      // Get item counts for all catalogs
      const catalogsWithCounts = await Promise.all(
        catalogs.map(async (catalog) => {
          const countsResult = await getCatalogItemCounts(catalog.id)
          const counts = countsResult.data || {
            drug_items_count: 0,
            non_drug_items_count: 0,
            active_drug_items_count: 0,
            active_non_drug_items_count: 0,
          }
          return {
            ...catalog,
            ...counts,
          }
        })
      )

      const summary: UnitCatalogSummary = {
        total_units: catalogs.length,
        active_units: catalogs.filter((c) => c.status === 'active').length,
        inactive_units: catalogs.filter((c) => c.status === 'inactive').length,
        suspended_units: catalogs.filter((c) => c.status === 'suspended').length,
        units_with_items: catalogsWithCounts.filter(
          (c) => (c.drug_items_count || 0) > 0 || (c.non_drug_items_count || 0) > 0
        ).length,
        total_drug_items: catalogsWithCounts.reduce((sum, c) => sum + (c.drug_items_count || 0), 0),
        total_non_drug_items: catalogsWithCounts.reduce((sum, c) => sum + (c.non_drug_items_count || 0), 0),
        total_active_drug_items: catalogsWithCounts.reduce((sum, c) => sum + (c.active_drug_items_count || 0), 0),
        total_active_non_drug_items: catalogsWithCounts.reduce(
          (sum, c) => sum + (c.active_non_drug_items_count || 0),
          0
        ),
      }

      return { data: summary, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error fetching unit catalog summary:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch summary',
    }
  }
}

/**
 * Get available departments that can have catalogs (based on active modules)
 */
export async function getAvailableDepartments(
  hospitalId: string
): Promise<ApiResponse<Array<{ id: string; department_code: string; department_name: string; module_code: string }>>> {
  try {
    if (isSupabaseConfigured()) {
      // Get active modules
      const modulesResult = await getHospitalModules(hospitalId)
      if (modulesResult.error || !modulesResult.data) {
        return {
          data: null,
          error: modulesResult.error || 'Failed to fetch modules',
        }
      }

      const activeModules = modulesResult.data
        .filter((m) => m.is_enabled)
        .map((m) => String(m.module_code || ''))
        .filter((code) => code.length > 0)

      // Get all departments
      let departments: Array<{ id: string; department_code: string; department_name: string; status: string }>
      try {
        departments = await getDepartments(hospitalId)
        if (!departments || departments.length === 0) {
          return {
            data: [],
            error: null, // Return empty array, not an error - just no departments available
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch departments',
        }
      }

      // Helper function to normalize names for matching
      const normalizeName = (name: string): string => {
        return name
          .toLowerCase()
          .replace(/[&]/g, 'and')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      }

      // Create a map of module codes to their normalized names
      const moduleNameMap = new Map<string, string>()
      activeModules.forEach((moduleCode) => {
        const moduleDef = MODULE_DEFINITIONS.find((m) => m.code === moduleCode)
        if (moduleDef) {
          moduleNameMap.set(moduleCode, normalizeName(moduleDef.name))
        } else {
          // Fallback: convert module_code to readable name
          const moduleName = String(moduleCode).replace(/_/g, ' ')
          moduleNameMap.set(moduleCode, normalizeName(moduleName))
        }
      })

      // Filter departments that match active modules
      let availableDepartments = departments
        .filter((dept) => {
          const deptNameNormalized = normalizeName(String(dept.department_name || ''))
          const deptCodeNormalized = normalizeName(String(dept.department_code || ''))
          
          // Check if department name or code matches any active module
          return Array.from(moduleNameMap.entries()).some(([moduleCode, moduleNameNormalized]) => {
            // Exact match or contains match
            return (
              deptNameNormalized === moduleNameNormalized ||
              deptCodeNormalized === moduleNameNormalized ||
              deptNameNormalized.includes(moduleNameNormalized) ||
              moduleNameNormalized.includes(deptNameNormalized) ||
              // Also check if department code matches module code
              deptCodeNormalized.includes(String(moduleCode).replace(/_/g, ' ')) ||
              String(moduleCode).replace(/_/g, ' ').includes(deptCodeNormalized)
            )
          })
        })
        .map((dept) => {
          // Find matching module
          const deptNameNormalized = normalizeName(String(dept.department_name || ''))
          const deptCodeNormalized = normalizeName(String(dept.department_code || ''))
          
          const matchingModule = Array.from(moduleNameMap.entries()).find(([moduleCode, moduleNameNormalized]) => {
            return (
              deptNameNormalized === moduleNameNormalized ||
              deptCodeNormalized === moduleNameNormalized ||
              deptNameNormalized.includes(moduleNameNormalized) ||
              moduleNameNormalized.includes(deptNameNormalized) ||
              deptCodeNormalized.includes(String(moduleCode).replace(/_/g, ' ')) ||
              String(moduleCode).replace(/_/g, ' ').includes(deptCodeNormalized)
            )
          })

          return {
            id: String(dept.id || ''),
            department_code: String(dept.department_code || ''),
            department_name: String(dept.department_name || ''),
            module_code: matchingModule ? String(matchingModule[0]) : activeModules[0] || '',
          }
        })

      // If no departments matched but we have active modules, return all departments as fallback
      // This allows users to still create catalogs even if matching isn't perfect
      if (availableDepartments.length === 0 && activeModules.length > 0 && departments.length > 0) {
        console.warn(
          'No departments matched activated modules. Returning all departments as fallback.',
          { activeModules, departments: departments.map((d) => d.department_name) }
        )
        availableDepartments = departments.map((dept) => ({
          id: String(dept.id || ''),
          department_code: String(dept.department_code || ''),
          department_name: String(dept.department_name || ''),
          module_code: activeModules[0] || '', // Use first active module as default
        }))
      }

      return { data: availableDepartments, error: null }
    }

    return {
      data: null,
      error: 'Supabase not configured',
    }
  } catch (error) {
    console.error('Error fetching available departments:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch available departments',
    }
  }
}

