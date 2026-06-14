import { supabase } from './supabase'
import type { HospitalModule, HospitalModuleWithRelations, ModuleCode, ApiResponse } from '@/types'
import { MODULE_DEFINITIONS } from '@/lib/constants'

/**
 * Get modules for a hospital
 */
export async function getHospitalModules(
  hospitalId: string
): Promise<ApiResponse<HospitalModuleWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('hospital_modules')
      .select(
        `
        *,
        hospital:hospitals(*),
        enabled_by_user:users!hospital_modules_enabled_by_fkey(*),
        disabled_by_user:users!hospital_modules_disabled_by_fkey(*)
      `
      )
      .eq('hospital_id', hospitalId)
      .order('module_code', { ascending: true })

    if (error) throw error

    return {
      data: data as any,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching hospital modules:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch hospital modules',
    }
  }
}

/**
 * Enable a module for a hospital
 */
export async function enableHospitalModule(
  hospitalId: string,
  moduleCode: ModuleCode,
  enabledBy: string
): Promise<ApiResponse<HospitalModule>> {
  try {
    // Check if module already exists
    const { data: existing, error: checkError } = await supabase
      .from('hospital_modules')
      .select('id')
      .eq('hospital_id', hospitalId)
      .eq('module_code', moduleCode)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('hospital_modules')
        .update({
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          enabled_by: enabledBy,
          disabled_at: null,
          disabled_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      // Sync with departments
      await syncDepartmentFromModule(hospitalId, moduleCode, true)

      // Log audit
      await logAuditEvent({
        user_id: enabledBy,
        action: 'enable_module',
        module: 'system_admin',
        entity_type: 'hospital_module',
        entity_id: data.id,
        new_values: { module_code: moduleCode, hospital_id: hospitalId },
      })

      return {
        data: data as HospitalModule,
        error: null,
      }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('hospital_modules')
        .insert({
          hospital_id: hospitalId,
          module_code: moduleCode,
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          enabled_by: enabledBy,
        })
        .select()
        .single()

      if (error) throw error

      // Sync with departments
      await syncDepartmentFromModule(hospitalId, moduleCode, true)

      // Log audit
      await logAuditEvent({
        user_id: enabledBy,
        action: 'enable_module',
        module: 'system_admin',
        entity_type: 'hospital_module',
        entity_id: data.id,
        new_values: { module_code: moduleCode, hospital_id: hospitalId },
      })

      return {
        data: data as HospitalModule,
        error: null,
      }
    }
  } catch (error) {
    console.error('Error enabling module:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to enable module',
    }
  }
}

/**
 * Disable a module for a hospital
 */
export async function disableHospitalModule(
  hospitalId: string,
  moduleCode: ModuleCode,
  disabledBy: string
): Promise<ApiResponse<HospitalModule>> {
  try {
    const { data, error } = await supabase
      .from('hospital_modules')
      .update({
        is_enabled: false,
        disabled_at: new Date().toISOString(),
        disabled_by: disabledBy,
        updated_at: new Date().toISOString(),
      })
      .eq('hospital_id', hospitalId)
      .eq('module_code', moduleCode)
      .select()
      .single()

    if (error) throw error

    // Sync with departments
    await syncDepartmentFromModule(hospitalId, moduleCode, false)

    // Log audit
    await logAuditEvent({
      user_id: disabledBy,
      action: 'disable_module',
      module: 'system_admin',
      entity_type: 'hospital_module',
      entity_id: data.id,
      old_values: { module_code: moduleCode, hospital_id: hospitalId },
    })

    return {
      data: data as HospitalModule,
      error: null,
    }
  } catch (error) {
    console.error('Error disabling module:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to disable module',
    }
  }
}

/**
 * Toggle multiple modules at once
 */
export async function updateHospitalModules(
  hospitalId: string,
  modules: { code: ModuleCode; enabled: boolean }[],
  updatedBy: string
): Promise<ApiResponse<HospitalModule[]>> {
  try {
    const results: HospitalModule[] = []

    for (const mod of modules) {
      if (mod.enabled) {
        const result = await enableHospitalModule(hospitalId, mod.code, updatedBy)
        if (result.data) results.push(result.data)
      } else {
        const result = await disableHospitalModule(hospitalId, mod.code, updatedBy)
        if (result.data) results.push(result.data)
      }
    }

    return {
      data: results,
      error: null,
    }
  } catch (error) {
    console.error('Error updating modules:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update modules',
    }
  }
}

/**
 * Sync all enabled modules for a hospital to departments
 * This ensures departments exist for all enabled modules
 */
export async function syncAllModulesToDepartments(
  hospitalId: string
): Promise<ApiResponse<{ synced: number; errors: number }>> {
  try {
    // Get all enabled modules for this hospital
    const { data: modules, error: modulesError } = await supabase
      .from('hospital_modules')
      .select('module_code, is_enabled')
      .eq('hospital_id', hospitalId)
      .eq('is_enabled', true)

    if (modulesError) throw modulesError

    let synced = 0
    let errors = 0

    // Sync each enabled module
    for (const module of modules || []) {
      try {
        await syncDepartmentFromModule(hospitalId, module.module_code as ModuleCode, true)
        synced++
      } catch (err) {
        console.error(`Failed to sync module ${module.module_code}:`, err)
        errors++
      }
    }

    return {
      data: { synced, errors },
      error: null,
    }
  } catch (error) {
    console.error('Error syncing modules to departments:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sync modules to departments',
    }
  }
}

/**
 * Check if a module is enabled for a hospital
 */
export async function isModuleEnabled(
  hospitalId: string,
  moduleCode: ModuleCode
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('hospital_modules')
      .select('is_enabled')
      .eq('hospital_id', hospitalId)
      .eq('module_code', moduleCode)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking module:', error)
      return false
    }

    return data?.is_enabled || false
  } catch (error) {
    console.error('Error checking module:', error)
    return false
  }
}

