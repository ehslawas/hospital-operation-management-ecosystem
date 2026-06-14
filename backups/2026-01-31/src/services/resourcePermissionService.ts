import { supabase } from './supabase'
import type { ResourcePermission, RoleDepartmentPermission, RoleDepartmentPermissionWithRelations } from '@/types'

/**
 * Check if a user has permission to perform an action on a resource
 */
export async function checkUserResourceAccess(
    userId: string,
    resourceCode: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve'
): Promise<boolean> {
    try {
        // 1. Get user's role and department
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id, department_id, roles(role_code)')
            .eq('id', userId)
            .single()

        if (userError || !user) return false

        // System Admins have full access
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((user.roles as any)?.role_code === 'system_admin') return true

        // 2. Get resource ID
        const { data: resource, error: resourceError } = await supabase
            .from('resource_permissions')
            .select('id')
            .eq('resource_code', resourceCode)
            .single()

        if (resourceError || !resource) return false

        // 3. Check for specific permissions
        // We check for either a global permission (department_id is NULL) 
        // OR a specific permission for the user's department
        const { data: permissions, error: permError } = await supabase
            .from('role_department_permissions')
            .select(`can_${action}`)
            .eq('role_id', user.role_id)
            .eq('resource_id', resource.id)
            .or(`department_id.is.null,department_id.eq.${user.department_id}`)

        if (permError || !permissions || permissions.length === 0) return false

        // If any matching permission record allows the action, return true
        // (Union of global and specific permissions)
        return permissions.some((p: any) => p[`can_${action}`] === true)
    } catch (error) {
        console.error('Error checking user resource access:', error)
        return false
    }
}

/**
 * Get all resources visible to a user based on their role and department
 * (Used for filtering menus and lists)
 */
export async function getVisibleResources(
    userId: string,
    module?: string
): Promise<ResourcePermission[]> {
    try {
        // 1. Get user's role and department
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id, department_id, roles(role_code)')
            .eq('id', userId)
            .single()

        if (userError || !user) return []

        // System Admins see everything
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((user.roles as any)?.role_code === 'system_admin') {
            let query = supabase.from('resource_permissions').select('*')
            if (module) query = query.eq('module', module)
            const { data } = await query
            return (data || []) as ResourcePermission[]
        }

        // 2. Fetch permissions for this user
        let query = supabase
            .from('role_department_permissions')
            .select('resource:resource_permissions(*)')
            .eq('role_id', user.role_id)
            .eq('can_view', true) // Only resources they can view
            .or(`department_id.is.null,department_id.eq.${user.department_id}`)

        const { data: permissionData, error } = await query

        if (error) throw error

        // Extract resources and filter by module if needed
        let resources = permissionData
            .map((p: any) => p.resource)
            .filter((r): r is ResourcePermission => !!r)

        if (module) {
            resources = resources.filter(r => r.module === module)
        }

        // Deduplicate resources (in case of both global and specific permissions)
        const uniqueResources = Array.from(
            new Map(resources.map(r => [r.id, r])).values()
        )

        return uniqueResources
    } catch (error) {
        console.error('Error fetching visible resources:', error)
        return []
    }
}

/**
 * Get resources filtered by permission tags
 * (The AMO Restriction Logic)
 */
export async function getResourcesByTags(
    tags: string[]
): Promise<ResourcePermission[]> {
    try {
        if (!tags || tags.length === 0) return []

        const { data, error } = await supabase
            .from('resource_permissions')
            .select('*')
            .contains('permission_tag', tags)

        if (error) throw error
        return (data || []) as ResourcePermission[]
    } catch (error) {
        console.error('Error fetching resources by tags:', error)
        return []
    }
}

/**
 * Get all available resource permissions (for admin management)
 */
export async function getAllResourcePermissions(): Promise<ResourcePermission[]> {
    try {
        const { data, error } = await supabase
            .from('resource_permissions')
            .select('*')
            .order('module', { ascending: true })
            .order('resource_name', { ascending: true })

        if (error) throw error
        return (data || []) as ResourcePermission[]
    } catch (error) {
        console.error('Error fetching all resource permissions:', error)
        return []
    }
}

/**
 * Get role department permissions for admin editing
 */
export async function getRoleDepartmentPermissions(
    roleId: string,
    departmentId?: string | null
): Promise<RoleDepartmentPermissionWithRelations[]> {
    try {
        let query = supabase
            .from('role_department_permissions')
            .select('*, resource:resource_permissions(*)')
            .eq('role_id', roleId)

        if (departmentId === null) {
            query = query.is('department_id', null)
        } else if (departmentId) {
            query = query.eq('department_id', departmentId)
        }

        const { data, error } = await query

        if (error) throw error
        return (data || []) as RoleDepartmentPermissionWithRelations[]
    } catch (error) {
        console.error('Error fetching role department permissions:', error)
        return []
    }
}

/**
 * Update role department permissions
 */
export async function updateRoleDepartmentPermissions(
    permissions: Partial<RoleDepartmentPermission>[]
): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        // Prepare upsert data
        const upsertData = permissions.map(p => ({
            ...p,
            granted_by: user?.id,
            updated_at: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('role_department_permissions')
            .upsert(upsertData, { onConflict: 'role_id,department_id,resource_id' })

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error updating role department permissions:', error)
        throw error
    }
}
