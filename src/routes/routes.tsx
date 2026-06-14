import React, { lazy, Suspense } from 'react'
import MyGalleryPage from '../pages/hub/gallery/MyGalleryPage'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { MainLayout, HubLayout } from '@/components/layout'
import { LoadingOverlay } from '@/components/ui'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES, SYSTEM_ROLES } from '@/lib/constants'

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/pages/legal/TermsOfServicePage'))

// Hub pages
const ModuleHubPage = lazy(() => import('@/pages/hub/ModuleHubPage'))
const CylinderSubMenu = lazy(() => import('@/pages/hub/modules/CylinderSubMenu'))
const InventorySubMenu = lazy(() => import('@/pages/hub/modules/InventorySubMenu'))
const WarrantSubMenu = lazy(() => import('@/pages/hub/modules/WarrantSubMenu'))
const SuratSubMenu = lazy(() => import('@/pages/hub/modules/SuratSubMenu'))
const BorangSubMenu = lazy(() => import('@/pages/hub/modules/BorangSubMenu'))
const SuhuSubMenu = lazy(() => import('@/pages/hub/modules/SuhuSubMenu'))
const AdminSubMenu = lazy(() => import('@/pages/hub/modules/AdminSubMenu'))
const PerolehanSubMenu = lazy(() => import('@/pages/hub/modules/PerolehanSubMenu'))
const FileSubMenu = lazy(() => import('@/pages/hub/modules/FileSubMenu'))
const FormulariSubMenu = lazy(() => import('@/pages/hub/modules/FormulariSubMenu'))
const PorterSubMenu = lazy(() => import('@/pages/hub/modules/PorterSubMenu'))
const TransporterSubMenu = lazy(() => import('@/pages/hub/modules/TransporterSubMenu'))
const PriviledgingSubMenu = lazy(() => import('@/pages/hub/modules/PriviledgingSubMenu'))
const TempahanSubMenu = lazy(() => import('@/pages/hub/modules/TempahanSubMenu'))
const KunciSubMenu = lazy(() => import('@/pages/hub/modules/KunciSubMenu'))
const CutiSubMenu = lazy(() => import('@/pages/hub/modules/CutiSubMenu'))
const TimeOffSubMenu = lazy(() => import('@/pages/hub/modules/TimeOffSubMenu'))

// Gallery pages
// const GalleryPage = lazy(() => import('../pages/hub/gallery/GalleryPage'))
const AlbumDetailPage = lazy(() => import('../pages/hub/gallery/AlbumDetailPage'))


// Admin pages
const UserListPage = lazy(() => import('@/pages/admin/users/UserListPage'))
const UserDetailPage = lazy(() => import('@/pages/admin/users/UserDetailPage'))
const AccessRequestListPage = lazy(() => import('@/pages/admin/accessRequests/AccessRequestListPage'))
const AccessRequestDetailPage = lazy(() => import('@/pages/admin/accessRequests/AccessRequestDetailPage'))
const HospitalListPage = lazy(() => import('@/pages/admin/hospitals/HospitalListPage'))
const HospitalDetailPage = lazy(() => import('@/pages/admin/hospitals/HospitalDetailPage'))
const ClinicListPage = lazy(() => import('@/pages/admin/clinics/ClinicListPage'))
const ClinicDetailPage = lazy(() => import('@/pages/admin/clinics/ClinicDetailPage'))
const DepartmentListPage = lazy(() => import('@/pages/admin/departments/DepartmentListPage'))
const DepartmentDetailPage = lazy(() => import('@/pages/admin/departments/DepartmentDetailPage'))
const RoleListPage = lazy(() => import('@/pages/admin/roles/RoleListPage'))
const RolePermissionPage = lazy(() => import('@/pages/admin/roles/RolePermissionPage'))
const AuditLogPage = lazy(() => import('@/pages/admin/auditLogs/AuditLogPage'))
const SystemSettingsPage = lazy(() => import('@/pages/admin/settings/SystemSettingsPage'))
const ModuleAccessControlPage = lazy(() => import('@/pages/admin/modules/ModuleAccessControlPage'))
const SystemMonitoringPage = lazy(() => import('@/pages/admin/monitoring/SystemMonitoringPage'))
const BackupManagementPage = lazy(() => import('@/pages/admin/backups/BackupManagementPage'))
const AlertCenterPage = lazy(() => import('@/pages/admin/alerts/AlertCenterPage'))
const SystemLogsPage = lazy(() => import('@/pages/admin/systemLogs/SystemLogsPage'))

// Profile page
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))

// Hospital Admin pages
const MemoListPage = lazy(() => import('@/pages/admin/memos/MemoListPage'))
const SensitiveDataRequestListPage = lazy(() => import('@/pages/admin/sensitiveData/SensitiveDataRequestListPage'))
const SensitiveDataRequestDetailPage = lazy(() => import('@/pages/admin/sensitiveData/SensitiveDataRequestDetailPage'))

