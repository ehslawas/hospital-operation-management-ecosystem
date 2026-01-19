/**
 * Authentication Context and Hook
 * Provides authentication state and permission checking with caching
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    checkStaffPermission,
    checkFeaturePermission,
} from '../services/permissionService';
import type {
    AuthUser,
    AuthContextType,
    PermissionAction,
    ModuleWithPermissions,
} from '../types/rbac.types';
import { PERMISSION_CACHE_TTL } from '../constants/permissions';

// Permission cache structure
interface PermissionCache {
    [key: string]: {
        value: boolean;
        timestamp: number;
    };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    // Use useRef for cache to avoid triggering re-renders and infinite loops
    const permissionCacheRef = useRef<PermissionCache>({});
    const navigate = useNavigate();

    /**
     * Fetch current user details from database
     */
    const fetchUserDetails = useCallback(async (userId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('users')
                .select(`
          id,
          email,
          full_name,
          role_id,
          department_id,
          hospital_id,
          role:roles(
            id,
            role_name,
            role_code
          ),
          department:departments!department_id(
            id,
            department_name
          )
        `)
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                const authUser: AuthUser = {
                    id: data.id,
                    email: data.email,
                    full_name: data.full_name,
                    role_id: data.role_id,
                    role_name: (data.role as any)?.role_name || '',
                    role_code: (data.role as any)?.role_code || '',
                    department_id: data.department_id,
                    department_name: (data.department as any)?.department_name || null,
                    hospital_id: data.hospital_id,
                };

                setUser(authUser);



                return authUser;
            }
            return null;
        } catch (err) {
            console.error('[Auth] Error fetching user details:', err);
            setError(err as Error);
            return null;
        }
    }, []);

    /**
     * Initialize auth session
     */
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Get current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (session?.user && mounted) {
                    await fetchUserDetails(session.user.id);
                }
            } catch (err) {
                console.error('[Auth] Session init error:', err);
                if (mounted) {
                    setError(err as Error);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('[Auth] State change:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                await fetchUserDetails(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                permissionCacheRef.current = {};
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Refresh user details when token refreshes
                await fetchUserDetails(session.user.id);
            }

            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserDetails]);

    /**
     * Check if staff has permission (with caching)
     */
    const checkPermission = useCallback(
        async (moduleCode: string, action: PermissionAction): Promise<boolean> => {
            if (!user) return false;

            const cacheKey = `${user.id}:${moduleCode}:${action}`;
            const cached = permissionCacheRef.current[cacheKey];

            // Check cache validity (5 minutes TTL)
            if (cached && Date.now() - cached.timestamp < PERMISSION_CACHE_TTL) {
                return cached.value;
            }

            // Fetch fresh permission
            const hasPermission = await checkStaffPermission(user.id, moduleCode, action);

            // Update cache (using ref - no re-render triggered)
            permissionCacheRef.current[cacheKey] = {
                value: hasPermission,
                timestamp: Date.now(),
            };

            return hasPermission;
        },
        [user] // Removed permissionCache - using ref instead
    );

    /**
     * Check if staff has feature access (with caching)
     */
    const checkFeatureAccess = useCallback(
        async (featureCode: string): Promise<boolean> => {
            if (!user) return false;

            const cacheKey = `${user.id}:feature:${featureCode}`;
            const cached = permissionCacheRef.current[cacheKey];

            // Check cache validity
            if (cached && Date.now() - cached.timestamp < PERMISSION_CACHE_TTL) {
                return cached.value;
            }

            // Fetch fresh permission
            const hasAccess = await checkFeaturePermission(user.id, featureCode);

            // Update cache (using ref - no re-render triggered)
            permissionCacheRef.current[cacheKey] = {
                value: hasAccess,
                timestamp: Date.now(),
            };

            return hasAccess;
        },
        [user] // Removed permissionCache - using ref instead
    );

    /**
     * Logout user
     */
    const logout = useCallback(async () => {
        try {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;

            setUser(null);
            permissionCacheRef.current = {};
            navigate('/login');
        } catch (err) {
            console.error('[Auth] Logout error:', err);
            setError(err as Error);
        }
    }, [navigate]);

    /**
     * Manually refresh permissions (clear cache and re-fetch)
     */
    const refreshPermissions = useCallback(async () => {
        if (!user) return;

        permissionCacheRef.current = {};
    }, [user]);

    const value: AuthContextType = {
        user,
        isLoading,
        error,
        checkPermission,
        checkFeatureAccess,
        logout,
        refreshPermissions,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Export accessible modules for use in sidebar
 */
export function useAccessibleModules(): ModuleWithPermissions[] {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAccessibleModules must be used within an AuthProvider');
    }

    // Access the internal state through a custom approach
    // This is a simplified version - in production you'd expose this through the context
    return [];
}
