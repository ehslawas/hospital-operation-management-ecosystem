import React, { lazy, Suspense } from 'react'
const MyGalleryPage = lazy(() => import('@/modules/hub/pages/gallery/MyGalleryPage'))
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
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/pages/legal/TermsOfServicePage'))

// Hub pages
const ModuleHubPage = lazy(() => import('@/modules/hub/pages/ModuleHubPage'))
const CylinderSubMenu = lazy(() => import('@/modules/hub/pages/modules/CylinderSubMenu'))
const InventorySubMenu = lazy(() => import('@/modules/hub/pages/modules/InventorySubMenu'))
const WarrantSubMenu = lazy(() => import('@/modules/hub/pages/modules/WarrantSubMenu'))
const SuratSubMenu = lazy(() => import('@/modules/hub/pages/modules/SuratSubMenu'))
const BorangSubMenu = lazy(() => import('@/modules/hub/pages/modules/BorangSubMenu'))
const SuhuSubMenu = lazy(() => import('@/modules/hub/pages/modules/SuhuSubMenu'))
const SuhuDashboardPage = lazy(() => import('@/modules/mysuhu/pages/SuhuDashboardPage'))
const DepartmentSuhuPage = lazy(() => import('@/modules/mysuhu/pages/DepartmentSuhuPage'))
const UnitDetailPage = lazy(() => import('@/modules/mysuhu/pages/UnitDetailPage'))
const BreachLogPage = lazy(() => import('@/modules/mysuhu/pages/BreachLogPage'))
const AdminSetupPage = lazy(() => import('@/modules/mysuhu/pages/AdminSetupPage'))
const AdminSubMenu = lazy(() => import('@/modules/hub/pages/modules/AdminSubMenu'))
const PerolehanSubMenu = lazy(() => import('@/modules/hub/pages/modules/PerolehanSubMenu'))
const FileSubMenu = lazy(() => import('@/modules/hub/pages/modules/FileSubMenu'))
const FormulariSubMenu = lazy(() => import('@/modules/hub/pages/modules/FormulariSubMenu'))
const PorterSubMenu = lazy(() => import('@/modules/hub/pages/modules/PorterSubMenu'))
const TransporterSubMenu = lazy(() => import('@/modules/hub/pages/modules/TransporterSubMenu'))
const PriviledgingSubMenu = lazy(() => import('@/modules/hub/pages/modules/PriviledgingSubMenu'))
const TempahanSubMenu = lazy(() => import('@/modules/hub/pages/modules/TempahanSubMenu'))
const KunciSubMenu = lazy(() => import('@/modules/hub/pages/modules/KunciSubMenu'))
const CrossBorderSubMenu = lazy(() => import('@/modules/hub/pages/modules/CrossBorderSubMenu'))
const CutiSubMenu = lazy(() => import('@/modules/hub/pages/modules/CutiSubMenu'))
const TimeOffSubMenu = lazy(() => import('@/modules/hub/pages/modules/TimeOffSubMenu'))

// Kunci pages
const KunciDashboardPage = lazy(() => import('@/modules/mykunci/pages/KunciDashboardPage'))
const KunciRegistryPage = lazy(() => import('@/modules/mykunci/pages/KunciRegistryPage'))
const KunciLogPage = lazy(() => import('@/modules/mykunci/pages/KunciLogPage'))
const KunciAuditPage = lazy(() => import('@/modules/mykunci/pages/KunciAuditPage'))
const KunciPolicyPage = lazy(() => import('@/modules/mykunci/pages/KunciPolicyPage'))

// Crossborder pages
const CrossborderDashboardPage = lazy(() => import('@/modules/mycrossborder/pages/CrossborderDashboardPage'))
const CrossborderCreatePage = lazy(() => import('@/modules/mycrossborder/pages/CrossborderCreatePage'))
const CrossborderDetailPage = lazy(() => import('@/modules/mycrossborder/pages/CrossborderDetailPage'))
const CrossborderLogPage = lazy(() => import('@/modules/mycrossborder/pages/CrossborderLogPage'))

