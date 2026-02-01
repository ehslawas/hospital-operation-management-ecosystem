import React, { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { LoadingOverlay } from '@/components/ui'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES, SYSTEM_ROLES } from '@/lib/constants'


// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/pages/legal/TermsOfServicePage'))
const ModulePlaceholderPage = lazy(() => import('@/pages/ModulePlaceholderPage'))

// Admin pages
const UserListPage = lazy(() => import('@/pages/admin/users/UserListPage'))
const UserDetailPage = lazy(() => import('@/pages/admin/users/UserDetailPage'))
const AccessRequestListPage = lazy(() => import('@/pages/admin/accessRequests/AccessRequestListPage'))
const AccessRequestDetailPage = lazy(() => import('@/pages/admin/accessRequests/AccessRequestDetailPage'))
const HospitalListPage = lazy(() => import('@/pages/admin/hospitals/HospitalListPage'))
const HospitalDetailPage = lazy(() => import('@/pages/admin/hospitals/HospitalDetailPage'))
const ClinicListPage = lazy(() => import('@/pages/admin/clinics/ClinicListPage'))
const ClinicDetailPage = lazy(() => import('@/pages/admin/clinics/ClinicDetailPage'))
const DepartmentListPage = lazy(() => import('@/pages/admin/departments/DepartmentsPage'))
const DepartmentDetailPage = lazy(() => import('@/pages/admin/departments/DepartmentDetailPage'))
const RoleListPage = lazy(() => import('@/pages/admin/roles/RoleListPage'))
const RolePermissionPage = lazy(() => import('@/pages/admin/roles/RolePermissionPage'))
const RoleFeaturePermissionPage = lazy(() => import('@/pages/admin/roles/RoleFeaturePermissionPage'))
const AuditLogPage = lazy(() => import('@/pages/admin/auditLogs/AuditLogPage'))
const SystemSettingsPage = lazy(() => import('@/pages/admin/settings/SystemSettingsPage'))
const MenuAccessControlPage = lazy(() => import('@/pages/admin/modules/MenuAccessControlPage'))
const SystemMonitoringPage = lazy(() => import('@/pages/admin/monitoring/SystemMonitoringPage'))
const BackupManagementPage = lazy(() => import('@/pages/admin/backups/BackupManagementPage'))
const AlertCenterPage = lazy(() => import('@/pages/admin/alerts/AlertCenterPage'))
const SystemLogsPage = lazy(() => import('@/pages/admin/systemLogs/SystemLogsPage'))

// System Admin Isolated Pages
const SystemAdminDashboard = lazy(() => import('@/pages/system-admin/SystemAdminDashboard'))
const TenantManagementPage = lazy(() => import('@/pages/system-admin/TenantManagementPage'))
const AnalyticsOverviewPage = lazy(() => import('@/pages/system-admin/AnalyticsOverviewPage'))
const GlobalAuditTrailPage = lazy(() => import('@/pages/system-admin/GlobalAuditTrailPage'))
const HealthMonitoringPage = lazy(() => import('@/pages/system-admin/HealthMonitoringPage'))
const HospitalDetailsPage = lazy(() => import('@/pages/system-admin/HospitalDetailsPage'))

// New RBAC management pages
const ModuleManagementPage = lazy(() => import('@/pages/admin/modules/ModuleManagementPage'))
const FeatureManagementPage = lazy(() => import('@/pages/admin/features/FeatureManagementPage'))
const PermissionManagementPage = lazy(() => import('@/pages/admin/permissions/PermissionManagementPage'))
const WorkflowManagementPage = lazy(() => import('@/pages/admin/workflows/WorkflowManagementPage'))
const ApprovalDashboardPage = lazy(() => import('@/pages/approvals/ApprovalDashboardPage'))

// Profile page
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))

// Hospital Admin pages
const MemoListPage = lazy(() => import('@/pages/admin/memos/MemoListPage'))
const SensitiveDataRequestListPage = lazy(() => import('@/pages/admin/sensitiveData/SensitiveDataRequestListPage'))
const SensitiveDataRequestDetailPage = lazy(() => import('@/pages/admin/sensitiveData/SensitiveDataRequestDetailPage'))
const RunningNumberPage = lazy(() => import('@/pages/admin/RunningNumberPage').then(module => ({ default: module.RunningNumberPage })))