// Pharmacy Logistics pages
const PharmacyLogisticsDashboard = lazy(() => import('@/pages/pharmacy/dashboard/PharmacyLogisticsDashboard'))
const InventoryOverviewPage = lazy(() => import('@/pages/pharmacy/inventory/InventoryOverviewPage'))
const DrugInventoryPage = lazy(() => import('@/pages/pharmacy/inventory/DrugInventoryPage'))
const NonDrugInventoryPage = lazy(() => import('@/pages/pharmacy/inventory/NonDrugInventoryPage'))
const NearExpiryPage = lazy(() => import('@/pages/pharmacy/inventory/NearExpiryPage'))
const SlowMovingPage = lazy(() => import('@/pages/pharmacy/inventory/SlowMovingPage'))
const OxygenDashboardPage = lazy(() => import('@/pages/pharmacy/oxygen/OxygenDashboardPage'))
const PurchaseOrderListPage = lazy(() => import('@/pages/pharmacy/procurement/PurchaseOrderListPage'))
const PurchaseOrderCreatePage = lazy(() => import('@/pages/pharmacy/procurement/PurchaseOrderCreatePage'))
const PurchaseOrderDetailPage = lazy(() => import('@/pages/pharmacy/procurement/PurchaseOrderDetailPage'))
const ReceivingPage = lazy(() => import('@/pages/pharmacy/procurement/ReceivingPage'))
const LPOListPage = lazy(() => import('@/pages/pharmacy/procurement/LPOListPage'))
const OrderTrackingPage = lazy(() => import('@/pages/pharmacy/procurement/OrderTrackingPage'))
const CreditNoteAuditPage = lazy(() => import('@/pages/pharmacy/procurement/CreditNoteAuditPage'))
const PenaltyPage = lazy(() => import('@/pages/pharmacy/procurement/PenaltyPage'))
const PenaltyDetailPage = lazy(() => import('@/pages/pharmacy/procurement/PenaltyDetailPage'))
const SupplierPerformancePage = lazy(() => import('@/pages/pharmacy/procurement/SupplierPerformancePage'))
const PaymentPage = lazy(() => import('@/pages/pharmacy/procurement/PaymentPage'))
const TransferRequestListPage = lazy(() => import('@/pages/pharmacy/distribution/TransferRequestListPage'))
const BudgetOverviewPage = lazy(() => import('@/pages/pharmacy/financial/BudgetOverviewPage'))
const WarrantPage = lazy(() => import('@/pages/pharmacy/financial/WarrantPage'))
const APPLAllocationPage = lazy(() => import('@/pages/pharmacy/financial/APPLAllocationPage'))
const CCAllocationPage = lazy(() => import('@/pages/pharmacy/financial/CCAllocationPage'))
const ReportsPage = lazy(() => import('@/pages/pharmacy/reports/ReportsPage'))
const ProcurementReportPage = lazy(() => import('@/pages/pharmacy/reports/ProcurementReportPage'))
const FinancialReportPage = lazy(() => import('@/pages/pharmacy/reports/FinancialReportPage'))
const StockLocationPage = lazy(() => import('@/pages/pharmacy/maintenance/StockLocationPage'))
const StockVerificationPage = lazy(() => import('@/pages/pharmacy/maintenance/StockVerificationPage'))
const UnitCatalogPage = lazy(() => import('@/pages/pharmacy/maintenance/UnitCatalogPage'))
const DrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/DrugCatalogPage'))
const NonDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/NonDrugCatalogPage'))
const SupplierCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/SupplierCatalogPage'))
const ContractCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ContractCatalogPage'))
const FacilityCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/FacilityCatalogPage'))
const MyWarrantDashboard = lazy(() => import('@/pages/mywarrant/MyWarrantDashboard'))

// Fallback loading component
const PageLoader = () => <LoadingOverlay fullScreen message="Loading page..." />

