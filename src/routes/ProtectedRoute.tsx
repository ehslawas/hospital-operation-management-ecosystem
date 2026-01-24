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
  const { isAuthenticated, isLoading, user, activeRoleCode } = useAuthStore()

  // COMPREHENSIVE SESSION GATE
  // Gate 1: Auth state still loading from storage
  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading..." />
  }

  // Gate 2: Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Gate 3: Supabase session not yet verified (async background check)
  // This prevents the race condition where pages render before auth.uid() is confirmed
  const { supabaseSessionReady } = useAuthStore.getState()
  if (!supabaseSessionReady) {
    return <LoadingOverlay fullScreen message="Verifying session..." />
  }

  // Gate 4: User data not fully hydrated (critical for all pages)
  // Most pages need hospital_id immediately
  if (!user?.hospital_id) {
    return <LoadingOverlay fullScreen message="Loading user data..." />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = activeRoleCode || user?.role?.role_code
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have required role, redirect to dashboard
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