// Admin Operations (Exclusive)
const AdminOperationsDashboard = lazy(() => import('@/pages/admin/operations/AdminOperationsDashboard'))
const AdminPurchaseOrderListPage = lazy(() => import('@/pages/admin/operations/procurement/AdminPurchaseOrderListPage'))
const AdminPurchaseOrderCreatePage = lazy(() => import('@/pages/admin/operations/procurement/AdminPurchaseOrderCreatePage'))
const AdminPurchaseOrderDetailPage = lazy(() => import('@/pages/admin/operations/procurement/AdminPurchaseOrderDetailPage'))
const AdminLPOManagementPage = lazy(() => import('@/pages/admin/operations/procurement/AdminLPOManagementPage'))
const AdminReceivingPage = lazy(() => import('@/pages/admin/operations/procurement/AdminReceivingPage'))
const AdminPaymentPage = lazy(() => import('@/pages/admin/operations/procurement/AdminPaymentPage'))
const AdminWarrantPage = lazy(() => import('@/pages/admin/operations/financial/AdminWarrantPage'))
const AdminWarrantFormPage = lazy(() => import('@/pages/admin/operations/financial/AdminWarrantFormPage'))
const AdminPembangunanPage = lazy(() => import('@/pages/admin/operations/financial/AdminPembangunanPage'))
const AdminPembangunanFormPage = lazy(() => import('@/pages/admin/operations/financial/AdminPembangunanFormPage'))

// Pharmacy Logistics pages
const PharmacyLogisticsDashboard = lazy(() => import('@/pages/pharmacy/dashboard/PharmacyLogisticsDashboard'))
const EmergencyDashboard = lazy(() => import('@/features/emergency/routes/EmergencyDashboard'))
const InventoryOverviewPage = lazy(() => import('@/pages/pharmacy/inventory/InventoryOverviewPage'))
const DrugInventoryPage = lazy(() => import('@/pages/pharmacy/inventory/DrugInventoryPage'))
const BufferDrugInventoryPage = lazy(() => import('@/pages/pharmacy/inventory/BufferDrugInventoryPage'))
const BufferNonDrugInventoryPage = lazy(() => import('@/pages/pharmacy/inventory/BufferNonDrugInventoryPage'))
const NonDrugInventoryPage = lazy(() => import('@/pages/pharmacy/inventory/NonDrugInventoryPage'))
const NearExpiryPage = lazy(() => import('@/pages/pharmacy/inventory/NearExpiryPage'))
const SlowMovingPage = lazy(() => import('@/pages/pharmacy/inventory/SlowMovingPage'))
const ItemMovementPage = lazy(() => import('@/pages/pharmacy/inventory/ItemMovementPage'))
const PhysicalReceivingPage = lazy(() => import('@/pages/pharmacy/inventory/PhysicalReceivingPage'))
const PhysicalIssuingPage = lazy(() => import('@/pages/pharmacy/inventory/PhysicalIssuingPage'))
const OxygenDashboardPage = lazy(() => import('@/pages/pharmacy/oxygen/OxygenDashboardPage'))
const CylinderInventoryPage = lazy(() => import('@/pages/pharmacy/oxygen/InventoryDashboard'))
const CylinderRequestPage = lazy(() => import('@/pages/pharmacy/oxygen/CylinderRequestPage'))
const OxygenQRGeneratorPage = lazy(() => import('@/pages/pharmacy/oxygen/QRGeneratorPage'))
const PurchaseOrderListPage = lazy(() => import('@/pages/pharmacy/procurement/PurchaseOrderListPage'))
const PurchaseOrderCreatePage = lazy(() => import('@/pages/pharmacy/procurement/PurchaseOrderCreatePage'))
const InvSqCreatePage = lazy(() => import('@/pages/pharmacy/procurement/InvSqCreatePage'))
const ManualPoCreatePage = lazy(() => import('@/pages/pharmacy/procurement/ManualPoCreatePage'))
const PurchaseOrderDetailPage = lazy(() => import('@/pages/pharmacy/procurement/PurchaseOrderDetailPage'))
const LPOManagementPage = lazy(() => import('@/pages/pharmacy/procurement/LPOManagementPage'))
const IssueToDepartment = lazy(() => import('@/pages/pharmacy/oxygen/IssueToDepartment'))
const ReturnFromDepartment = lazy(() => import('@/pages/pharmacy/oxygen/ReturnFromDepartment'))
const SupplierReturn = lazy(() => import('@/pages/pharmacy/oxygen/SupplierReturn'))
const StockReconciliation = lazy(() => import('@/pages/pharmacy/oxygen/StockReconciliation'))
const OrderTrackingPage = lazy(() => import('@/pages/pharmacy/procurement/OrderTrackingPage'))
const ReceivingPage = lazy(() => import('@/pages/pharmacy/procurement/ReceivingPage'))
const ReceivedItemsHistoryPage = lazy(() => import('@/pages/pharmacy/procurement/ReceivedItemsHistoryPage'))
const PaymentPage = lazy(() => import('@/pages/pharmacy/procurement/PaymentPage'))
const PenaltiesPage = lazy(() => import('@/pages/pharmacy/procurement/PenaltiesPage'))
const LOUManagementPage = lazy(() => import('@/pages/pharmacy/procurement/LOUManagementPage'))
const TransferRequestListPage = lazy(() => import('@/pages/pharmacy/distribution/TransferRequestListPage'))
const BudgetOverviewPage = lazy(() => import('@/pages/pharmacy/financial/BudgetOverviewPage'))
const WarrantPage = lazy(() => import('@/pages/pharmacy/financial/WarrantPage'))
const APPLAllocationPage = lazy(() => import('@/pages/pharmacy/financial/APPLAllocationPage'))
const CCAllocationPage = lazy(() => import('@/pages/pharmacy/financial/CCAllocationPage'))
const ReportsPage = lazy(() => import('@/pages/pharmacy/reports/ReportsPage'))
const IntrafacilityRequestPage = lazy(() => import('@/pages/pharmacy/distribution/IntrafacilityRequestPage'))
const PharmacyIssuePage = lazy(() => import('@/pages/pharmacy/distribution/PharmacyIssuePage'))
const IntrafacilityDetailPage = lazy(() => import('./../pages/pharmacy/distribution/IntrafacilityDetailPage'))