// Transporter pages
const TransporterDashboardPage = lazy(() => import('@/modules/mytransporter/pages/TransporterDashboardPage'))
const TransporterRequestFormPage = lazy(() => import('@/modules/mytransporter/pages/TransporterRequestFormPage'))
const TransporterAvailabilityPage = lazy(() => import('@/modules/mytransporter/pages/TransporterAvailabilityPage'))
const TransporterMyRequestsPage = lazy(() => import('@/modules/mytransporter/pages/TransporterMyRequestsPage'))
const TransporterDriverPanelPage = lazy(() => import('@/modules/mytransporter/pages/TransporterDriverPanelPage'))
const TransporterAdminApprovalPage = lazy(() => import('@/modules/mytransporter/pages/TransporterAdminApprovalPage'))
const TransporterVehicleRegistryPage = lazy(() => import('@/modules/mytransporter/pages/TransporterVehicleRegistryPage'))
const TransporterVehicleMovementPage = lazy(() => import('@/modules/mytransporter/pages/TransporterVehicleMovementPage'))
const TransporterDriverMonitorPage = lazy(() => import('@/modules/mytransporter/pages/TransporterDriverMonitorPage'))
const TransporterReportsPage = lazy(() => import('@/modules/mytransporter/pages/TransporterReportsPage'))
const TransporterVehicleIssuesPage = lazy(() => import('@/modules/mytransporter/pages/TransporterVehicleIssuesPage'))
const TransporterRoleAssignmentPage = lazy(() => import('@/modules/mytransporter/pages/TransporterRoleAssignmentPage'))


// Gallery pages
// const GalleryPage = lazy(() => import('../pages/hub/gallery/GalleryPage'))
const AlbumDetailPage = lazy(() => import('@/modules/hub/pages/gallery/AlbumDetailPage'))


// Admin pages
const UserListPage = lazy(() => import('@modules/admin/pages/users/UserListPage'))
const UserDetailPage = lazy(() => import('@modules/admin/pages/users/UserDetailPage'))
const AccessRequestListPage = lazy(() => import('@modules/admin/pages/accessRequests/AccessRequestListPage'))
const AccessRequestDetailPage = lazy(() => import('@modules/admin/pages/accessRequests/AccessRequestDetailPage'))
const HospitalListPage = lazy(() => import('@modules/admin/pages/hospitals/HospitalListPage'))
const HospitalDetailPage = lazy(() => import('@modules/admin/pages/hospitals/HospitalDetailPage'))
const ClinicListPage = lazy(() => import('@modules/admin/pages/clinics/ClinicListPage'))
const ClinicDetailPage = lazy(() => import('@modules/admin/pages/clinics/ClinicDetailPage'))
const DepartmentListPage = lazy(() => import('@modules/admin/pages/departments/DepartmentListPage'))
const DepartmentDetailPage = lazy(() => import('@modules/admin/pages/departments/DepartmentDetailPage'))
const RoleListPage = lazy(() => import('@modules/admin/pages/roles/RoleListPage'))
const RolePermissionPage = lazy(() => import('@modules/admin/pages/roles/RolePermissionPage'))
const AuditLogPage = lazy(() => import('@modules/admin/pages/auditLogs/AuditLogPage'))
const SystemSettingsPage = lazy(() => import('@modules/admin/pages/settings/SystemSettingsPage'))
const ModuleAccessControlPage = lazy(() => import('@modules/admin/pages/modules/ModuleAccessControlPage'))
const SystemMonitoringPage = lazy(() => import('@modules/admin/pages/monitoring/SystemMonitoringPage'))
const BackupManagementPage = lazy(() => import('@modules/admin/pages/backups/BackupManagementPage'))
const AlertCenterPage = lazy(() => import('@modules/admin/pages/alerts/AlertCenterPage'))
const SystemLogsPage = lazy(() => import('@modules/admin/pages/systemLogs/SystemLogsPage'))

// Profile page
const ProfilePage = lazy(() => import('@/modules/profile/pages/profile/ProfilePage'))

// Hospital Admin pages
const MemoListPage = lazy(() => import('@/modules/hospital-admin/pages/memos/MemoListPage'))
const SensitiveDataRequestListPage = lazy(() => import('@/modules/hospital-admin/pages/sensitiveData/SensitiveDataRequestListPage'))
const SensitiveDataRequestDetailPage = lazy(() => import('@/modules/hospital-admin/pages/sensitiveData/SensitiveDataRequestDetailPage'))

// Pharmacy Logistics pages
const PharmacyLogisticsDashboard = lazy(() => import('@/modules/mywarrant/pages/dashboard/PharmacyLogisticsDashboard'))
const InventoryOverviewPage = lazy(() => import('@/modules/inventory/pages/inventory/InventoryOverviewPage'))
const DrugInventoryPage = lazy(() => import('@/modules/inventory/pages/inventory/DrugInventoryPage'))
const NonDrugInventoryPage = lazy(() => import('@/modules/inventory/pages/inventory/NonDrugInventoryPage'))
const FacilityDrugInventoryPage = lazy(() => import('@/modules/inventory/pages/inventory/FacilityDrugInventoryPage'))
const FacilityNonDrugInventoryPage = lazy(() => import('@/modules/inventory/pages/inventory/FacilityNonDrugInventoryPage'))
const StoreLocationManagementPage = lazy(() => import('@/modules/inventory/pages/inventory/StoreLocationManagementPage'))
const NearExpiryPage = lazy(() => import('@/modules/inventory/pages/inventory/NearExpiryPage'))
const SlowMovingPage = lazy(() => import('@/modules/inventory/pages/inventory/SlowMovingPage'))
const InventoryReportPage = lazy(() => import('@/modules/inventory/pages/inventory/InventoryReportPage'))
const StockMovementScannerPage = lazy(() => import('@/modules/inventory/pages/inventory/StockMovementScannerPage'))
const KewPs4LedgerPage = lazy(() => import('@/modules/inventory/pages/inventory/KewPs4LedgerPage'))
const APPLInventoryPage = lazy(() => import('@/modules/inventory/pages/inventory/APPLInventoryPage'))

const OxygenDashboardPage = lazy(() => import('@/modules/mycylinder/pages/oxygen/OxygenDashboardPage'))
const CylinderReportPage = lazy(() => import('@/modules/mycylinder/pages/oxygen/CylinderReportPage'))
const CylinderMaintenancePage = lazy(() => import('@/modules/mycylinder/pages/oxygen/CylinderMaintenancePage'))
const MyPhisDashboardPage = lazy(() => import('@/modules/myphis/pages/MyPhisDashboardPage'))
const MyMsdsDashboardPage = lazy(() => import('@/modules/mymsds/pages/MyMsdsDashboardPage'))
const PurchaseOrderListPage = lazy(() => import('@/modules/procurement/pages/procurement/PurchaseOrderListPage'))
const PurchaseOrderCreatePage = lazy(() => import('@/modules/procurement/pages/procurement/PurchaseOrderCreatePage'))
const PurchaseOrderDetailPage = lazy(() => import('@/modules/procurement/pages/procurement/PurchaseOrderDetailPage'))
const ReceivingPage = lazy(() => import('@/modules/procurement/pages/procurement/ReceivingPage'))
const LPOListPage = lazy(() => import('@/modules/procurement/pages/procurement/LPOListPage'))
const OrderTrackingPage = lazy(() => import('@/modules/procurement/pages/procurement/OrderTrackingPage'))
const CreditNoteAuditPage = lazy(() => import('@/modules/procurement/pages/procurement/CreditNoteAuditPage'))
const PenaltyPage = lazy(() => import('@/modules/procurement/pages/procurement/PenaltyPage'))
const PenaltyDetailPage = lazy(() => import('@/modules/procurement/pages/procurement/PenaltyDetailPage'))
const SupplierPerformancePage = lazy(() => import('@/modules/procurement/pages/procurement/SupplierPerformancePage'))
const PaymentPage = lazy(() => import('@/modules/procurement/pages/procurement/PaymentPage'))
const TransferRequestListPage = lazy(() => import('@/modules/distribution/pages/distribution/TransferRequestListPage'))
const IndentRequestListPage = lazy(() => import('@/modules/distribution/pages/distribution/IndentRequestListPage'))
const IndentRequestFormPage = lazy(() => import('@/modules/distribution/pages/distribution/IndentRequestFormPage'))
const IndentRequestDetailPage = lazy(() => import('@/modules/distribution/pages/distribution/IndentRequestDetailPage'))
const IssueCounterPage = lazy(() => import('@/modules/distribution/pages/distribution/IssueCounterPage'))
const IndentEntitlementPage = lazy(() => import('@/modules/distribution/pages/distribution/IndentEntitlementPage'))
const BudgetOverviewPage = lazy(() => import('@/modules/financial/pages/financial/BudgetOverviewPage'))
const WarrantPage = lazy(() => import('@/modules/financial/pages/financial/WarrantPage'))
const APPLAllocationPage = lazy(() => import('@/modules/financial/pages/financial/APPLAllocationPage'))
const CCAllocationPage = lazy(() => import('@/modules/financial/pages/financial/CCAllocationPage'))
const LPAllocationPage = lazy(() => import('@/modules/financial/pages/financial/LPAllocationPage'))
const HospitalBudgetForecastPage = lazy(() => import('@/modules/financial/pages/financial/HospitalBudgetForecastPage'))
const ReportsPage = lazy(() => import('@/modules/reports/pages/reports/ReportsPage'))
const ProcurementReportPage = lazy(() => import('@/modules/reports/pages/reports/ProcurementReportPage'))
const FinancialReportPage = lazy(() => import('@/modules/reports/pages/reports/FinancialReportPage'))
const StockLocationPage = lazy(() => import('@/modules/maintenance/pages/maintenance/StockLocationPage'))
const StockVerificationPage = lazy(() => import('@/modules/maintenance/pages/maintenance/StockVerificationPage'))
const UnitCatalogPage = lazy(() => import('@/modules/maintenance/pages/maintenance/UnitCatalogPage'))
const DrugCatalogPage = lazy(() => import('@/modules/catalog/pages/catalog/DrugCatalogPage'))
const NonDrugCatalogPage = lazy(() => import('@/modules/catalog/pages/catalog/NonDrugCatalogPage'))
const SupplierCatalogPage = lazy(() => import('@/modules/catalog/pages/catalog/SupplierCatalogPage'))
const ContractCatalogPage = lazy(() => import('@/modules/catalog/pages/catalog/ContractCatalogPage'))
const FacilityCatalogPage = lazy(() => import('@/modules/catalog/pages/catalog/FacilityCatalogPage'))
const MyWarrantDashboard = lazy(() => import('@/modules/mywarrant/pages/mywarrant/MyWarrantDashboard'))

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
        path: 'crossborder',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CrossBorderSubMenu />
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
        path: 'hub/myphis',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyPhisDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'hub/mymsds',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyMsdsDashboardPage />
          </Suspense>
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
        path: 'suhu',
        children: [
          {
            index: true,
            element: <Navigate to="/suhu/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SuhuDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'department/:departmentId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DepartmentSuhuPage />
              </Suspense>
            ),
          },
          {
            path: 'unit/:unitId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <UnitDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'breaches',
            element: (
              <Suspense fallback={<PageLoader />}>
                <BreachLogPage />
              </Suspense>
            ),
          },
          {
            path: 'admin',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminSetupPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'kunci',
        children: [
          {
            index: true,
            element: <Navigate to="/kunci/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KunciDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'daftar',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KunciRegistryPage />
              </Suspense>
            ),
          },
          {
            path: 'log',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KunciLogPage />
              </Suspense>
            ),
          },
          {
            path: 'audit',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KunciAuditPage />
              </Suspense>
            ),
          },
          {
            path: 'polisi',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KunciPolicyPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'crossborder',
        children: [
          {
            path: '*',
            element: <Navigate to="/transporter/dashboard" replace />,
          },
        ],
      },
      {
        path: 'transporter',
        children: [

          {
            index: true,
            element: <Navigate to="/transporter/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'requests/new',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterRequestFormPage />
              </Suspense>
            ),
          },
          {
            path: 'requests/edit/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterRequestFormPage />
              </Suspense>
            ),
          },
          {
            path: 'requests/my',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterMyRequestsPage />
              </Suspense>
            ),
          },
          {
            path: 'availability',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterAvailabilityPage />
              </Suspense>
            ),
          },
          {
            path: 'driver/panel',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterDriverPanelPage />
              </Suspense>
            ),
          },
          {
            path: 'driver/monitor',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterDriverMonitorPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/approval',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterAdminApprovalPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/vehicles',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterVehicleRegistryPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/vehicles/movement',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterVehicleMovementPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/vehicles/issues',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterVehicleIssuesPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/reports',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterReportsPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/roles',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransporterRoleAssignmentPage />
              </Suspense>
            ),
          },
        ],
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
      {
        path: 'pharmacy/oxygen/reports',
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
              <CylinderReportPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/oxygen/maintenance',
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
              <CylinderMaintenancePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Inventory sub-pages
      {
        path: 'pharmacy/inventory/appl',
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
              <APPLInventoryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
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
        path: 'pharmacy/inventory/facility-drugs',
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
              <FacilityDrugInventoryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/facility-non-drugs',
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
              <FacilityNonDrugInventoryPage />
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
      {
        path: 'pharmacy/inventory/report',
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
              <InventoryReportPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/movement',
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
              <StockMovementScannerPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/ledger',
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
              <KewPs4LedgerPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PHARMACY_STORE_LOCATIONS,
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
              <StoreLocationManagementPage />
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
      {
        path: 'pharmacy/inventory/distribution/indent',
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
              <IndentRequestListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/distribution/indent/new',
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
              <IndentRequestFormPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/distribution/indent/:id',
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
              <IndentRequestDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/distribution/issue',
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
              <IssueCounterPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/inventory/distribution/entitlement',
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
              <IndentEntitlementPage />
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
      {
        path: ROUTES.PHARMACY_LP_ALLOCATION,
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
              <LPAllocationPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pharmacy/financial/forecast',
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
              <HospitalBudgetForecastPage />
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
        element: <Navigate to="/pharmacy/drugs" replace />,
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
        element: <Navigate to="/pharmacy/drugs" replace />,
      },
      {
        path: 'pharmacy/catalog/non-drugs',
        element: <Navigate to="/pharmacy/non-drugs" replace />,
      },
      {
        path: 'pharmacy/catalog/facilities',
        element: <Navigate to="/pharmacy/facility-drugs" replace />,
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