/**
 * Helper: Sync department from module state
 */
async function syncDepartmentFromModule(
  hospitalId: string,
  moduleCode: ModuleCode,
  isEnabled: boolean
): Promise<void> {
  try {
    const moduleDef = MODULE_DEFINITIONS.find((m) => m.code === moduleCode)
    if (!moduleDef) {
      console.warn(`Module definition not found for code: ${moduleCode}`)
      return
    }

    if (isEnabled) {
      // Check if department already exists
      const { data: existing } = await supabase
        .from('departments')
        .select('id')
        .eq('hospital_id', hospitalId)
        .eq('department_code', moduleCode)
        .single()

      if (existing) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            department_name: moduleDef.name,
            description: moduleDef.description,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          console.error('Error updating department:', error)
          throw error
        }
      } else {
        // Create new department
        const { error } = await supabase.from('departments').insert({
          hospital_id: hospitalId,
          department_code: moduleCode,
          department_name: moduleDef.name,
          description: moduleDef.description,
          status: 'active',
        })

        if (error) {
          console.error('Error creating department:', error)
          throw error
        }
      }
    } else {
      // Deactivate department
      const { error } = await supabase
        .from('departments')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('hospital_id', hospitalId)
        .eq('department_code', moduleCode)

      if (error) {
        console.error('Error deactivating department:', error)
        throw error
      }
    }
  } catch (err) {
    console.error('Failed to sync department from module:', err)
    throw err // Re-throw to ensure errors are visible
  }
}

/**
 * Helper: Log audit event
 */
async function logAuditEvent(event: {
  user_id: string
  action: string
  module: string
  entity_type?: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
}): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      ...event,
      ip_address: null,
      user_agent: null,
    })

    if (error) {
      console.warn('Audit log insert failed:', error)
    }
  } catch (err) {
    console.warn('Unexpected error in audit logging:', err)
  }
}