const StockLocationPage = lazy(() => import('@/pages/pharmacy/maintenance/StockLocationPage'))
const StockLocationItemsPage = lazy(() => import('@/pages/pharmacy/maintenance/StockLocationItemsPage'))
const StockVerificationPage = lazy(() => import('@/pages/pharmacy/maintenance/StockVerificationPage'))
const UnitCatalogPage = lazy(() => import('@/pages/pharmacy/maintenance/UnitCatalogPage'))
const ManageUnitCatalogItemsPage = lazy(() => import('@/pages/pharmacy/maintenance/ManageUnitCatalogItemsPage'))
const DrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/DrugCatalogPage'))
const NonDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/NonDrugCatalogPage'))
const SupplierCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/SupplierCatalogPage'))
const ContractCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ContractCatalogPage'))
const ContractNonDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ContractNonDrugCatalogPage'))
const ReagentsCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ReagentsCatalogPage'))
const HospitalFacilityCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/HospitalFacilityCatalogPage'))
const TemperatureMonitoringPage = lazy(() => import('@/pages/pharmacy/temperature/TemperatureMonitoringPage'))
const ClinicFacilityCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ClinicFacilityCatalogPage'))
const ApplDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ApplDrugCatalogPage'))
const ApplNonDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/ApplNonDrugCatalogPage'))
const LpDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/LpDrugCatalogPage'))
const LpNonDrugCatalogPage = lazy(() => import('@/pages/pharmacy/catalog/LpNonDrugCatalogPage'))
const ItemQRGeneratorPage = lazy(() => import('@/pages/pharmacy/item-tracking/ItemQRGeneratorPage'))
const ItemListPage = lazy(() => import('@/pages/pharmacy/item-tracking/ItemListPage'))
const ItemDetailPage = lazy(() => import('@/pages/pharmacy/item-tracking/ItemDetailPage'))
const ManualItemRegistrationPage = lazy(() => import('@/pages/pharmacy/item-tracking/ManualItemRegistrationPage'))

const FacilityBorrowPage = lazy(() => import('@/pages/pharmacy/distribution/FacilityBorrowPage'))
const FacilityLendPage = lazy(() => import('@/pages/pharmacy/distribution/FacilityLendPage'))
const LoanLedgerPage = lazy(() => import('@/pages/pharmacy/distribution/LoanLedgerPage'))
const InterfacilityListPage = lazy(() => import('@/pages/pharmacy/distribution/InterfacilityListPage'))
const InterfacilityDetailPage = lazy(() => import('@/pages/pharmacy/distribution/InterfacilityDetailPage'))

// Fallback loading component
const PageLoader = () => <LoadingOverlay fullScreen message="Loading page..." />

// Create router with v7 future flags
const router = createBrowserRouter(
  [
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
          element: <Navigate to={ROUTES.DASHBOARD} replace />,
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
        // System Admin Isolated Routes
        {
          path: ROUTES.SYSTEM_DASHBOARD,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <SystemAdminDashboard />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SYSTEM_TENANTS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <TenantManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.SYSTEM_TENANTS}/:hospitalId`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <HospitalDetailsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SYSTEM_ANALYTICS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <AnalyticsOverviewPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SYSTEM_AUDIT_LOGS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <GlobalAuditTrailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SYSTEM_HEALTH,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <HealthMonitoringPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Admin routes
        {
          path: ROUTES.ADMIN_USERS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <UserListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_USERS}/:userId`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <UserDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_ACCESS_REQUESTS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <AccessRequestListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_ACCESS_REQUESTS}/:requestId`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
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
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <DepartmentListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_DEPARTMENTS}/:departmentId`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <DepartmentDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_ROLES,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <RoleListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_PERMISSIONS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <PermissionManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_ROLES}/:roleId`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <RolePermissionPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_ROLES}/features`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <RoleFeaturePermissionPage />
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
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <ModuleManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_FEATURES,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <FeatureManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_WORKFLOWS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <WorkflowManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.APPROVAL_DASHBOARD,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ApprovalDashboardPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/menu-access',
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <MenuAccessControlPage />
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
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <SystemLogsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_HOSPITAL_HEALTH,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <SystemMonitoringPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_HOSPITAL_BACKUPS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <BackupManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_RUNNING_NUMBERS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <RunningNumberPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_MEMOS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <MemoListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <SensitiveDataRequestListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}/:requestId`,
          element: (
            <ProtectedRoute allowedRoles={[SYSTEM_ROLES.HOSPITAL_ADMIN]}>
              <Suspense fallback={<PageLoader />}>
                <SensitiveDataRequestDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Admin Operations (Exclusive)
        {
          path: ROUTES.ADMIN_OPERATIONS,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminOperationsDashboard />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_DASHBOARD,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminOperationsDashboard />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PROCUREMENT,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPurchaseOrderListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PROCUREMENT_ORDERS,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPurchaseOrderListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PROCUREMENT_CREATE,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPurchaseOrderCreatePage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: `${ROUTES.ADMIN_OPERATIONS_PROCUREMENT}/orders/:id`,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPurchaseOrderDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PROCUREMENT_LPO,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminLPOManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PROCUREMENT_RECEIVING,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminReceivingPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PROCUREMENT_PAYMENT,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPaymentPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_FINANCIAL,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminWarrantPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_WARRANT,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminWarrantPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_WARRANT_CREATE,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminWarrantFormPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_WARRANT_EDIT,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminWarrantFormPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPembangunanPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN_CREATE,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPembangunanFormPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN_EDIT,
          element: (
            <ProtectedRoute allowedRoles={[
              SYSTEM_ROLES.HOSPITAL_ADMIN,
              SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
            ]}>
              <Suspense fallback={<PageLoader />}>
                <AdminPembangunanFormPage />
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
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PharmacyLogisticsDashboard />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <InventoryOverviewPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen',
          element: <Navigate to={ROUTES.PHARMACY_OXYGEN_DASHBOARD} replace />,
        },
        {
          path: 'pharmacy/oxygen/dashboard',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <OxygenDashboardPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen/inventory',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <CylinderInventoryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen/request',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <CylinderRequestPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen/tools/qr-gen',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <OxygenQRGeneratorPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen/issue',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <IssueToDepartment />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen/return',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReturnFromDepartment />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/oxygen/supplier',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <SupplierReturn />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/medical-oxygen/reconciliation',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StockReconciliation />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Redirects for legacy Oxygen paths (Migration support)
        { path: 'oxygen', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_DASHBOARD} replace /> },
        { path: 'oxygen/dashboard', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_DASHBOARD} replace /> },
        { path: 'oxygen/inventory', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_INVENTORY} replace /> },
        { path: 'oxygen/request', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_REQUEST} replace /> },
        { path: 'oxygen/issue', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_ISSUE} replace /> },
        { path: 'oxygen/return', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_RETURN} replace /> },
        { path: 'oxygen/supplier-return', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_SUPPLIER_RETURN} replace /> },
        { path: 'oxygen/qr-generator', element: <Navigate to={ROUTES.PHARMACY_OXYGEN_QR_GEN} replace /> },

        // Distribution Redirects (Gold Standard)
        { path: 'pharmacy/distribution', element: <Navigate to={ROUTES.PHARMACY_DISTRIBUTION_REQUESTS} replace /> },


        // Inventory sub-pages
        {
          path: 'pharmacy/inventory/drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <DrugInventoryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory/non-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <NonDrugInventoryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory/near-expiry',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <NearExpiryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory/slow-moving',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <SlowMovingPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Buffer Levels & Movement (Gold Standard Restore)
        {
          path: 'pharmacy/inventory/buffer-drug',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <BufferDrugInventoryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory/buffer-non-drug',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <BufferNonDrugInventoryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_ITEM_MOVEMENT,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ItemMovementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_PHYSICAL_RECEIVING,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PhysicalReceivingPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_PHYSICAL_ISSUING,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PhysicalIssuingPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory/defective',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/inventory/expiry',
          element: <Navigate to={ROUTES.PHARMACY_NEAR_EXPIRY} replace />,
        },
        {
          path: ROUTES.PHARMACY_ITEM_REGISTRY,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ItemListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_ITEM_DETAILS,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ItemDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_ITEM_REGISTRATION,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ManualItemRegistrationPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_ITEM_QR_GEN,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ItemQRGeneratorPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Procurement routes
        {
          path: 'pharmacy/procurement/orders',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },

        {
          path: 'pharmacy/procurement/orders/create',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderCreatePage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/sq/create',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <InvSqCreatePage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/manual/create',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ManualPoCreatePage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/orders/:id',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/lpo',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <LPOManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/receiving',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReceivingPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/received-items',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReceivedItemsHistoryPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/payments',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PaymentPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/penalties',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PenaltiesPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/lou',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <LOUManagementPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/procurement/tracking',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <OrderTrackingPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Distribution routes
        {
          path: ROUTES.PHARMACY_DISTRIBUTION_REQUESTS.substring(1),
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <TransferRequestListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_INTER_FACILITY_LIST,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <InterfacilityListPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_INTER_FACILITY_DETAIL,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <InterfacilityDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_DISTRIBUTION_BORROW,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <FacilityBorrowPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_DISTRIBUTION_LEND,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <FacilityLendPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_DISTRIBUTION_LOAN_LEDGER,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <LoanLedgerPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_INTRA_FACILITY_LIST,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <IntrafacilityRequestPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_INTRA_FACILITY_DETAIL,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <IntrafacilityDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },


        {
          path: 'pharmacy/distribution/intra-facility/issue',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PharmacyIssuePage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/distribution/intra-facility/:id',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <IntrafacilityDetailPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Financial routes
        {
          path: 'pharmacy/financial/budget',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <BudgetOverviewPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/financial/warrant',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <WarrantPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/financial/appl',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <APPLAllocationPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/financial/cc',
          element: (
            <ProtectedRoute>
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
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/reports/inventory',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/reports/procurement',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/reports/financial',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/reports/distribution',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Maintenance routes
        {
          path: 'pharmacy/maintenance/locations',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StockLocationPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_STOCK_LOCATION_ITEMS,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StockLocationItemsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/maintenance/verification',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StockVerificationPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/maintenance/units',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <UnitCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PHARMACY_UNIT_CATALOG_ITEMS,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ManageUnitCatalogItemsPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <DrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Catalog Folder Redirects (Fix for Blank Pages)
        { path: 'pharmacy/catalog', element: <Navigate to="/pharmacy/catalog/drugs" replace /> },
        { path: 'pharmacy/catalog/inventory-parent', element: <Navigate to="/pharmacy/catalog/drugs" replace /> },
        { path: 'pharmacy/catalog/contracts-parent', element: <Navigate to="/pharmacy/catalog/contract-drugs" replace /> },
        { path: 'pharmacy/catalog/appl', element: <Navigate to="/pharmacy/catalog/appl-drugs" replace /> },
        { path: 'pharmacy/catalog/lp', element: <Navigate to="/pharmacy/catalog/lp-drugs" replace /> },
        {
          path: 'pharmacy/catalog/suppliers',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <SupplierCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/contracts',
          element: <Navigate to="/pharmacy/catalog/contract-drugs" replace />,
        },
        {
          path: 'pharmacy/catalog/contract-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ContractCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/contract-non-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ContractNonDrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/non-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <NonDrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/temperature-monitoring',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <TemperatureMonitoringPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/appl-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ApplDrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/appl-non-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ApplNonDrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/lp-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <LpDrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/lp-non-drugs',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <LpNonDrugCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/reagents',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ReagentsCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/hospitals',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <HospitalFacilityCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/catalog/clinics',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ClinicFacilityCatalogPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pharmacy/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        // Generic Department Routes (to handle seeded menus)
        {
          path: 'emergency/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <EmergencyDashboard />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'radiology/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'pathology/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'operating-theatre/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'icu/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'inpatients/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'outpatients/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'dietetics/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'physiotherapy/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'occupational-therapy/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'medical-records/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'human-resources/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'engineering/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'transport/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'security/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'social-work/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'cssd/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'catering/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'housekeeping/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'mortuary/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'quality/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'infection-control/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'it-support/*',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholderPage />
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
  } as any
)

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter

