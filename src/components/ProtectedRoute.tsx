/**
 * Protected Route Component
 * Wraps routes that require authentication and specific permissions
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import type { PermissionAction } from '../types/rbac.types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    moduleCode?: string;
    action?: PermissionAction;
    requireAuth?: boolean;
}

/**
 * ProtectedRoute Component
 * 
 * @example
 * // Require authentication only
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Require specific permission
 * <ProtectedRoute moduleCode="pharmacy_management.stock" action="view">
 *   <StockPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
    children,
    moduleCode,
    action,
    requireAuth = true,
}: ProtectedRouteProps) {
    const { user, isLoading: authLoading } = useAuth();
    const { hasAccess, isLoading: permLoading } = usePermission(moduleCode, action);
    const location = useLocation();

    //Loading state
    if (authLoading || (moduleCode && action && permLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (requireAuth && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Redirect to 403 if missing required permission
    if (moduleCode && action && !hasAccess) {
        return <Navigate to="/403" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
