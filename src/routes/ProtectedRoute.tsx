import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { ROUTES } from '@/lib/constants'
import { LoadingOverlay } from '@/components/ui'
import { ActionType } from '@/shared/constants/moduleRegistry'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requiredModule?: string
  requiredAction?: ActionType
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredModule,
  requiredAction = 'view',
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const { isSuperAdmin, canAccessModule, hasPermission } = usePermission()

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingOverlay fullScreen message="Memeriksa pengesahan pengguna..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Super Admin bypasses all route restrictions
  if (isSuperAdmin) {
    return <>{children}</>
  }

  const userRoleCode = (user?.role?.role_code || (user as any)?.role_code || '').toLowerCase()

  // 1. Check explicit allowedRoles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const isRoleAllowed = allowedRoles.some((r) => r.toLowerCase() === userRoleCode)
    if (!isRoleAllowed) {
      return (
        <Navigate
          to={ROUTES.UNAUTHORIZED}
          state={{
            attemptedPath: location.pathname,
            requiredRole: allowedRoles.join(', '),
          }}
          replace
        />
      )
    }
  }

  // 2. Check required module accessibility if specified
  if (requiredModule) {
    if (requiredAction === 'view') {
      if (!canAccessModule(requiredModule)) {
        return (
          <Navigate
            to={ROUTES.UNAUTHORIZED}
            state={{
              attemptedPath: location.pathname,
              moduleName: requiredModule,
            }}
            replace
          />
        )
      }
    } else {
      if (!hasPermission(requiredModule, requiredAction)) {
        return (
          <Navigate
            to={ROUTES.UNAUTHORIZED}
            state={{
              attemptedPath: location.pathname,
              moduleName: requiredModule,
            }}
            replace
          />
        )
      }
    }
  }

  return <>{children}</>
}

export default ProtectedRoute

