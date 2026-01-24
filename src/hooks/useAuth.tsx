/**
 * Authentication Hook (Unified Shim)
 * Bridges legacy useAuth() calls to the central authStore source of truth.
 * Eliminates race conditions by removing the secondary AuthContext.
 */

import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import { checkStaffPermission, checkFeaturePermission } from '@/services/permissionService';

// Keep types for compatibility
export type AuthContextType = {
    user: any;
    isLoading: boolean;
    error: Error | null;
    checkPermission: (moduleCode: string, action: string) => Promise<boolean>;
    checkFeatureAccess: (featureCode: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshPermissions: () => Promise<void>;
};

// Dummy Provider - Renders children directly
// This ensures routes.tsx doesn't break if it still wraps components
export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

// The Hook - Wraps authStore directly
export function useAuth(): AuthContextType {
    const { user, isLoading, logout: storeLogout } = useAuthStore();

    // Permission checks (proxy to service)
    const checkPermission = async (moduleCode: string, action: string) => {
        if (!user) return false;
        return checkStaffPermission(user.id, moduleCode, action as any);
    };

    const checkFeatureAccess = async (featureCode: string) => {
        if (!user) return false;
        return checkFeaturePermission(user.id, featureCode);
    };

    const handleLogout = async () => {
        await storeLogout(); // Clears store
        await supabase.auth.signOut(); // Clears Supabase
    };

    return {
        user,
        isLoading, // Now synchronized with main app loading!
        error: null,
        checkPermission,
        checkFeatureAccess,
        logout: handleLogout,
        refreshPermissions: async () => { }, // No-op as store updates automatically
    };
}
