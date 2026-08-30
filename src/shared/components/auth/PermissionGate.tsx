import React from 'react'
import { usePermission } from '@/shared/hooks/usePermission'
import { ActionType } from '@/shared/constants/moduleRegistry'

export interface PermissionGateProps {
  module: string
  action?: ActionType
  feature?: string
  children: React.ReactNode
  fallback?: React.ReactNode
  requireSuperAdmin?: boolean
  requireHospitalAdmin?: boolean
}

/**
 * Declarative component for guarding UI elements (buttons, sections, actions) based on permissions.
 * If user lacks required capability, renders fallback (or null).
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action = 'view',
  feature,
  children,
  fallback = null,
  requireSuperAdmin = false,
  requireHospitalAdmin = false,
}) => {
  const { isSuperAdmin, isHospitalAdmin, hasPermission, canAccessModule } = usePermission()

  if (requireSuperAdmin && !isSuperAdmin) {
    return <>{fallback}</>
  }

  if (requireHospitalAdmin && !isHospitalAdmin) {
    return <>{fallback}</>
  }

  if (action === 'view') {
    if (!canAccessModule(module)) {
      return <>{fallback}</>
    }
  } else {
    if (!hasPermission(module, action, feature)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

export default PermissionGate
