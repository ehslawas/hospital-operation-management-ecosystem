import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/constants'
import { LoadingOverlay } from '@/components/ui'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user, activeRoleCode, supabaseSessionReady } = useAuthStore()

  // DEBUG: Tracking route access
  console.log(`[ProtectedRoute] Accessing: ${location.pathname}`, {
    isAuthenticated,
    isLoading,
    supabaseSessionReady,
    userHospitalId: user?.hospital_id,
    activeRole: activeRoleCode || user?.role?.role_code
  });

  // COMPREHENSIVE SESSION GATE
  // Gate 1: Auth state still loading from storage
  if (isLoading) {
    console.log('[ProtectedRoute] Gate 1: Loading auth state...');
    return <LoadingOverlay fullScreen message="Loading..." />
  }

  // Gate 2: Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Gate 2: Not authenticated, redirecting to login');
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Gate 3: Supabase session not yet verified (async background check)
  if (!supabaseSessionReady) {
    console.log('[ProtectedRoute] Gate 3: Supabase session not ready...');
    return <LoadingOverlay fullScreen message="Verifying session..." />
  }

  // Gate 4: User data not fully hydrated (critical for all pages)
  if (!user?.hospital_id) {
    console.log('[ProtectedRoute] Gate 4: User data (hospital_id) missing...');
    return <LoadingOverlay fullScreen message="Loading user data..." />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = activeRoleCode || user?.role?.role_code
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[ProtectedRoute] Access denied! Required: ${allowedRoles}, Found: ${userRole}`);
      // User doesn't have required role, redirect to dashboard
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
  }

  console.log('[ProtectedRoute] Access granted to:', location.pathname);
  return <>{children}</>
}

export default ProtectedRoute
