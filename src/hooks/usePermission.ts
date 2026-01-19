/**
 * Permission Hook
 * Simplified hook for checking permissions in components
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { PermissionAction, PermissionCheckResult } from '../types/rbac.types';

/**
 * Check if user has permission for a module action
 * 
 * @param moduleCode - Module code (e.g., 'pharmacy_management.stock')
 * @param action - Permission action (view/create/edit/delete)
 * @returns Object with hasAccess, isLoading, and error
 * 
 * @example
 * const { hasAccess, isLoading } = usePermission('pharmacy_management.stock', 'create');
 * if (hasAccess) {
 *   return <Button>Add Stock</Button>;
 * }
 */
export function usePermission(
    moduleCode?: string,
    action?: PermissionAction
): PermissionCheckResult {
    const { user, checkPermission } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!moduleCode || !action) {
            setHasAccess(false);
            setIsLoading(false);
            return;
        }

        if (!user) {
            setHasAccess(false);
            setIsLoading(false);
            return;
        }

        let mounted = true;

        const checkAccess = async () => {
            try {
                setIsLoading(true);
                const result = await checkPermission(moduleCode, action);

                if (mounted) {
                    setHasAccess(result);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err as Error);
                    setHasAccess(false);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        checkAccess();

        return () => {
            mounted = false;
        };
    }, [user, moduleCode, action, checkPermission]);

    return { hasAccess, isLoading, error };
}

/**
 * Check if user has access to a feature
 * 
 * @param featureCode - Feature code (e.g., 'add_stock')
 * @returns Object with hasAccess, isLoading, and error
 * 
 * @example
 * const { hasAccess } = useFeatureAccess('prescribe_medication');
 */
export function useFeatureAccess(featureCode?: string): PermissionCheckResult {
    const { user, checkFeatureAccess } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!featureCode) {
            setHasAccess(false);
            setIsLoading(false);
            return;
        }

        if (!user) {
            setHasAccess(false);
            setIsLoading(false);
            return;
        }

        let mounted = true;

        const checkAccess = async () => {
            try {
                setIsLoading(true);
                const result = await checkFeatureAccess(featureCode);

                if (mounted) {
                    setHasAccess(result);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err as Error);
                    setHasAccess(false);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        checkAccess();

        return () => {
            mounted = false;
        };
    }, [user, featureCode, checkFeatureAccess]);

    return { hasAccess, isLoading, error };
}

/**
 * Check multiple permissions at once
 * Useful when you need to check several permissions for conditional rendering
 * 
 * @param checks - Array of permission checks {moduleCode, action}
 * @returns Object with results array, isLoading, and error
 * 
 * @example
 * const { results, isLoading } = useMultiplePermissions([
 *   { moduleCode: 'pharmacy_management', action: 'view' },
 *   { moduleCode: 'pharmacy_management.stock', action: 'create' }
 * ]);
 */
export function useMultiplePermissions(
    checks: Array<{ moduleCode: string; action: PermissionAction }>
): {
    results: boolean[];
    isLoading: boolean;
    error: Error | null;
} {
    const { user, checkPermission } = useAuth();
    const [results, setResults] = useState<boolean[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || checks.length === 0) {
            setResults(checks.map(() => false));
            setIsLoading(false);
            return;
        }

        let mounted = true;

        const checkAllPermissions = async () => {
            try {
                setIsLoading(true);
                const permissions = await Promise.all(
                    checks.map(({ moduleCode, action }) => checkPermission(moduleCode, action))
                );

                if (mounted) {
                    setResults(permissions);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err as Error);
                    setResults(checks.map(() => false));
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        checkAllPermissions();

        return () => {
            mounted = false;
        };
    }, [user, checks, checkPermission]);

    return { results, isLoading, error };
}

/**
 * Helper hook to check if user is admin
 */
export function useIsAdmin(): boolean {
    const { user } = useAuth();
    return user?.role_code === 'system_admin' || user?.role_code === 'hospital_admin';
}

/**
 * Helper hook to check if user belongs to specific department
 */
export function useIsDepartment(departmentCode: string): boolean {
    const { user } = useAuth();
    // This is a simplified check - you'd need to fetch department details
    return user?.department_name?.toLowerCase().includes(departmentCode.toLowerCase()) || false;
}
