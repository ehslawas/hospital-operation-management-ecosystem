/**
 * Permission Service
 * Handles all permission-related API calls and caching
 */

import { supabase } from './supabase';
import type {
    Module,
    ModuleWithPermissions,
    Feature,
    FeatureWithPermission,
    RolePermission,
    RoleFeaturePermission,
    StaffCustomPermission,
    PermissionAction,
} from '../types/rbac.types';

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if a staff member has permission for a specific module action
 * Uses the database function check_staff_permission()
 */
export async function checkStaffPermission(
    staffId: string,
    moduleCode: string,
    action: PermissionAction
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_staff_permission', {
            p_staff_id: staffId,
            p_module_code: moduleCode,
            p_action: action,
        });

        if (error) {
            console.error('[Permission Service] Error checking permission:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('[Permission Service] Exception checking permission:', error);
        return false;
    }
}

/**
 * Check if a staff member has access to a specific feature
 * Uses the database function check_feature_permission()
 */
export async function checkFeaturePermission(
    staffId: string,
    featureCode: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_feature_permission', {
            p_staff_id: staffId,
            p_feature_code: featureCode,
        });

        if (error) {
            console.error('[Permission Service] Error checking feature permission:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('[Permission Service] Exception checking feature permission:', error);
        return false;
    }
}

/**
 * Get all modules accessible to a staff member with their permission levels
 * Uses the database function get_staff_accessible_modules()
 */
export async function getStaffAccessibleModules(
    staffId: string
): Promise<ModuleWithPermissions[]> {
    try {
        const { data, error } = await supabase.rpc('get_staff_accessible_modules', {
            p_staff_id: staffId,
        });

        if (error) throw error;

        // Build hierarchical structure
        const modules = (data || []) as ModuleWithPermissions[];
        return buildModuleHierarchy(modules);
    } catch (error) {
        console.error('[Permission Service] Error getting accessible modules:', error);
        return [];
    }
}

/**
 * Helper function to build hierarchical module tree
 */
function buildModuleHierarchy(flatModules: ModuleWithPermissions[]): ModuleWithPermissions[] {
    const moduleMap = new Map<string, ModuleWithPermissions>();
    const rootModules: ModuleWithPermissions[] = [];

    // First pass: Create map and initialize children arrays
    flatModules.forEach((module) => {
        moduleMap.set(module.id, { ...module, children: [] });
    });

    // Second pass: Build hierarchy
    flatModules.forEach((module) => {
        const moduleWithChildren = moduleMap.get(module.id)!;

        if (module.parent_module_id === null) {
            // Root module
            rootModules.push(moduleWithChildren);
        } else {
            // Child module
            const parent = moduleMap.get(module.parent_module_id);
            if (parent) {
                parent.children = parent.children || [];
                parent.children.push(moduleWithChildren);
            } else {
                // Parent not found (maybe user doesn't have access), treat as root
                rootModules.push(moduleWithChildren);
            }
        }
    });

    return rootModules;
}

// ============================================
// MODULE MANAGEMENT (ADMIN)
// ============================================

