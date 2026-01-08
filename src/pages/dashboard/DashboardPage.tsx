import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { SYSTEM_ROLES } from '@/lib/constants'
import { SystemAdminDashboard } from './SystemAdminDashboard'
import { HospitalAdminDashboard } from './HospitalAdminDashboard'
import { PharmacyLogisticsDashboard } from '@/pages/pharmacy/dashboard'
import { LoadingOverlay } from '@/components/ui'

// Helper to check if role is pharmacy-related
const isPharmacyRole = (roleCode?: string): boolean => {
  if (!roleCode) return false
  return [
    SYSTEM_ROLES.PHARMACY_DIRECTOR,
    SYSTEM_ROLES.PHARMACY_MANAGER,
    SYSTEM_ROLES.PHARMACIST,
    SYSTEM_ROLES.PHARMACY_ASSISTANT,
    SYSTEM_ROLES.PHARMACY_STOREKEEPER,
    SYSTEM_ROLES.PHARMACY_STAFF,
  ].includes(roleCode as any)
}

/**
 * Main Dashboard Router
 * Routes users to the appropriate dashboard based on their role
 */
export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuthStore()
  const roleCode = user?.role?.role_code

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading dashboard..." />
  }

  // System Admin - manages entire system (all hospitals)
  if (roleCode === SYSTEM_ROLES.SYSTEM_ADMIN) {
    return <SystemAdminDashboard />
  }

  // Hospital Admin - manages only their hospital
  if (roleCode === SYSTEM_ROLES.HOSPITAL_ADMIN) {
    return <HospitalAdminDashboard />
  }

  // Pharmacy roles - show pharmacy logistics dashboard
  if (isPharmacyRole(roleCode)) {
    return <PharmacyLogisticsDashboard />
  }

  // Default fallback - show message for users without assigned role
  // Don't redirect to login as user is authenticated
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome to your Dashboard
        </h2>
        <p className="text-slate-600 mb-4">
          Your account is active, but no dashboard has been assigned for your role yet.
        </p>
        <p className="text-sm text-slate-500">
          Please contact your system administrator to assign the appropriate role and dashboard access.
        </p>
      </div>
    </div>
  )
}

export default DashboardPage