// Create router with v7 future flags
const router = createBrowserRouter(
  [
  {
    path: ROUTES.HUB,
    element: (
      <ProtectedRoute>
        <HubLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'test-route',
        element: <div className="p-20 text-white">Route is working!</div>,
      },
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ModuleHubPage />
          </Suspense>
        ),
      },
      {
        path: 'gallery',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyGalleryPage />
          </Suspense>
        ),
      },
      {
        path: 'gallery/:albumId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AlbumDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'cylinder',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CylinderSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventorySubMenu />
          </Suspense>
        ),
      },
      {
        path: 'warrant',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WarrantSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'surat',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SuratSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'borang',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BorangSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'suhu',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SuhuSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'perolehan',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PerolehanSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'file',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FileSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'formulari',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FormulariSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'porter',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PorterSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'transporter',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TransporterSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'priviledging',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PriviledgingSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'tempahan',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TempahanSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'kunci',
        element: (
          <Suspense fallback={<PageLoader />}>
            <KunciSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'cuti',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CutiSubMenu />
          </Suspense>
        ),
      },
      {
        path: 'time-off',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TimeOffSubMenu />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.PRIVACY_POLICY,
    element: (
      <Suspense fallback={<PageLoader />}>
        <PrivacyPolicyPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.TERMS_OF_SERVICE,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TermsOfServicePage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.HUB} replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PROFILE,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      // Admin routes
      {
        path: ROUTES.ADMIN_USERS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <UserListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_USERS}/:userId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <UserDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_ACCESS_REQUESTS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <AccessRequestListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_ACCESS_REQUESTS}/:requestId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <AccessRequestDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_HOSPITALS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <HospitalListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_HOSPITALS}/:hospitalId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <HospitalDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_CLINICS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ClinicListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_CLINICS}/:clinicId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ClinicDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_DEPARTMENTS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <DepartmentListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_DEPARTMENTS}/:departmentId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <DepartmentDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_ROLES,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <RoleListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_ROLES}/:roleId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <RolePermissionPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_AUDIT_LOGS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AuditLogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_SETTINGS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <SystemSettingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_MODULES,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ModuleAccessControlPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_MONITORING,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <SystemMonitoringPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_BACKUPS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <BackupManagementPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_ALERTS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AlertCenterPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_SYSTEM_LOGS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <SystemLogsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Hospital Admin Routes
      {
        path: ROUTES.ADMIN_HOSPITAL_LOGS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <SystemLogsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_HOSPITAL_HEALTH,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <SystemMonitoringPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_HOSPITAL_BACKUPS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <BackupManagementPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_MEMOS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <MemoListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <SensitiveDataRequestListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}/:requestId`,
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR]}>
            <Suspense fallback={<PageLoader />}>
              <SensitiveDataRequestDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/*',
        element: (
          <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Administration
                </h1>
                <p className="text-gray-600">
                  Other admin modules coming soon. This will include hospitals, departments, roles, and settings.
                </p>
              </div>
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Pharmacy Logistics routes
      {
        path: 'pharmacy',
        element: <Navigate to={ROUTES.PHARMACY_DASHBOARD} replace />,
      },
      {
        path: 'pharmacy/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <MyWarrantDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: 'pharmacy/inventory',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <InventoryOverviewPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/oxygen',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <OxygenDashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/oxygen/cylinders',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <OxygenDashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/oxygen/consumption',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <OxygenDashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/oxygen/qr',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <OxygenDashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/oxygen/reconciliation',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <OxygenDashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Inventory sub-pages
      {
        path: 'pharmacy/inventory/drugs',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <DrugInventoryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/non-drugs',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <NonDrugInventoryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/near-expiry',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <NearExpiryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/slow-moving',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <SlowMovingPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Procurement routes
      {
        path: 'pharmacy/procurement/orders',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <PurchaseOrderListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/procurement/orders/create',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <PurchaseOrderCreatePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_PO_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <PurchaseOrderDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/procurement/receiving',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <ReceivingPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_LPO,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <LPOListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_ORDER_TRACKING,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <OrderTrackingPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_PENALTY,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <PenaltyPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_PENALTY_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <PenaltyDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_SUPPLIER_PERFORMANCE,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <SupplierPerformancePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_CREDIT_NOTE,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <CreditNoteAuditPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_PAYMENT,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <PaymentPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Distribution routes
      {
        path: 'pharmacy/distribution',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <TransferRequestListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Financial routes
      {
        path: 'pharmacy/financial/budget',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <BudgetOverviewPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/financial/warrant',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <WarrantPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_APPL_ALLOCATION,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <APPLAllocationPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_CC_ALLOCATION,
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <CCAllocationPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Reports & Logs routes
      {
        path: 'pharmacy/reports',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/reports/inventory',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/reports/procurement',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <ProcurementReportPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/reports/financial',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <FinancialReportPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/reports/distribution',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/logs',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <SystemLogsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Maintenance routes
      {
        path: 'pharmacy/maintenance/locations',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <StockLocationPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/maintenance/verification',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <StockVerificationPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/maintenance/units',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <UnitCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/catalog/drugs',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <DrugCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/catalog/suppliers',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <SupplierCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/catalog/contracts',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <ContractCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/catalog/non-drugs',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <NonDrugCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/catalog/facilities',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <FacilityCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/*',
        element: (
          <ProtectedRoute allowedRoles={[
            SYSTEM_ROLES.PHARMACY_DIRECTOR,
            SYSTEM_ROLES.PHARMACY_MANAGER,
            SYSTEM_ROLES.PHARMACIST,
            SYSTEM_ROLES.PHARMACY_ASSISTANT,
            SYSTEM_ROLES.ASSISTANT_PHARMACIST,
            SYSTEM_ROLES.PHARMACY_STOREKEEPER,
            SYSTEM_ROLES.PHARMACY_STAFF,
          ]}>
            <Suspense fallback={<PageLoader />}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Pharmacy Logistics
                </h1>
                <p className="text-gray-600">
                  This page is under development. Please check back soon.
                </p>
              </div>
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
)

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}

export default AppRouter