export async function getAllModules(): Promise<Module[]> {
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getModuleById(id: string): Promise<Module | null> {
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createModule(module: Partial<Module>): Promise<Module> {
    const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateModule(id: string, updates: Partial<Module>): Promise<Module> {
    const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteModule(id: string): Promise<void> {
    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// FEATURE MANAGEMENT (ADMIN)
// ============================================

export async function getFeaturesByModule(moduleId: string): Promise<Feature[]> {
    const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('module_id', moduleId)
        .order('feature_name');

    if (error) throw error;
    return data || [];
}

export async function getAllFeatures(): Promise<FeatureWithPermission[]> {
    const { data, error } = await supabase
        .from('features')
        .select(`
      *,
      module:modules(*)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
}

export async function createFeature(feature: Partial<Feature>): Promise<Feature> {
    const { data, error } = await supabase
        .from('features')
        .insert(feature)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateFeature(id: string, updates: Partial<Feature>): Promise<Feature> {
    const { data, error } = await supabase
        .from('features')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteFeature(id: string): Promise<void> {
    const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// ROLE PERMISSION MANAGEMENT (ADMIN)
// ============================================

export async function getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId);

    if (error) throw error;
    return data || [];
}

export async function saveRolePermission(permission: Partial<RolePermission>): Promise<RolePermission> {
    const { data, error } = await supabase
        .from('role_permissions')
        .upsert(permission, { onConflict: 'role_id,module_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteRolePermission(roleId: string, moduleId: string): Promise<void> {
    const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('module_id', moduleId);

    if (error) throw error;
}

// ============================================
// ROLE FEATURE PERMISSION MANAGEMENT (ADMIN)
// ============================================

export async function getRoleFeaturePermissions(roleId: string): Promise<RoleFeaturePermission[]> {
    const { data, error } = await supabase
        .from('role_feature_permissions')
        .select('*')
        .eq('role_id', roleId);

    if (error) throw error;
    return data || [];
}

export async function saveRoleFeaturePermission(
    permission: Partial<RoleFeaturePermission>
): Promise<RoleFeaturePermission> {
    const { data, error } = await supabase
        .from('role_feature_permissions')
        .upsert(permission, { onConflict: 'role_id,feature_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Bulk save role feature permissions
 */
export async function saveRoleFeaturePermissionsBulk(
    permissions: Partial<RoleFeaturePermission>[]
): Promise<RoleFeaturePermission[]> {
    if (permissions.length === 0) return [];

    const { data, error } = await supabase
        .from('role_feature_permissions')
        .upsert(permissions, { onConflict: 'role_id,feature_id' })
        .select();

    if (error) throw error;
    return data || [];
}

export async function deleteRoleFeaturePermission(roleId: string, featureId: string): Promise<void> {
    const { error } = await supabase
        .from('role_feature_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('feature_id', featureId);

    if (error) throw error;
}

// ============================================
// STAFF CUSTOM PERMISSION MANAGEMENT (ADMIN)
// ============================================

export async function getStaffCustomPermissions(userId: string): Promise<StaffCustomPermission[]> {
    const { data, error } = await supabase
        .from('staff_custom_permissions')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data || [];
}

export async function saveStaffCustomPermission(
    permission: Partial<StaffCustomPermission>
): Promise<StaffCustomPermission> {
    const { data, error } = await supabase
        .from('staff_custom_permissions')
        .insert(permission)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteStaffCustomPermission(id: string): Promise<void> {
    const { error } = await supabase
        .from('staff_custom_permissions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function clearAllStaffCustomPermissions(userId: string): Promise<void> {
    const { error } = await supabase
        .from('staff_custom_permissions')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Bulk save staff custom permissions (overrides)
 * Intelligently manages overrides: if they match the role baseline, they are removed.
 */
export async function saveStaffCustomPermissionsBulk(
    userId: string,
    updates: { feature_id: string; is_enabled: boolean; role_baseline: boolean }[]
): Promise<void> {
    if (updates.length === 0) return;

    const toDeleteFeatureIds: string[] = [];
    const toUpsert: any[] = [];

    updates.forEach((update) => {
        if (update.is_enabled === update.role_baseline) {
            // Reverting to default - delete override
            toDeleteFeatureIds.push(update.feature_id);
        } else {
            // Deviation from baseline - create/update override
            toUpsert.push({
                user_id: userId,
                feature_id: update.feature_id,
                permission_type: update.is_enabled ? 'grant' : 'deny',
            });
        }
    });

    // 1. Handle Deletions (reverting to defaults)
    if (toDeleteFeatureIds.length > 0) {
        const { error: delError } = await supabase
            .from('staff_custom_permissions')
            .delete()
            .eq('user_id', userId)
            .in('feature_id', toDeleteFeatureIds);

        if (delError) {
            console.error('[Permission Service] Error deleting overrides:', delError);
            throw delError;
        }
    }

    // 2. Handle Upserts (creating deviations)
    if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase
            .from('staff_custom_permissions')
            .upsert(toUpsert, { onConflict: 'user_id,feature_id' });

        if (upsertError) {
            console.error('[Permission Service] Error upserting overrides:', upsertError);
            throw upsertError;
        }
    }
}

// ============================================
// USER QUERIES FOR DEPARTMENT-BASED PERMISSIONS
// ============================================

/**
 * Get all users in a specific department with their role information
 */
export async function getUsersByDepartment(departmentId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            role:roles!role_id(*),
            department:departments!department_id(*)
        `)
        .eq('department_id', departmentId)
        .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Copy all permissions from one role to another
 */
export async function copyRolePermissions(
    fromRoleId: string,
    toRoleId: string
): Promise<void> {
    // Get source role permissions
    const sourcePermissions = await getRolePermissions(fromRoleId);
    const sourceFeaturePermissions = await getRoleFeaturePermissions(fromRoleId);

    // Delete existing target permissions
    await supabase.from('role_permissions').delete().eq('role_id', toRoleId);
    await supabase.from('role_feature_permissions').delete().eq('role_id', toRoleId);

    // Insert new permissions
    const newPermissions = sourcePermissions.map((p) => ({
        role_id: toRoleId,
        module_id: p.module_id,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
    }));

    const newFeaturePermissions = sourceFeaturePermissions.map((p) => ({
        role_id: toRoleId,
        feature_id: p.feature_id,
        is_enabled: p.is_enabled,
    }));

    if (newPermissions.length > 0) {
        const { error: permError } = await supabase
            .from('role_permissions')
            .insert(newPermissions);
        if (permError) throw permError;
    }

    if (newFeaturePermissions.length > 0) {
        const { error: featError } = await supabase
            .from('role_feature_permissions')
            .insert(newFeaturePermissions);
        if (featError) throw featError;
    }
}

/**
 * Grant all permissions to a role (superuser mode)
 */
export async function grantAllPermissions(roleId: string): Promise<void> {
    const modules = await getAllModules();
    const features = await getAllFeatures();

    const allModulePermissions = modules.map((m) => ({
        role_id: roleId,
        module_id: m.id,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
    }));

    const allFeaturePermissions = features.map((f) => ({
        role_id: roleId,
        feature_id: f.id,
        is_enabled: true,
    }));

    // Delete existing
    await supabase.from('role_permissions').delete().eq('role_id', roleId);
    await supabase.from('role_feature_permissions').delete().eq('role_id', roleId);

    // Insert new
    if (allModulePermissions.length > 0) {
        const { error } = await supabase.from('role_permissions').insert(allModulePermissions);
        if (error) throw error;
    }

    if (allFeaturePermissions.length > 0) {
        const { error } = await supabase.from('role_feature_permissions').insert(allFeaturePermissions);
        if (error) throw error;
    }
}

/**
 * Revoke all permissions from a role
 */
export async function revokeAllPermissions(roleId: string): Promise<void> {
    await supabase.from('role_permissions').delete().eq('role_id', roleId);
    await supabase.from('role_feature_permissions').delete().eq('role_id', roleId);
}
