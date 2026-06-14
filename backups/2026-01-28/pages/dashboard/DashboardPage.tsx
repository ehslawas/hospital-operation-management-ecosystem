import React, { lazy, Suspense } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { SYSTEM_ROLES, SYSTEM_MODULES } from '@/lib/constants'
import { HospitalAdminDashboard } from './HospitalAdminDashboard'
import { SystemAdminDashboard } from './SystemAdminDashboard'
import { GenericDepartmentDashboard } from './GenericDepartmentDashboard'
import { LoadingOverlay } from '@/components/ui'
import { useLocation } from 'react-router-dom'

// Lazy load department dashboards for better performance and code splitting
const EmergencyDashboard = lazy(() => import('@/features/emergency/routes/EmergencyDashboard'))
const PharmacyLogisticsDashboard = lazy(() => import('@/pages/pharmacy/dashboard/PharmacyLogisticsDashboard'))
const GeneralWardDashboard = lazy(() => import('@/features/general-ward/routes/GeneralWardDashboard'))
const LaboratoryDashboard = lazy(() => import('@/features/laboratory/routes/LaboratoryDashboard'))
const HaemodialysisDashboard = lazy(() => import('@/features/haemodialysis/routes/HaemodialysisDashboard'))
const RadiologyDashboard = lazy(() => import('@/features/radiology/routes/RadiologyDashboard'))
const MaternityDashboard = lazy(() => import('@/features/maternity/routes/MaternityDashboard'))
const PaediatricDashboard = lazy(() => import('@/features/paediatric/routes/PaediatricDashboard'))
const FrontDeskDashboard = lazy(() => import('@/features/front-desk/routes/FrontDeskDashboard'))
const OfficeAdminDashboard = lazy(() => import('@/features/office-admin/routes/OfficeAdminDashboard'))
const PharmacySubStoreDashboard = lazy(() => import('@/features/pharmacy-substore/routes/PharmacySubStoreDashboard'))


/**
 * Main Dashboard Router
 * Routes users to the appropriate dashboard based on their role and department
 */
export const DashboardPage: React.FC = () => {
  const location = useLocation()
  const { user, activeRoleCode, isLoading } = useAuthStore()
  const roleCode = activeRoleCode || user?.role?.role_code
  const departmentCode = user?.department?.department_code

  // Debug logging
  console.log('[DashboardPage] Debug Info:', {
    path: location.pathname,
    roleCode,
    departmentCode,
    departmentName: user?.department?.department_name,
    userId: user?.id
  })

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

  // Route based on Department Code
  if (departmentCode) {
    // Normalize to lowercase and snake_case for consistent matching
    const normalizedDeptCode = departmentCode.toLowerCase().replace(/\s+/g, '_')
    console.log('[DashboardPage] Normalized dept code:', normalizedDeptCode)

    return (
      <Suspense fallback={<LoadingOverlay message="Loading department dashboard..." />}>
        {(() => {
          switch (normalizedDeptCode) {
            case SYSTEM_MODULES.PHARMACY_LOGISTICS:
              return <PharmacyLogisticsDashboard />

            case SYSTEM_MODULES.EMERGENCY_TRAUMA:
              return <EmergencyDashboard />

            case SYSTEM_MODULES.GENERAL_WARD:
              return <GeneralWardDashboard />

            case SYSTEM_MODULES.LABORATORY:
            case 'pathology':
              return <LaboratoryDashboard />

            case SYSTEM_MODULES.HAEMODIALYSIS:
              return <HaemodialysisDashboard />

            case SYSTEM_MODULES.RADIOLOGY:
              return <RadiologyDashboard />

            case SYSTEM_MODULES.MATERNITY_WARD:
              return <MaternityDashboard />

            case SYSTEM_MODULES.PAEDIATRIC_WARD:
              return <PaediatricDashboard />

            case SYSTEM_MODULES.FRONT_DESK:
              return <FrontDeskDashboard />

            case SYSTEM_MODULES.HOSPITAL_OFFICE:
              return <OfficeAdminDashboard />

            // Clinical & Support Modules - route to Generic Dashboard
            // These departments have active users but no specialized module yet
            case SYSTEM_MODULES.KLINIK_PAKAR:
            case SYSTEM_MODULES.CSSU_CSSD:
            case SYSTEM_MODULES.OPERATION_THEATER:
            case SYSTEM_MODULES.DRIVER_ROOM:
              return <GenericDepartmentDashboard />

            // Pharmacy substores
            case SYSTEM_MODULES.PHARMACY_SUBSTORE:
            case 'pharmacy_satellite': // Database has PHARMACY_SATELLITE
              return <PharmacySubStoreDashboard />

            default:
              // For pharmacy-related roles in any department, show pharmacy dashboard
              if ([
                SYSTEM_ROLES.PHARMACIST,
                SYSTEM_ROLES.ASSISTANT_PHARMACIST,
              ].includes(roleCode as any)) {
                return <PharmacyLogisticsDashboard />
              }
              // Generic fallback dashboard for all other departments
              // This ensures every user gets a professional dashboard experience
              return <GenericDepartmentDashboard />
          }
        })()}
      </Suspense>
    )
  }

  // Final fallback - show generic dashboard for users without department
  return <GenericDepartmentDashboard />
}

export default DashboardPage

