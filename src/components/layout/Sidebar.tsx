import React, { useMemo, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Shield,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Activity,
  Database,
  Megaphone,
  Lock,
  ScrollText,
  AlertTriangle,
  AirVent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { Avatar } from '@/components/ui'
import { APP_NAME, ROUTES, SYSTEM_ROLES } from '@/lib/constants'
import { logout } from '@/services/authService'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  children?: NavItem[]
}

// Helper to check if user has access to nav item
const hasAccess = (item: NavItem, userRole?: string): boolean => {
  // If no roles specified, everyone can access
  if (!item.roles || item.roles.length === 0) return true

  // If user has no role, deny access
  if (!userRole) return false

  // Check if user role matches
  return item.roles.includes(userRole)
}

// Filter navigation based on user role
const filterNavigation = (items: NavItem[], userRole?: string): NavItem[] => {
  return items
    .filter((item) => hasAccess(item, userRole))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((child) => hasAccess(child, userRole)),
        }
      }
      return item
    })
    .filter((item) => {
      // Remove parent items if they have no accessible children
      if (item.children && item.children.length === 0) return false
      return true
    })
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN],
  },
  {
    label: 'Administration',
    href: ROUTES.ADMIN,
    icon: Shield,
    roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN],
    children: [
      { label: 'Users', href: ROUTES.ADMIN_USERS, icon: Users, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Access Requests', href: ROUTES.ADMIN_ACCESS_REQUESTS, icon: FileText, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Memo Approval', href: ROUTES.ADMIN_MEMOS, icon: Megaphone, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Sensitive Data Requests', href: ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS, icon: Lock, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Hospitals', href: ROUTES.ADMIN_HOSPITALS, icon: Building2, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Clinics', href: ROUTES.ADMIN_CLINICS, icon: Building2, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Departments', href: ROUTES.ADMIN_DEPARTMENTS, icon: Building2, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Roles & Permissions', href: ROUTES.ADMIN_ROLES, icon: Shield, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
    ],
  },
  {
    label: 'Monitoring',
    href: '/admin/monitoring',
    icon: Activity,
    roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN],
    children: [
      { label: 'System Health', href: ROUTES.ADMIN_HOSPITAL_HEALTH, icon: Activity, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'System Logs', href: ROUTES.ADMIN_HOSPITAL_LOGS, icon: ScrollText, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'Backup Status', href: ROUTES.ADMIN_HOSPITAL_BACKUPS, icon: Database, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN] },
      { label: 'System Health', href: ROUTES.ADMIN_MONITORING, icon: Activity, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'System Logs', href: ROUTES.ADMIN_SYSTEM_LOGS, icon: ScrollText, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Backups', href: ROUTES.ADMIN_BACKUPS, icon: Database, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Alerts', href: ROUTES.ADMIN_ALERTS, icon: ClipboardList, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Audit Logs', href: ROUTES.ADMIN_AUDIT_LOGS, icon: ClipboardList },
    ],
  },
  {
    label: 'Pharmacy Logistics',
    href: ROUTES.PHARMACY,
    icon: Package,
    roles: [
      SYSTEM_ROLES.PHARMACY_DIRECTOR,
      SYSTEM_ROLES.PHARMACY_MANAGER,
      SYSTEM_ROLES.PHARMACIST,
      SYSTEM_ROLES.PHARMACY_ASSISTANT,
      SYSTEM_ROLES.PHARMACY_STOREKEEPER,
      SYSTEM_ROLES.PHARMACY_STAFF,
    ],
    children: [
      { label: 'Dashboard', href: ROUTES.PHARMACY_DASHBOARD, icon: BarChart3 },
      {
        label: 'Financial',
        href: ROUTES.PHARMACY_FINANCIAL,
        icon: BarChart3,
        children: [
          { label: 'Warrant', href: ROUTES.PHARMACY_WARRANT, icon: FileText },
          { label: 'APPL Allocation', href: ROUTES.PHARMACY_APPL_ALLOCATION, icon: FileText },
          { label: 'CC Allocation', href: ROUTES.PHARMACY_CC_ALLOCATION, icon: FileText },
          { label: 'LP Allocation', href: ROUTES.PHARMACY_LP_ALLOCATION, icon: FileText },
        ],
      },
      {
        label: 'Procurement',
        href: ROUTES.PHARMACY_PROCUREMENT,
        icon: ShoppingCart,
        children: [
          { label: 'Purchase Orders', href: ROUTES.PHARMACY_PO, icon: ShoppingCart },
          { label: 'Receiving', href: ROUTES.PHARMACY_RECEIVING, icon: FileText },
          { label: 'LPO', href: ROUTES.PHARMACY_LPO, icon: FileText },
          { label: 'Delivery Tracking', href: ROUTES.PHARMACY_DELIVERY, icon: Truck },
          { label: 'Payments', href: ROUTES.PHARMACY_PAYMENT, icon: FileText },
          { label: 'Order Tracking', href: ROUTES.PHARMACY_ORDER_TRACKING, icon: ClipboardList },
          { label: 'Penalties', href: ROUTES.PHARMACY_PENALTY, icon: AlertTriangle },
          { label: 'Letters of Undertaking', href: ROUTES.PHARMACY_LOU, icon: FileText },
        ],
      },
      {
        label: 'Inventory',
        href: ROUTES.PHARMACY_INVENTORY,
        icon: Package,
        children: [
          { label: 'Drug (Buffer Levels)', href: ROUTES.PHARMACY_DRUGS, icon: Package },
          { label: 'Non-Drug (Buffer Levels)', href: ROUTES.PHARMACY_NON_DRUGS, icon: Package },
          { label: 'Item Movement', href: ROUTES.PHARMACY_ITEM_MOVEMENT, icon: ClipboardList },
          { label: 'Slow Moving Items', href: ROUTES.PHARMACY_SLOW_MOVING, icon: BarChart3 },
          { label: 'Near Expiry Items', href: ROUTES.PHARMACY_NEAR_EXPIRY, icon: AlertTriangle },
          { label: 'Bad / Defective Stock', href: ROUTES.PHARMACY_BAD_STOCK, icon: FileText },
        ],
      },
      {
        label: 'Distribution',
        href: ROUTES.PHARMACY_DISTRIBUTION,
        icon: Truck,
        children: [
          { label: 'Transfer Requests', href: ROUTES.PHARMACY_TRANSFER_REQUEST, icon: ClipboardList },
          { label: 'Inter-Facility', href: ROUTES.PHARMACY_INTER_FACILITY, icon: Truck },
          { label: 'Intra-Facility', href: ROUTES.PHARMACY_INTRA_FACILITY, icon: Truck },
        ],
      },
      {
        label: 'Medical Oxygen',
        href: ROUTES.PHARMACY_OXYGEN,
        icon: Activity,
        children: [
          { label: 'Oxygen Dashboard', href: ROUTES.PHARMACY_OXYGEN, icon: Activity },
          { label: 'Cylinder Inventory', href: ROUTES.PHARMACY_OXYGEN_CYLINDERS, icon: AirVent },
          { label: 'Consumption', href: ROUTES.PHARMACY_OXYGEN_CONSUMPTION, icon: BarChart3 },
        ],
      },
      {
        label: 'Catalogs',
        href: ROUTES.PHARMACY_CATALOG,
        icon: ClipboardList,
        children: [
          { label: 'Drug Catalog', href: ROUTES.PHARMACY_DRUG_CATALOG, icon: Package },
          { label: 'Non-Drug Catalog', href: ROUTES.PHARMACY_NON_DRUG_CATALOG, icon: Package },
          { label: 'Supplier Catalog', href: ROUTES.PHARMACY_SUPPLIER_CATALOG, icon: Truck },
          { label: 'Contract Catalog', href: ROUTES.PHARMACY_CONTRACT_CATALOG, icon: FileText },
          { label: 'Hospital Facilities', href: ROUTES.PHARMACY_HOSPITAL_FACILITY, icon: Building2 },
          { label: 'Clinic Facilities', href: ROUTES.PHARMACY_CLINIC_FACILITY, icon: Building2 },
        ],
      },
      {
        label: 'Maintenance',
        href: ROUTES.PHARMACY_MAINTENANCE,
        icon: Settings,
        children: [
          { label: 'Unit Catalog', href: ROUTES.PHARMACY_UNIT_CATALOG, icon: ClipboardList },
          { label: 'Stock Locations', href: ROUTES.PHARMACY_STOCK_LOCATION, icon: Package },
          { label: 'Stock Verification', href: ROUTES.PHARMACY_STOCK_VERIFICATION, icon: ClipboardList },
        ],
      },
      {
        label: 'Reports & Logs',
        href: ROUTES.PHARMACY_REPORTS,
        icon: BarChart3,
        children: [
          { label: 'Inventory Reports', href: ROUTES.PHARMACY_REPORTS_INVENTORY, icon: BarChart3 },
          { label: 'Procurement Reports', href: ROUTES.PHARMACY_REPORTS_PROCUREMENT, icon: BarChart3 },
          { label: 'Financial Reports', href: ROUTES.PHARMACY_REPORTS_FINANCIAL, icon: BarChart3 },
          { label: 'Distribution Reports', href: ROUTES.PHARMACY_REPORTS_DISTRIBUTION, icon: BarChart3 },
          { label: 'Logs', href: ROUTES.PHARMACY_LOGS, icon: ClipboardList },
        ],
      },
    ],
  },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, logout: storeLogout } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar()

  const userRole = user?.role?.role_code

  // Memoize filtered navigation to prevent unnecessary recalculations
  const filteredNavigation = useMemo(() => {
    return filterNavigation(navigation, userRole)
  }, [userRole])

  const handleLogout = async () => {
    await logout()
    storeLogout()
  }

  // Memoize current pathname to prevent unnecessary recalculations
  const currentPath = useMemo(() => location.pathname, [location.pathname])

  // State to track expanded menu items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Helper function to check if any child or nested child is active
  const hasActiveChild = React.useCallback((item: NavItem): boolean => {
    if (!item.children) return false
    return item.children.some((child) => {
      const childIsActive = currentPath === child.href || currentPath.startsWith(child.href + '/')
      return childIsActive || hasActiveChild(child)
    })
  }, [currentPath])

  // Auto-expand items with active children on mount and path change
  useEffect(() => {
    const newExpanded = new Set<string>()

    const checkAndExpand = (items: NavItem[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          // Always expand Pharmacy Logistics (top level)
          if (item.href === ROUTES.PHARMACY) {
            newExpanded.add(item.href)
          } else if (hasActiveChild(item)) {
            newExpanded.add(item.href)
          }
          checkAndExpand(item.children)
        }
      })
    }

    checkAndExpand(filteredNavigation)
    setExpandedItems(newExpanded)
  }, [currentPath, filteredNavigation, hasActiveChild])

  const toggleExpanded = React.useCallback((href: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(href)) {
        newSet.delete(href)
      } else {
        newSet.add(href)
      }
      return newSet
    })
  }, [])

  const isExpanded = React.useCallback((href: string) => expandedItems.has(href), [expandedItems])

  const isActiveLink = (href: string) => {
    return currentPath === href || currentPath.startsWith(href + '/')
  }

  const renderNavItem = React.useCallback((item: NavItem, depth = 0) => {
    const Icon = item.icon
    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
    const hasChildren = item.children && item.children.length > 0
    const expanded = hasChildren && isExpanded(item.href)
    const hasActive = hasActiveChild(item)

    // Pharmacy Logistics should always be expanded (not collapsible)
    const isPharmacyLogistics = item.href === ROUTES.PHARMACY && depth === 0
    const alwaysExpanded = isPharmacyLogistics

    if (hasChildren) {
      return (
        <div key={item.href}>
          {alwaysExpanded ? (
            // Always expanded - render as a label without button
            <div
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                isActive || hasActive
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-600',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
            </div>
          ) : (
            // Collapsible - render as button
            <button
              onClick={() => toggleExpanded(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive || hasActive
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </motion.div>
                </>
              )}
            </button>
          )}

          {!sidebarCollapsed && (
            <AnimatePresence initial={false}>
              {(alwaysExpanded || expanded) && (
                <motion.div
                  initial={alwaysExpanded ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={alwaysExpanded ? false : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                    {item.children?.map((child) => renderNavItem(child, depth + 1))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )
    }

    return (
      <NavLink
        key={item.href}
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            isActive
              ? 'text-primary-700 bg-primary-100'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            sidebarCollapsed && 'justify-center'
          )
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    )
  }, [currentPath, sidebarCollapsed, expandedItems, hasActiveChild, toggleExpanded, isExpanded])

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 bg-white border-r border-gray-200 no-print',
        'flex flex-col z-30'
      )}
      style={{ top: '112px', height: 'calc(100vh - 112px)' }}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-6 px-4 pb-4 space-y-1">
        {!sidebarCollapsed && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Navigation Panel
          </p>
        )}
        {filteredNavigation.map((item) => renderNavItem(item))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-gray-50',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Avatar
            src={user?.profile_photo_url}
            name={user?.full_name}
            size="sm"
          />

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.role_name}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar

