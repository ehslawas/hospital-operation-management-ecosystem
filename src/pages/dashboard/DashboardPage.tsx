// @ts-nocheck
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { SYSTEM_ROLES, ROUTES } from '@/lib/constants'
import { SystemAdminDashboard } from './SystemAdminDashboard'
import { HospitalAdminDashboard } from './HospitalAdminDashboard'
import { PharmacyLogisticsDashboard } from '@/modules/mywarrant/pages/dashboard/PharmacyLogisticsDashboard'
import { LoadingOverlay } from '@/components/ui'

// Helper to check if role is pharmacy-related
const isPharmacyRole = (roleCode?: string): boolean => {
  if (!roleCode) return false
  return [
    SYSTEM_ROLES.PHARMACY_DIRECTOR,
    SYSTEM_ROLES.PHARMACY_MANAGER,
    SYSTEM_ROLES.PHARMACIST,
    SYSTEM_ROLES.PHARMACY_ASSISTANT,
    SYSTEM_ROLES.ASSISTANT_PHARMACIST,
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
  if (roleCode === SYSTEM_ROLES.HOSPITAL_ADMIN || roleCode === SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR) {
    return <HospitalAdminDashboard />
  }

  // Pharmacy roles - show pharmacy logistics dashboard
  if (isPharmacyRole(roleCode)) {
    return <PharmacyLogisticsDashboard />
  }

  // Default fallback - Temporarily allow all other roles to access the PharmacyLogisticsDashboard per user request
  if (roleCode) {
    return <PharmacyLogisticsDashboard />
  }

  // Fallback for users without any assigned role - render PharmacyLogisticsDashboard per user request
  return <PharmacyLogisticsDashboard />
}

export default DashboardPage
