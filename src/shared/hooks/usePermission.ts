import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { SYSTEM_MODULE_REGISTRY, ActionType } from '@/shared/constants/moduleRegistry'
import { SYSTEM_ROLES } from '@/shared/constants/roles'

export interface UserPermissionContext {
  isSuperAdmin: boolean
  isHospitalAdmin: boolean
  userRoleCode: string
  userDepartmentId?: string
  canAccessModule: (moduleCode: string) => boolean
  hasPermission: (moduleCode: string, action: ActionType, featureCode?: string) => boolean
  getAccessibleModules: () => string[]
}

/**
 * Hook for fine-grained Role-Based and Action-Based Access Control (RBAC & PBAC)
 */
export function usePermission(): UserPermissionContext {
  const { user } = useAuthStore()

  const userRoleCode = useMemo(() => {
    return (user?.role?.role_code || (user as any)?.role_code || 'staff').toLowerCase()
  }, [user])

  const isSuperAdmin = useMemo(() => {
    if (!user) return false
    const role = userRoleCode
    const name = (user.role?.role_name || '').toLowerCase()
    return (
      role === SYSTEM_ROLES.SYSTEM_ADMIN ||
      role === 'superadmin' ||
      role === 'super_admin' ||
      name.includes('system admin') ||
      name.includes('superadmin') ||
      name.includes('super admin')
    )
  }, [user, userRoleCode])

  const isHospitalAdmin = useMemo(() => {
    if (!user) return false
    const role = userRoleCode
    return (
      isSuperAdmin ||
      role === SYSTEM_ROLES.HOSPITAL_ADMIN ||
      role === SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR ||
      role === 'hospital_admin'
    )
  }, [user, userRoleCode, isSuperAdmin])

  /**
   * Check whether the user's role can access a specific module
   */
  const canAccessModule = useMemo(() => {
    return (moduleCode: string): boolean => {
      if (!user) return false
      if (isSuperAdmin) return true

      const normalizedCode = moduleCode.toLowerCase()
      const moduleDef = SYSTEM_MODULE_REGISTRY.find(
        (m) => m.code.toLowerCase() === normalizedCode || m.name.toLowerCase() === normalizedCode
      )

      if (!moduleDef) {
        // Fallback for submenus or dynamic future modules
        return true
      }

      // Check default assigned roles
      const hasDefaultRole = moduleDef.defaultRoles.some(
        (r) => r.toLowerCase() === userRoleCode
      )

      if (hasDefaultRole) return true

      // Check stored custom permissions or overrides from localStorage
      try {
        const storedOverrides = localStorage.getItem(`home_rbac_overrides_${userRoleCode}`)
        if (storedOverrides) {
          const parsed = JSON.parse(storedOverrides)
          if (parsed[normalizedCode] && parsed[normalizedCode].view) {
            return true
          }
        }
      } catch (e) {
        // Ignore JSON parse error
      }

      return false
    }
  }, [user, isSuperAdmin, userRoleCode])

  /**
   * Check whether the user has a specific granular capability (e.g. approve, edit, export, delete)
   */
  const hasPermission = useMemo(() => {
    return (moduleCode: string, action: ActionType, featureCode?: string): boolean => {
      if (!user) return false
      if (isSuperAdmin) return true

      const normalizedModule = moduleCode.toLowerCase()

      // First check if user can access the module at all
      if (!canAccessModule(normalizedModule)) {
        return false
      }

      // System Admins and Hospital Admins have high privileges in administrative modules
      if (isHospitalAdmin && (normalizedModule === 'admin' || action === 'view')) {
        return true
      }

      // Pharmacy Director and Pharmacy Manager have full approval privileges in pharmacy modules
      const isPharmacyLead =
        userRoleCode === SYSTEM_ROLES.PHARMACY_DIRECTOR ||
        userRoleCode === SYSTEM_ROLES.PHARMACY_MANAGER

      if (isPharmacyLead && ['pharmacy_logistics', 'inventory', 'cylinder', 'mysuhu', 'myformulari'].includes(normalizedModule)) {
        return true
      }

      // Transport Admin has approval privileges in transport
      if (userRoleCode === SYSTEM_ROLES.TRANSPORT_ADMIN && normalizedModule === 'mytransporter') {
        return true
      }

      // Check saved custom role matrix overrides in localStorage if available
      try {
        const storedOverrides = localStorage.getItem(`home_rbac_overrides_${userRoleCode}`)
        if (storedOverrides) {
          const parsed = JSON.parse(storedOverrides)
          if (parsed[normalizedModule]) {
            if (featureCode && parsed[normalizedModule].features?.[featureCode]) {
              return !!parsed[normalizedModule].features[featureCode][action]
            }
            return !!parsed[normalizedModule][action]
          }
        }
      } catch (e) {
        // Ignore parse error
      }

      // Default baseline capabilities per action
      switch (action) {
        case 'view':
          return true
        case 'create':
        case 'edit':
          // Standard staff and above can create/edit within their assigned modules
          return true
        case 'approve':
          // Approvals are strictly reserved for lead/manager/admin roles
          return isHospitalAdmin || isPharmacyLead || userRoleCode.includes('manager') || userRoleCode.includes('director') || userRoleCode.includes('admin')
        case 'delete':
          return isHospitalAdmin || isPharmacyLead || userRoleCode.includes('admin')
        case 'export':
          return true
        case 'admin':
          return isSuperAdmin || (isHospitalAdmin && normalizedModule === 'admin')
        default:
          return false
      }
    }
  }, [user, isSuperAdmin, isHospitalAdmin, userRoleCode, canAccessModule])

  const getAccessibleModules = useMemo(() => {
    return (): string[] => {
      return SYSTEM_MODULE_REGISTRY.filter((m) => canAccessModule(m.code)).map((m) => m.code)
    }
  }, [canAccessModule])

  return {
    isSuperAdmin,
    isHospitalAdmin,
    userRoleCode,
    userDepartmentId: user?.department_id,
    canAccessModule,
    hasPermission,
    getAccessibleModules,
  }
}

export default usePermission
