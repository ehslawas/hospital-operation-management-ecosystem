import { supabase } from './supabase'

export interface RoleFeaturePermission {
    id?: string
    role_id: string
    feature_id: string
    is_enabled: boolean
    granted_at?: string
    granted_by?: string
}

export interface RoleFeaturePermissionWithRelations extends RoleFeaturePermission {
    feature?: {
        id: string
        feature_code: string
        feature_name: string
        module_id: string
        module?: {
            id: string
            module_code: string
            module_name: string
        }
    }
}

/**
 * Get all feature permissions for a specific role
 */
export async function getRoleFeaturePermissions(roleId: string): Promise<RoleFeaturePermissionWithRelations[]> {
    const { data, error } = await supabase
        .from('role_feature_permissions')
        .select(`
      *,
      feature:features(
        id,
        feature_code,
        feature_name,
        module_id,
        module:modules(
          id,
          module_code,
          module_name
        )
      )
    `)
        .eq('role_id', roleId)

    if (error) {
        console.error('Error fetching role feature permissions:', error)
        throw error
    }

    return data || []
}

/**
 * Bulk save/update role feature permissions
 * This will either insert new permissions or update existing ones
 */
export async function saveRoleFeaturePermissions(
    roleId: string,
    updates: { feature_id: string; is_enabled: boolean }[],
    grantedBy: string
): Promise<void> {
    // Delete all existing permissions for this role
    await supabase
        .from('role_feature_permissions')
        .delete()
        .eq('role_id', roleId)

    // Insert only enabled permissions
    const permissionsToInsert = updates
        .filter(u => u.is_enabled)
        .map(u => ({
            role_id: roleId,
            feature_id: u.feature_id,
            is_enabled: true,
            granted_by: grantedBy,
            granted_at: new Date().toISOString()
        }))

    if (permissionsToInsert.length > 0) {
        const { error } = await supabase
            .from('role_feature_permissions')
            .insert(permissionsToInsert)

        if (error) {
            console.error('Error saving role feature permissions:', error)
            throw error
        }
    }
}

/**
 * Get count of users with a specific role
 */
export async function getUserCountByRole(roleId: string): Promise<number> {
    const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', roleId)

    if (error) {
        console.error('Error counting users:', error)
        return 0
    }

    return count || 0
}
