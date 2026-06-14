import { supabase, isSupabaseConfigured } from './supabase'
import { mockRoles, mockPermissions, mockRolePermissions } from './mockData'
import type { Role, Permission, RolePermission, PaginatedResponse, SortConfig } from '@/types'
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
export async function getRoles({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  isSystemRole,
  hospitalId,
  sort,
}: GetRolesParams): Promise<PaginatedResponse<Role>> {
  try {
    if (isSupabaseConfigured()) {
      // Supabase implementation
      let query = supabase.from('roles').select('*', { count: 'exact' })

      if (search) {
        query = query.or(`role_name.ilike.%${search}%,role_code.ilike.%${search}%,description.ilike.%${search}%`)
      }
      if (isSystemRole !== undefined) {
        query = query.eq('is_system_role', isSystemRole)
      }
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId)
      }

      if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'asc' })
      } else {
        query = query.order('role_name', { ascending: true })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching roles from Supabase:', error)
        throw new Error(error.message)
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0

      return {
        data: (data || []) as Role[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      }
    } else {
      // Mock data implementation
      await new Promise((resolve) => setTimeout(resolve, 500))

      let filteredRoles = mockRoles.filter((role) => {
        const matchesSearch = search
          ? role.role_name.toLowerCase().includes(search.toLowerCase()) ||
            role.role_code.toLowerCase().includes(search.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(search.toLowerCase()))
          : true
        const matchesSystemRole = isSystemRole !== undefined ? role.is_system_role === isSystemRole : true
        const matchesHospital = hospitalId ? role.hospital_id === hospitalId : true
        return matchesSearch && matchesSystemRole && matchesHospital
      })

      if (sort) {
        filteredRoles.sort((a, b) => {
          const aValue = a[sort.key as keyof Role]
          const bValue = b[sort.key as keyof Role]

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
          }
          if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            return sort.direction === 'asc' ? (aValue === bValue ? 0 : aValue ? 1 : -1) : aValue === bValue ? 0 : aValue ? -1 : 1
          }
          return 0
        })
      } else {
        filteredRoles.sort((a, b) => a.role_name.localeCompare(b.role_name))
      }

      const total = filteredRoles.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

      return {
        data: paginatedRoles,
        total,
        page,
        pageSize,
        totalPages,
      }
    }
  } catch (error) {
    console.error('Error fetching roles:', error)
    throw error
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string): Promise<Role | null> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('roles').select('*').eq('id', id).maybeSingle()

      if (error) {
        console.error('Error fetching role from Supabase:', error)
        throw new Error(error.message)
      }
      return data as Role
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockRoles.find((r) => r.id === id) || null
    }
  } catch (error) {
    console.error('Error fetching role:', error)
    throw error
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('permission_name', { ascending: true })

      if (error) {
        console.error('Error fetching permissions from Supabase:', error)
        throw new Error(error.message)
      }
      return (data || []) as Permission[]
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return [...mockPermissions].sort((a, b) => {
        if (a.module !== b.module) {
          return a.module.localeCompare(b.module)
        }
        return a.permission_name.localeCompare(b.permission_name)
      })
    }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    throw error
  }
}

/**
 * Get permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission:permissions(*)')
        .eq('role_id', roleId)

      if (error) {
        console.error('Error fetching role permissions from Supabase:', error)
        throw new Error(error.message)
      }

      return (data || []).map((rp: { permission: Permission }) => rp.permission) as Permission[]
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const rolePermissionIds = mockRolePermissions
        .filter((rp) => rp.role_id === roleId)
        .map((rp) => rp.permission_id)
      return mockPermissions.filter((p) => rolePermissionIds.includes(p.id))
    }
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    throw error
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(
  roleId: string, 
  permissionIds: string[],
  grantedBy?: string
): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      // Get current user if not provided
      const { data: { user } } = await supabase.auth.getUser()
      const grantedByUserId = grantedBy || user?.id

      // Delete existing permissions
      const { error: deleteError } = await supabase.from('role_permissions').delete().eq('role_id', roleId)
      if (deleteError) throw deleteError

      // Insert new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
          granted_by: grantedByUserId || null,
        }))
        const { error } = await supabase.from('role_permissions').insert(rolePermissions)
        if (error) throw error
      }
    } else {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 300))
      // Remove existing permissions for this role
      const index = mockRolePermissions.findIndex((rp) => rp.role_id === roleId)
      while (index !== -1) {
        mockRolePermissions.splice(index, 1)
      }
      // Add new permissions
      permissionIds.forEach((permissionId) => {
        mockRolePermissions.push({
          id: `rp-${Date.now()}-${Math.random()}`,
          role_id: roleId,
          permission_id: permissionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      })
    }
  } catch (error) {
    console.error('Error updating role permissions:', error)
    throw error
  }
}

/**
 * Get all roles (for dropdowns)
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('role_name', { ascending: true })

      if (error) {
        console.error('Error fetching roles from Supabase:', error)
        throw new Error(error.message)
      }
      return (data || []) as Role[]
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return [...mockRoles].sort((a, b) => a.role_name.localeCompare(b.role_name))
    }
  } catch (error) {
    console.error('Error fetching roles:', error)
    throw error
  }
}

