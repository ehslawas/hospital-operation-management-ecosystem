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
  PieChart,
  Thermometer,
  Key,
  Car,
  Calendar,
  Wrench,
  Globe,
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
  module?: 'admin' | 'pharmacy' | 'oxygen' | 'suhu' | 'myphis' | 'kunci' | 'transporter' | 'crossborder'
}

// Helper to check if user has access to nav item
const hasAccess = (item: NavItem, userRole?: string): boolean => {
  // Temporary bypass per user request: allow all authenticated users to see all menu items
  return true;

  /* Original implementation:
  // If no roles specified, everyone can access
  if (!item.roles || item.roles.length === 0) return true
  
  // If user has no role, deny access
  if (!userRole) return false
  
  // Check if user role matches
  return item.roles.includes(userRole)
  */
}

const getActiveModule = (pathname: string, userRole?: string, locationState?: any): 'admin' | 'pharmacy' | 'oxygen' | 'suhu' | 'myphis' | 'kunci' | 'transporter' | 'crossborder' => {
  if (pathname.startsWith('/crossborder')) return 'crossborder'
  if (pathname.startsWith('/transporter')) return 'transporter'
  if (pathname.startsWith('/kunci')) return 'kunci'
  if (pathname.startsWith('/hub/myphis') || pathname.includes('/myphis')) return 'myphis'
  if (pathname.startsWith('/suhu')) return 'suhu'
  if (pathname.startsWith('/pharmacy/oxygen')) return 'oxygen'
  if (pathname.startsWith('/pharmacy')) return 'pharmacy'
  if (pathname.startsWith('/admin')) return 'admin'

  // Check navigation state fallback (useful on shared pages like Profile)
  if (locationState && typeof locationState === 'object' && locationState.fromModule) {
    const fromModuleCode = locationState.fromModule.code
    if (fromModuleCode === 'suhu') return 'suhu'
    if (fromModuleCode === 'oxygen' || fromModuleCode === 'cylinder') return 'oxygen'
    if (fromModuleCode === 'pharmacy_logistics' || fromModuleCode === 'pharmacy') return 'pharmacy'
    if (fromModuleCode === 'system_admin' || fromModuleCode === 'hospital_admin' || fromModuleCode === 'admin') return 'admin'
    if (fromModuleCode === 'myphis') return 'myphis'
    if (fromModuleCode === 'system_kunci' || fromModuleCode === 'kunci') return 'kunci'
    if (fromModuleCode === 'transporter') return 'transporter'
    if (fromModuleCode === 'crossborder') return 'crossborder'
  }
  
  // Fallback based on user role
  if (userRole && [
    SYSTEM_ROLES.SYSTEM_ADMIN,
    SYSTEM_ROLES.HOSPITAL_ADMIN,
    SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR
  ].includes(userRole as any)) {
    return 'admin'
  }
  
  return 'pharmacy'
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

const PHARMACY_ROLES = [
  SYSTEM_ROLES.PHARMACY_DIRECTOR,
  SYSTEM_ROLES.PHARMACY_MANAGER,
  SYSTEM_ROLES.PHARMACIST,
  SYSTEM_ROLES.PHARMACY_ASSISTANT,
  SYSTEM_ROLES.ASSISTANT_PHARMACIST,
  SYSTEM_ROLES.PHARMACY_STOREKEEPER,
  SYSTEM_ROLES.PHARMACY_STAFF,
]

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR],
    module: 'admin',
  },
  {
    label: 'Administration',
    href: ROUTES.ADMIN,
    icon: Shield,
    roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR],
    module: 'admin',
    children: [
      { label: 'Users', href: ROUTES.ADMIN_USERS, icon: Users, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Access Requests', href: ROUTES.ADMIN_ACCESS_REQUESTS, icon: FileText, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Memo Approval', href: ROUTES.ADMIN_MEMOS, icon: Megaphone, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Sensitive Data Requests', href: ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS, icon: Lock, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Hospitals', href: ROUTES.ADMIN_HOSPITALS, icon: Building2, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Clinics', href: ROUTES.ADMIN_CLINICS, icon: Building2, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Departments', href: ROUTES.ADMIN_DEPARTMENTS, icon: Building2, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Roles & Permissions', href: ROUTES.ADMIN_ROLES, icon: Shield, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
    ],
  },
  {
    label: 'Monitoring',
    href: '/admin/monitoring',
    icon: Activity,
    roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR],
    module: 'admin',
    children: [
      { label: 'System Health', href: ROUTES.ADMIN_HOSPITAL_HEALTH, icon: Activity, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'System Logs', href: ROUTES.ADMIN_HOSPITAL_LOGS, icon: ScrollText, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'Backup Status', href: ROUTES.ADMIN_HOSPITAL_BACKUPS, icon: Database, roles: [SYSTEM_ROLES.HOSPITAL_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR] },
      { label: 'System Health', href: ROUTES.ADMIN_MONITORING, icon: Activity, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'System Logs', href: ROUTES.ADMIN_SYSTEM_LOGS, icon: ScrollText, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Backups', href: ROUTES.ADMIN_BACKUPS, icon: Database, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Alerts', href: ROUTES.ADMIN_ALERTS, icon: ClipboardList, roles: [SYSTEM_ROLES.SYSTEM_ADMIN] },
      { label: 'Audit Logs', href: ROUTES.ADMIN_AUDIT_LOGS, icon: ClipboardList },
    ],
  },
  {
    label: 'Dashboard',
    href: ROUTES.MYWARRANT_DASHBOARD,
    icon: LayoutDashboard,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
  },
  {
    label: 'Financial',
    href: ROUTES.PHARMACY_FINANCIAL,
    icon: BarChart3,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
    children: [
      { label: 'Warrant', href: ROUTES.PHARMACY_WARRANT, icon: FileText },
      { label: 'APPL Allocation', href: ROUTES.PHARMACY_APPL_ALLOCATION, icon: FileText },
      { label: 'CC Allocation', href: ROUTES.PHARMACY_CC_ALLOCATION, icon: FileText },
      { label: 'LP Allocation', href: ROUTES.PHARMACY_LP_ALLOCATION, icon: FileText },
      { label: 'Budget Forecasting', href: ROUTES.PHARMACY_FORECAST, icon: BarChart3 },
    ],
  },
  {
    label: 'Procurement',
    href: ROUTES.PHARMACY_PROCUREMENT,
    icon: ShoppingCart,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
    children: [
      { label: 'Purchase Orders', href: ROUTES.PHARMACY_PO, icon: ShoppingCart },
      { label: 'LPO', href: ROUTES.PHARMACY_LPO, icon: FileText },
      { label: 'Order Tracking', href: ROUTES.PHARMACY_ORDER_TRACKING, icon: ClipboardList },
      { label: 'Received Item', href: ROUTES.PHARMACY_RECEIVING, icon: FileText },
      { label: 'Payment', href: ROUTES.PHARMACY_PAYMENT, icon: FileText },
      { label: 'Credit Notes', href: ROUTES.PHARMACY_CREDIT_NOTE, icon: FileText },
      { label: 'Penalty', href: ROUTES.PHARMACY_PENALTY, icon: AlertTriangle },
      { label: 'LOU', href: ROUTES.PHARMACY_LOU, icon: FileText },
      { label: 'Supplier Performance', href: ROUTES.PHARMACY_SUPPLIER_PERFORMANCE, icon: BarChart3 },
    ],
  },
  {
    label: 'Medical Oxygen',
    href: ROUTES.PHARMACY_OXYGEN,
    icon: AirVent,
    roles: PHARMACY_ROLES,
    module: 'oxygen',
    children: [
      { label: 'Oxygen Dashboard', href: ROUTES.PHARMACY_OXYGEN, icon: Activity },
      { label: 'Cylinder Inventory', href: ROUTES.PHARMACY_OXYGEN_CYLINDERS, icon: Database },
      { label: 'Cylinder Request', href: ROUTES.PHARMACY_OXYGEN_CONSUMPTION, icon: ShoppingCart },
      { label: 'QR Generator', href: '/pharmacy/oxygen/qr', icon: ClipboardList },
      { label: 'Stock Reconciliation', href: '/pharmacy/oxygen/reconciliation', icon: FileText },
      { label: 'Cylinder Report', href: ROUTES.PHARMACY_OXYGEN_REPORTS, icon: BarChart3 },
      { label: 'Cylinder Maintenance', href: '/pharmacy/oxygen/maintenance', icon: Wrench },
    ],
  },
  {
    label: 'Catalog',
    href: ROUTES.PHARMACY_CATALOG,
    icon: ClipboardList,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
    children: [
      { label: 'Facility Catalog', href: ROUTES.PHARMACY_FACILITY_CATALOG, icon: Building2 },
      // { label: 'Drug Catalog', href: ROUTES.PHARMACY_DRUG_CATALOG, icon: Package },
      // { label: 'Non-Drug Catalog', href: ROUTES.PHARMACY_NON_DRUG_CATALOG, icon: Package },
      { label: 'Supplier Catalog', href: ROUTES.PHARMACY_SUPPLIER_CATALOG, icon: Truck },
      { label: 'Contract Catalog', href: ROUTES.PHARMACY_CONTRACT_CATALOG, icon: FileText },
      { label: 'Hospital Facilities', href: ROUTES.PHARMACY_HOSPITAL_FACILITY, icon: Building2 },
      { label: 'Clinic Facilities', href: ROUTES.PHARMACY_CLINIC_FACILITY, icon: Building2 },
    ],
  },
  {
    label: 'Reports',
    href: ROUTES.PHARMACY_REPORTS,
    icon: PieChart,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
    children: [
      { label: 'Procurement Reports', href: ROUTES.PHARMACY_REPORTS_PROCUREMENT, icon: FileText },
      { label: 'Financial Reports', href: ROUTES.PHARMACY_REPORTS_FINANCIAL, icon: FileText },
    ],
  },
  {
    label: 'System Logs',
    href: ROUTES.PHARMACY_LOGS,
    icon: ScrollText,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
  },
  {
    label: 'MySuhu',
    href: '/suhu/dashboard',
    icon: Thermometer,
    module: 'suhu',
    children: [
      { label: 'Dashboard', href: '/suhu/dashboard', icon: LayoutDashboard },
      { label: 'Breach Log', href: '/suhu/breaches', icon: AlertTriangle },
      { label: 'Admin Setup', href: '/suhu/admin', icon: Settings },
    ],
  },
  {
    label: 'MyPHiS',
    href: '/hub/myphis',
    icon: Database,
    module: 'myphis',
    children: [
      { label: 'Dashboard', href: '/hub/myphis', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MyKunci',
    href: '/kunci/dashboard',
    icon: Key,
    module: 'kunci',
    children: [
      { label: 'Dashboard', href: '/kunci/dashboard', icon: LayoutDashboard },
      { label: 'Daftar Kunci', href: '/kunci/daftar', icon: ClipboardList },
      { label: 'Log Pergerakan', href: '/kunci/log', icon: FileText },
      { label: 'Verifikasi Bulanan', href: '/kunci/audit', icon: Shield },
      { label: 'Polisi Kunci KKM', href: '/kunci/polisi', icon: ScrollText },
    ],
  },
  {
    label: 'MyTransporter',
    href: '/transporter/dashboard',
    icon: Car,
    module: 'transporter',
    children: [
      { label: 'Dashboard', href: '/transporter/dashboard', icon: LayoutDashboard },
      { label: 'Permohonan Baru', href: '/transporter/requests/new', icon: FileText },
      { label: 'Semak Slot SG', href: '/transporter/availability', icon: Calendar },
      { label: 'Permohonan Saya', href: '/transporter/requests/my', icon: ClipboardList },
      { label: 'Panel Pemandu', href: '/transporter/driver/panel', icon: Truck },
      { label: 'Kelulusan Pentadbir', href: '/transporter/admin/approval', icon: Shield },
      { label: 'Kenderaan Fleet', href: '/transporter/admin/vehicles', icon: Settings },
      { label: 'Aduan Pemandu', href: '/transporter/admin/vehicles/issues', icon: AlertTriangle },
      { label: 'Mileage & Claims', href: '/transporter/admin/vehicles/movement', icon: BarChart3 },
      { label: 'Penugasan Peranan', href: '/transporter/admin/roles', icon: Users },
    ],
  },
  {
    label: 'MyCrossBorder',
    href: '/crossborder/dashboard',
    icon: Globe,
    module: 'crossborder',
    children: [
      { label: 'Dashboard', href: '/crossborder/dashboard', icon: LayoutDashboard },
      { label: 'Permohonan Baru', href: '/crossborder/create', icon: FileText },
      { label: 'Log Pergerakan', href: '/crossborder/log', icon: ClipboardList },
    ],
  },
]


export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, logout: storeLogout } = useAuthStore()
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  const userRole = user?.role?.role_code

  const [transporterCounts, setTransporterCounts] = useState({
    myRequests: 0,
    driverPanel: 0,
    adminApproval: 0
  })

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const fetchTransporterCounts = async () => {
      try {
        const { getRequests } = await import('@/modules/mytransporter/services/transporterService')
        const res = await getRequests()
        if (res.data && isMounted) {
          const list = res.data
          const myRequestsCount = list.filter(r => r.pemohon_id === user.id && r.status_semasa === 'draft').length
          const driverPanelCount = list.filter(r => r.status_semasa === 'submitted' || r.status_semasa === 'driver_rejected').length
          const adminApprovalCount = list.filter(r => r.status_semasa === 'driver_accepted').length

          setTransporterCounts({
            myRequests: myRequestsCount,
            driverPanel: driverPanelCount,
            adminApproval: adminApprovalCount
          })
        }
      } catch (err) {
        console.error('Error fetching transporter counts in sidebar:', err)
      }
    }

    fetchTransporterCounts()

    const interval = setInterval(fetchTransporterCounts, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user, location.pathname])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Memoize filtered navigation to prevent unnecessary recalculations
  const filteredNavigation = useMemo(() => {
    const roleFiltered = filterNavigation(navigation, userRole)
    const activeModule = getActiveModule(location.pathname, userRole, location.state)
    return roleFiltered.filter((item) => item.module === activeModule)
  }, [userRole, location.pathname, location.state])

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
          if (hasActiveChild(item)) {
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

    const activeState = isActive || hasActive

    let badgeCount = 0
    if (item.href === '/transporter/requests/my') {
      badgeCount = transporterCounts.myRequests
    } else if (item.href === '/transporter/driver/panel') {
      badgeCount = transporterCounts.driverPanel
    } else if (item.href === '/transporter/admin/approval') {
      badgeCount = transporterCounts.adminApproval
    }

    let totalChildBadgeCount = 0
    if (item.module === 'transporter') {
      totalChildBadgeCount = transporterCounts.myRequests + transporterCounts.driverPanel + transporterCounts.adminApproval
    }

    if (hasChildren) {
      return (
        <div key={item.href} className="space-y-0.5">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => toggleExpanded(item.href)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group',
              activeState
                ? 'text-[#00a68a] bg-[#e6f7f4]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
              activeState 
                ? "bg-[#00a68a] text-white shadow-sm shadow-[#00a68a]/20" 
                : "bg-slate-50 text-slate-500 group-hover:bg-slate-100"
            )}>
              <Icon className="w-5 h-5 flex-shrink-0" />
            </div>
            
            <span className={cn("flex-1 text-left tracking-tight flex items-center justify-between", sidebarCollapsed && "lg:hidden")}>
              <span>{item.label}</span>
              {totalChildBadgeCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100/50 rounded-full text-[10px] font-bold mr-2">
                  {totalChildBadgeCount}
                </span>
              )}
            </span>
            
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </motion.div>
          </motion.button>
          
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="ml-[1.75rem] mt-1 space-y-1 border-l-2 border-[#e6f7f4]/80 pl-4">
                  {item.children?.map((child) => renderNavItem(child, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return (
      <motion.div
        key={item.href}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <NavLink
          to={item.href}
          onClick={() => {
            if (isMobile) {
              setSidebarOpen(false)
            }
          }}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group',
              isActive
                ? 'text-[#00a68a] bg-[#e6f7f4]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )
          }
        >
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
            isActive 
              ? "bg-[#00a68a] text-white shadow-sm shadow-[#00a68a]/20" 
              : "bg-slate-50 text-slate-500 group-hover:bg-slate-100"
          )}>
            <Icon className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="flex-1 flex justify-between items-center">
            <span>{item.label}</span>
            {badgeCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100/50 rounded-full text-[10px] font-bold">
                {badgeCount}
              </span>
            )}
          </span>
        </NavLink>
      </motion.div>
    )
  }, [currentPath, sidebarCollapsed, expandedItems, hasActiveChild, toggleExpanded, isExpanded, setSidebarOpen, isMobile, transporterCounts])

  return (
    <>
      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0,
          width: 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 bg-white border-r border-slate-200',
          'flex flex-col z-[60]',
          'top-20 sm:top-28 h-[calc(100vh-80px)] sm:h-[calc(100vh-112px)]',
          'lg:translate-x-0 lg:w-[280px]'
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-6 px-4 pb-4 space-y-1">
          <p className={cn(
            "text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-3"
          )}>
            NAVIGATION PANEL
          </p>
          {filteredNavigation.map((item) => renderNavItem(item))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100">
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]'
            )}
          >
            <Avatar
              src={user?.profile_photo_url}
              name={user?.full_name}
              size="sm"
            />
            
            <div className={cn("flex-1 min-w-0")}>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role?.role_name}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              title="Logout"
              className={cn(
                "p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors duration-200"
              )}
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar

