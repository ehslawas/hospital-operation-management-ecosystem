/**
 * Permission Gate Components
 * Conditionally render children based on permissions
 */

import React from 'react';
import { usePermission, useFeatureAccess } from '../hooks/usePermission';
import type { PermissionAction } from '../types/rbac.types';

interface PermissionGateProps {
    children: React.ReactNode;
    module: string;
    action: PermissionAction;
    fallback?: React.ReactNode;
}

/**
 * PermissionGate Component
 * Conditionally renders children based on module-level permission
 * 
 * @example
 * <PermissionGate module="pharmacy_management.stock" action="create">
 *   <Button>Add New Stock</Button>
 * </PermissionGate>
 */
export function PermissionGate({ children, module, action, fallback = null }: PermissionGateProps) {
    const { hasAccess, isLoading } = usePermission(module, action);

    if (isLoading) {
        return null; // Or return a skeleton/loading state
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface FeatureGateProps {
    children: React.ReactNode;
    feature: string;
    fallback?: React.ReactNode;
}

/**
 * FeatureGate Component
 * Conditionally renders children based on feature-level access
 * 
 * @example
 * <FeatureGate feature="prescribe_medication">
 *   <PrescriptionForm />
 * </FeatureGate>
 */
export function FeatureGate({ children, feature, fallback = null }: FeatureGateProps) {
    const { hasAccess, isLoading } = useFeatureAccess(feature);

    if (isLoading) {
        return null;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * MultiPermissionGate Component
 * Renders children only if ALL specified permissions are granted
 * 
 * @example
 * <MultiPermissionGate permissions={[
 *   { module: 'pharmacy', action: 'view' },
 *   { module: 'pharmacy.stock', action: 'create' }
 * ]}>
 *   <ComplexComponent />
 * </MultiPermissionGate>
 */
interface MultiPermissionGateProps {
    children: React.ReactNode;
    permissions: Array<{ module: string; action: PermissionAction }>;
    fallback?: React.ReactNode;
    requireAll?: boolean; // If false, requires ANY permission instead of ALL
}

export function MultiPermissionGate({
    children,
    permissions,
    fallback = null,
    requireAll = true,
}: MultiPermissionGateProps) {
    const permissionChecks = permissions.map(({ module, action }) =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        usePermission(module, action)
    );

    const isLoading = permissionChecks.some((check) => check.isLoading);
    const hasAccess = requireAll
        ? permissionChecks.every((check) => check.hasAccess)
        : permissionChecks.some((check) => check.hasAccess);

    if (isLoading) {
        return null;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
