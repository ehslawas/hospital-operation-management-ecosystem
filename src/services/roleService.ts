import { supabase } from './supabase'
import type { Role, Permission, PaginatedResponse, SortConfig } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface GetRolesParams {
  page?: number
  pageSize?: number
  search?: string
  isSystemRole?: boolean
  hospitalId?: string
  sort?: SortConfig
}

/**
 * Get paginated list of roles
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    // Add timeout wrapper for reliability
    const TIMEOUT_MS = 30000
    const query = supabase
      .from('roles')
      .select('*')
      .order('role_name', { ascending: true })
      .limit(1000)

    const { data, error } = await Promise.race([
      query,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Roles query timed out')), TIMEOUT_MS)
      )
    ]) as any

    if (error) {
      console.error('Error fetching roles from Supabase:', error)
      throw new Error(error.message)
    }
    return (data || []) as Role[]
  } catch (error) {
    console.error('Error fetching roles:', error)
    // Return empty array instead of throwing to prevent cascade failures
    return []
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase.from('roles').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching role from Supabase:', error)
      throw new Error(error.message)
    }
    return data as Role
  } catch (error) {
    console.error('Error fetching role:', error)
    throw error
  }
}

/**
 * Get all permissions (synthesized from new modules and features)
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    // Fetch all modules
    const { data: modules, error: modError } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (modError) throw modError

    // Synthesize permissions from modules (View, Create, Edit, Delete for each module)
    // This maintains backward compatibility with the legacy RolePermissionPage UI
    const permissions: Permission[] = []

    modules?.forEach(mod => {
      const actions = ['view', 'create', 'edit', 'delete']
      actions.forEach(action => {
        permissions.push({
          id: `${mod.id}:${action}`,
          permission_code: `${mod.module_code}:${action}`,
          permission_name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod.module_name}`,
          module: mod.module_code,
          feature: 'general',
          description: `${action} access for ${mod.module_name}`,
          created_at: mod.created_at.toISOString(),
          updated_at: mod.updated_at.toISOString()
        })
      })
    })

    return permissions
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
}

/**
 * Get permissions for a role (new RBAC schema)
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*, module:modules(*)')
      .eq('role_id', roleId)

    if (error) {
      console.error('Error fetching role permissions from Supabase:', error)
      throw new Error(error.message)
    }

    const permissions: Permission[] = []
    data?.forEach((rp: any) => {
      if (!rp.module) return

      if (rp.can_view) permissions.push({ id: `${rp.module_id}:view`, permission_code: `${rp.module.module_code}:view`, permission_name: `View ${rp.module.module_name}`, module: rp.module.module_code, created_at: rp.granted_at })
      if (rp.can_create) permissions.push({ id: `${rp.module_id}:create`, permission_code: `${rp.module.module_code}:create`, permission_name: `Create ${rp.module.module_name}`, module: rp.module.module_code, created_at: rp.granted_at })
      if (rp.can_edit) permissions.push({ id: `${rp.module_id}:edit`, permission_code: `${rp.module.module_code}:edit`, permission_name: `Edit ${rp.module.module_name}`, module: rp.module.module_code, created_at: rp.granted_at })
      if (rp.can_delete) permissions.push({ id: `${rp.module_id}:delete`, permission_code: `${rp.module.module_code}:delete`, permission_name: `Delete ${rp.module.module_name}`, module: rp.module.module_code, created_at: rp.granted_at })
    })

    return permissions as any[]
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    return []
  }
}

/**
 * Update role permissions (new RBAC schema)
 */
export async function updateRolePermissions(
  roleId: string,
  synthesizedPermissionIds: string[],
  grantedBy?: string
): Promise<void> {
  try {
    // synthesizedPermissionIds are in format 'module_id:action'
    const moduleMap = new Map<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>()

    synthesizedPermissionIds.forEach(idPair => {
      const [moduleId, action] = idPair.split(':')
      if (!moduleId || !action) return

      if (!moduleMap.has(moduleId)) {
        moduleMap.set(moduleId, { can_view: false, can_create: false, can_edit: false, can_delete: false })
      }

      const perms = moduleMap.get(moduleId)!
      if (action === 'view') perms.can_view = true
      if (action === 'create') perms.can_create = true
      if (action === 'edit') perms.can_edit = true
      if (action === 'delete') perms.can_delete = true
    })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    const grantedByUserId = grantedBy || user?.id

    // delete existing
    const { error: delError } = await supabase.from('role_permissions').delete().eq('role_id', roleId)
    if (delError) throw delError

    // insert new
    const records = Array.from(moduleMap.entries()).map(([moduleId, perms]) => ({
      role_id: roleId,
      module_id: moduleId,
      ...perms,
      granted_by: grantedByUserId
    }))

    if (records.length > 0) {
      const { error: insError } = await supabase.from('role_permissions').insert(records)
      if (insError) throw insError
    }
  } catch (error) {
    console.error('Error updating role permissions:', error)
    throw error
  }
}



/**
 * Synchronize system roles defined in constants to the database
 */
export async function syncSystemRoles(): Promise<{ success: boolean; inserted: number }> {
  try {
    const rolesToSync = [
      { role_code: 'system_admin', role_name: 'System Administrator', description: 'Full system access across all hospitals' },
      { role_code: 'hospital_admin', role_name: 'Hospital System Administrator', description: 'Full access to a specific hospital system and management functions.' },
      { role_code: 'medical_officer', role_name: 'Medical Officer', description: 'Qualified medical practitioner providing clinical care and diagnosis.' },
      { role_code: 'assistant_medical_officer', role_name: 'Assistant Medical Officer', description: 'Penolong Pegawai Perubatan (PPP) providing clinical support and emergency care.' },
      { role_code: 'senior_assistant_medical_officer', role_name: 'Senior Assistant Medical Officer', description: 'Senior Penolong Pegawai Perubatan (PPP) with advanced clinical and supervisory duties.' },
      { role_code: 'pharmacist', role_name: 'Pharmacist', description: 'Pegawai Farmasi responsible for medication management and clinical pharmacy.' },
      { role_code: 'assistant_pharmacist', role_name: 'Assistant Pharmacist', description: 'Penolong Pegawai Farmasi (PPF) assisting in pharmacy operations and dispensing.' },
      { role_code: 'matron', role_name: 'Matron', description: 'Senior nursing administrator overseeing nursing services and standards.' },
      { role_code: 'sister', role_name: 'Sister', description: 'Ketua Jururawat (Nursing Sister) in charge of ward management and clinical supervision.' },
      { role_code: 'nurse', role_name: 'Nurse', description: 'Jururawat providing direct patient care and clinical assistance.' },
      { role_code: 'hospital_administrator', role_name: 'Hospital Administrator', description: 'Pegawai Tadbir managing non-clinical hospital operations and resources.' },
      { role_code: 'hospital_driver', role_name: 'Hospital Driver', description: 'Pemandu responsible for transportation of patients and official hospital logistics.' },
      { role_code: 'general_service_assistant', role_name: 'General Service Assistant', description: 'Pembantu Perawatan Kesihatan (PPK) providing general support and patient handling.' },
      { role_code: 'radiographer', role_name: 'Radiographer', description: 'Juru X-Ray performing diagnostic imaging and radiology services.' },
      { role_code: 'medical_lab_technician', role_name: 'Medical Laboratory Technologist', description: 'Juruteknologi Makmal Perubatan (JTMP) conducting laboratory tests and analysis.' },
      { role_code: 'pathologist', role_name: 'Pathologist', description: 'Pakar Patologi specializing in laboratory medicine and disease diagnosis.' },
      { role_code: 'physiotherapist', role_name: 'Physiotherapist', description: 'Fisioterapis providing physical rehabilitation and therapy services.' },
      { role_code: 'occupational_therapist', role_name: 'Occupational Therapist', description: 'Jurupulih Perubatan Kerja providing functional rehabilitation and therapy.' },
      { role_code: 'hospital_director', role_name: 'Hospital Director', description: 'Pengarah Hospital responsible for overall clinical and administrative governance.' },
    ]

    const fullRoles = rolesToSync.map(r => ({
      ...r,
      is_system_role: true,
      updated_at: new Date().toISOString()
    }))

    // Upsert roles based on role_code
    const { data, error } = await supabase
      .from('roles')
      .upsert(fullRoles, { onConflict: 'role_code' })
      .select()

    if (error) {
      console.error('Error syncing system roles:', error)
      return { success: false, inserted: 0 }
    }

    return { success: true, inserted: data?.length || 0 }
  } catch (error) {
    console.error('Failed to sync system roles:', error)
    return { success: false, inserted: 0 }
  }
}

/**
 * Create a new role
 */
export async function createRole(roleData: Partial<Role>): Promise<Role> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        ...roleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating role in Supabase:', error)
      throw new Error(error.message)
    }
    return data as Role
  } catch (error) {
    console.error('Error creating role:', error)
    throw error
  }
}

/**
 * Update an existing role
 */
export async function updateRole(id: string, updates: Partial<Role>): Promise<Role> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating role in Supabase:', error)
      throw new Error(error.message)
    }
    return data as Role
  } catch (error) {
    console.error('Error updating role:', error)
    throw error
  }
}

/**
 * Delete a role
 */
export async function deleteRole(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) {
      console.error('Error deleting role from Supabase:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error deleting role:', error)
    throw error
  }
}

