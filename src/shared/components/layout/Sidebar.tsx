import React, { useMemo, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Building,
  Building2,
  HardHat,
  CreditCard,
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
  FlaskConical,
  MapPin,
  Briefcase,
  CalendarDays,
  Bell,
  Clock,
  ShieldCheck,
  Network,
  Search,
  Flame,
  Droplets,
  TrendingDown,
  Layers,
  Pill,
  Plus,
  Radio,
  UserCheck,
  BookOpen,
  Printer,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { Avatar } from '@/components/ui'
import { APP_NAME, ROUTES, SYSTEM_ROLES } from '@/lib/constants'
import { logout } from '@/services/authService'
import { useLanguage } from '@/shared/contexts/LanguageContext'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  children?: NavItem[]
  module?: 'admin' | 'pharmacy' | 'oxygen' | 'suhu' | 'myphis' | 'mymsds' | 'kunci' | 'transporter' | 'crossborder' | 'inventory' | 'staff' | 'perolehan' | 'formulari' | 'porter' | 'priviledging' | 'tempahan'
}

// Helper to check if user has access to nav item
const hasAccess = (item: NavItem, userRole?: string): boolean => {
  if (!userRole) return false
  const normalizedRole = userRole.toLowerCase()

  // Super Admin bypasses all restrictions
  if (
    normalizedRole === SYSTEM_ROLES.SYSTEM_ADMIN ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'super_admin'
  ) {
    return true
  }

  // If no roles specified, accessible to authenticated users
  if (!item.roles || item.roles.length === 0) return true

  // Check if user role is explicitly allowed
  return item.roles.some((r) => r.toLowerCase() === normalizedRole)
}

const getActiveModule = (pathname: string, userRole?: string, locationState?: any): 'admin' | 'pharmacy' | 'oxygen' | 'suhu' | 'myphis' | 'mymsds' | 'kunci' | 'transporter' | 'crossborder' | 'inventory' | 'staff' | 'perolehan' | 'formulari' | 'porter' | 'priviledging' | 'tempahan' => {
  if (pathname.startsWith('/tempahan') || pathname.startsWith('/hub/tempahan')) return 'tempahan'
  if (pathname.startsWith('/priviledging') || pathname.startsWith('/hub/priviledging')) return 'priviledging'
  if (pathname.startsWith('/porter') || pathname.startsWith('/hub/porter')) return 'porter'
  if (pathname.startsWith('/formulari') || pathname.startsWith('/hub/formulari')) return 'formulari'
  if (pathname.startsWith('/perolehan') || pathname.startsWith('/hub/perolehan')) return 'perolehan'
  if (pathname.startsWith('/crossborder')) return 'crossborder'
  if (pathname.startsWith('/transporter')) return 'transporter'
  if (pathname.startsWith('/kunci')) return 'kunci'
  if (pathname.startsWith('/staff') || pathname.startsWith('/hub/staff')) return 'staff'
  if (pathname.startsWith('/hub/mymsds') || pathname.includes('/mymsds')) return 'mymsds'
  if (pathname.startsWith('/hub/myphis') || pathname.includes('/myphis')) return 'myphis'
  if (pathname.startsWith('/suhu')) return 'suhu'
  if (pathname.startsWith('/pharmacy/oxygen')) return 'oxygen'
  if (pathname.startsWith('/pharmacy/inventory')) return 'inventory'
  if (pathname.startsWith('/pharmacy')) return 'pharmacy'
  if (pathname.startsWith('/admin')) return 'admin'

  // Check navigation state fallback (useful on shared pages like Profile)
  if (locationState && typeof locationState === 'object' && locationState.fromModule) {
    const fromModuleCode = locationState.fromModule.code
    if (fromModuleCode === 'tempahan' || fromModuleCode === 'mytempahan' || fromModuleCode === 'system_tempahan') return 'tempahan'
    if (fromModuleCode === 'priviledging' || fromModuleCode === 'mypriviledging' || fromModuleCode === 'system_priviledging') return 'priviledging'
    if (fromModuleCode === 'porter' || fromModuleCode === 'myporter' || fromModuleCode === 'system_porter') return 'porter'
    if (fromModuleCode === 'formulari' || fromModuleCode === 'myformulari' || fromModuleCode === 'pharmacy_formulari') return 'formulari'
    if (fromModuleCode === 'perolehan') return 'perolehan'
    if (fromModuleCode === 'suhu') return 'suhu'
    if (fromModuleCode === 'oxygen' || fromModuleCode === 'cylinder') return 'oxygen'
    if (fromModuleCode === 'pharmacy_logistics' || fromModuleCode === 'pharmacy') return 'pharmacy'
    if (fromModuleCode === 'inventory') return 'inventory'
    if (fromModuleCode === 'system_admin' || fromModuleCode === 'hospital_admin' || fromModuleCode === 'admin') return 'admin'
    if (fromModuleCode === 'myphis') return 'myphis'
    if (fromModuleCode === 'system_kunci' || fromModuleCode === 'kunci') return 'kunci'
    if (fromModuleCode === 'transporter') return 'transporter'
    if (fromModuleCode === 'crossborder') return 'crossborder'
    if (fromModuleCode === 'staff' || fromModuleCode === 'mystaff') return 'staff'
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

const PRIVILEDGING_STAFF_CHILDREN: NavItem[] = [
  { label: 'Papan Pemuka', href: '/priviledging', icon: LayoutDashboard },
  { label: 'Kriteria Credentialing', href: '/priviledging/criteria', icon: Award },
  { label: 'Katalog Prosedur (500+)', href: '/priviledging/catalog', icon: BookOpen },
  { label: 'Log & Permohonan Saya', href: '/priviledging/my-submissions', icon: FileText },
  { label: 'Cetak Sijil Privileging', href: '/priviledging/print', icon: Printer },
]

const PRIVILEDGING_ADMIN_CHILDREN: NavItem[] = [
  { label: 'Papan Pemuka (JKCP)', href: '/priviledging', icon: LayoutDashboard },
  { label: 'Semakan JKCP / Kelulusan', href: '/priviledging/review-queue', icon: ShieldCheck },
  { label: 'Kemajuan Staf', href: '/priviledging/staff-progress', icon: Users },
  { label: 'Kriteria Credentialing', href: '/priviledging/criteria', icon: Award },
  { label: 'Katalog Prosedur KKM', href: '/priviledging/catalog', icon: BookOpen },
  { label: 'Cetak & Perakuan Sijil', href: '/priviledging/print', icon: Printer },
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
      { label: 'KEW.PS-4 Cylinder Ledger', href: ROUTES.PHARMACY_OXYGEN_LEDGER, icon: ScrollText },
      { label: 'Stock Reconciliation', href: '/pharmacy/oxygen/reconciliation', icon: FileText },
      { label: 'Cylinder Report', href: ROUTES.PHARMACY_OXYGEN_REPORTS, icon: BarChart3 },
      { label: 'Cylinder Maintenance', href: '/pharmacy/oxygen/maintenance', icon: Wrench },
    ],
  },
  {
    label: 'Catalog',
    href: ROUTES.PHARMACY_SUPPLIER_CATALOG,
    icon: ClipboardList,
    roles: PHARMACY_ROLES,
    module: 'pharmacy',
    children: [
      { label: 'Supplier Catalog', href: ROUTES.PHARMACY_SUPPLIER_CATALOG, icon: Truck },
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
    label: 'Dashboard',
    href: ROUTES.PHARMACY_INVENTORY,
    icon: LayoutDashboard,
    roles: PHARMACY_ROLES,
    module: 'inventory',
  },
  {
    label: 'Inventory Catalog',
    href: ROUTES.PHARMACY_DRUGS,
    icon: Package,
    roles: PHARMACY_ROLES,
    module: 'inventory',
    children: [
      { label: 'Drug Inventory', href: ROUTES.PHARMACY_DRUGS, icon: Package },
      { label: 'Non-Drug Inventory', href: ROUTES.PHARMACY_NON_DRUGS, icon: ClipboardList },
    ],
  },
  {
    label: 'Facility Inventory',
    href: ROUTES.PHARMACY_FACILITY_DRUGS,
    icon: Building2,
    roles: PHARMACY_ROLES,
    module: 'inventory',
    children: [
      { label: 'Drug', href: ROUTES.PHARMACY_FACILITY_DRUGS, icon: Package },
      { label: 'Non-Drug', href: ROUTES.PHARMACY_FACILITY_NON_DRUGS, icon: ClipboardList },
    ],
  },
  {
    label: 'Store Location Management',
    href: ROUTES.PHARMACY_STORE_LOCATIONS,
    icon: MapPin,
    roles: PHARMACY_ROLES,
    module: 'inventory',
  },
  {
    label: 'KEW.PS-4 Ledger',
    href: ROUTES.PHARMACY_LEDGER,
    icon: ScrollText,
    roles: PHARMACY_ROLES,
    module: 'inventory',
  },
  {
    label: 'Distribution',
    href: ROUTES.PHARMACY_DISTRIBUTION_INDENT,
    icon: Truck,
    roles: PHARMACY_ROLES,
    module: 'inventory',
    children: [
      { label: 'Indent Requests', href: ROUTES.PHARMACY_DISTRIBUTION_INDENT, icon: ClipboardList },
      { label: 'Issue Counter', href: ROUTES.PHARMACY_DISTRIBUTION_ISSUE, icon: Package },
      { label: 'Indent Entitlement', href: ROUTES.PHARMACY_DISTRIBUTION_ENTITLEMENT, icon: Shield },
    ],
  },
  {
    label: 'Stock Analysis',
    href: ROUTES.PHARMACY_NEAR_EXPIRY,
    icon: AlertTriangle,
    roles: PHARMACY_ROLES,
    module: 'inventory',
    children: [
      { label: 'Near Expiry', href: ROUTES.PHARMACY_NEAR_EXPIRY, icon: AlertTriangle },
      { label: 'Slow-Moving Items', href: ROUTES.PHARMACY_SLOW_MOVING, icon: BarChart3 },
      { label: 'Inventory Report', href: ROUTES.PHARMACY_INVENTORY_REPORT, icon: FileText },
    ],
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
    label: 'MyMSDS',
    href: '/hub/mymsds',
    icon: FlaskConical,
    module: 'mymsds',
    children: [
      { label: 'Dashboard', href: '/hub/mymsds', icon: LayoutDashboard },
      { label: 'MSDS Directory', href: '/hub/mymsds', icon: ClipboardList },
      { label: 'Emergency Procedures', href: '/hub/mymsds', icon: Shield },
    ],
  },
  {
    label: 'MyKunci',
    href: '/kunci/dashboard',
    icon: Key,
    module: 'kunci',
    children: [
      { label: 'Dashboard', href: '/kunci/dashboard', icon: LayoutDashboard },
      { label: 'Key Register', href: '/kunci/daftar', icon: ClipboardList },
      { label: 'Movement Log', href: '/kunci/log', icon: FileText },
      { label: 'Monthly Verification', href: '/kunci/audit', icon: Shield },
      { label: 'MOH Key Policy', href: '/kunci/polisi', icon: ScrollText },
    ],
  },
  {
    label: 'MyTransporter',
    href: '/transporter/dashboard',
    icon: Car,
    module: 'transporter',
    children: [
      { label: 'Dashboard', href: '/transporter/dashboard', icon: LayoutDashboard },
      { label: 'New Request', href: '/transporter/requests/new', icon: FileText },
      { label: 'Check SG Slot', href: '/transporter/availability', icon: Calendar },
      { label: 'My Requests', href: '/transporter/requests/my', icon: ClipboardList },
      { label: 'Driver Panel', href: '/transporter/driver/panel', icon: Truck },
      { label: 'Admin Approvals', href: '/transporter/admin/approval', icon: Shield },
      { label: 'Fleet Vehicles', href: '/transporter/admin/vehicles', icon: Settings },
      { label: 'Driver Issues', href: '/transporter/admin/vehicles/issues', icon: AlertTriangle },
      { label: 'Mileage & Claims', href: '/transporter/admin/vehicles/movement', icon: BarChart3 },
      { label: 'Role Assignments', href: '/transporter/admin/roles', icon: Users },
    ],
  },
  {
    label: 'MyStaff',
    href: '/staff/dashboard',
    icon: Users,
    module: 'staff',
    children: [
      { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
      { label: 'Log Pergerakan', href: '/staff/movement', icon: Briefcase },
      { label: 'Log Event', href: '/staff/reminders', icon: Bell },
      { label: 'Kalendar Jabatan', href: '/staff/calendar', icon: Calendar },
      { label: 'Carta Organisasi', href: '/staff/org-chart', icon: Network },
    ],
  },
  {
    label: 'MyCrossBorder',
    href: '/crossborder/dashboard',
    icon: Globe,
    module: 'crossborder',
    children: [
      { label: 'Dashboard', href: '/crossborder/dashboard', icon: LayoutDashboard },
      { label: 'New Permit Request', href: '/crossborder/create', icon: FileText },
      { label: 'Movement Log', href: '/crossborder/log', icon: ClipboardList },
    ],
  },
  {
    label: 'Dashboard',
    href: '/perolehan',
    icon: LayoutDashboard,
    module: 'perolehan',
  },
  {
    label: 'Bajet Pengurusan',
    href: '/perolehan/pengurusan',
    icon: Building,
    module: 'perolehan',
  },
  {
    label: 'Bajet Pembangunan',
    href: '/perolehan/pembangunan',
    icon: HardHat,
    module: 'perolehan',
  },
  {
    label: 'Pesanan & LPO',
    href: '/perolehan/orders',
    icon: ShoppingCart,
    module: 'perolehan',
  },
  {
    label: 'Terimaan & Bayaran',
    href: '/perolehan/payments',
    icon: CreditCard,
    module: 'perolehan',
  },
  {
    label: 'Katalog & Pembekal',
    href: '/perolehan/catalog',
    icon: ClipboardList,
    module: 'perolehan',
  },
  {
    label: 'MyFormulari',
    href: '/formulari/dashboard',
    icon: Pill,
    module: 'formulari',
    children: [
      { label: 'Carian & Katalog Ubat', href: '/formulari/dashboard', icon: Search },
      { label: 'Ubat Berisiko Tinggi (HAM)', href: '/formulari/ham', icon: Flame },
      { label: 'Daftar LASA & TALL-Man', href: '/formulari/lasa', icon: AlertTriangle },
      { label: 'Protokol Pelarutan IV', href: '/formulari/dilution', icon: Droplets },
      { label: 'Garis Panduan NAG 2024', href: '/formulari/antimicrobial', icon: ShieldCheck },
      { label: 'Kuota & Amaran Stok', href: '/formulari/quota', icon: TrendingDown },
      { label: 'Matriks Ubat Alternatif', href: '/formulari/alternatives', icon: Layers },
    ],
  },
  {
    label: 'MyPorter',
    href: '/porter/dashboard',
    icon: Truck,
    module: 'porter',
    children: [
      { label: 'Papan Pemuka (Dashboard)', href: '/porter/dashboard', icon: LayoutDashboard },
      { label: 'Pesan Porter Baharu', href: '/porter/requests/new', icon: Plus },
      { label: 'Pesanan & Jejak Terkini', href: '/porter/requests/my', icon: ClipboardList },
      { label: 'Panel PPK (Driver Rider)', href: '/porter/panel', icon: Radio },
      { label: 'Penerimaan Kargo (Wad)', href: '/porter/receiver', icon: ShieldCheck },
      { label: 'Pusat Kawalan Dispatch', href: '/porter/manager', icon: Shield },
      { label: 'Jadual Bertugas PPK', href: '/porter/roster', icon: Calendar },
      { label: 'Laporan Prestasi & KPI', href: '/porter/reports', icon: BarChart3 },
      { label: 'Tetapan Peranan', href: '/porter/roles', icon: Users },
    ],
  },
  {
    label: 'MyPriviledging',
    href: '/priviledging',
    icon: UserCheck,
    module: 'priviledging',
    children: PRIVILEDGING_STAFF_CHILDREN,
  },
  {
    label: 'MyTempahan',
    href: '/tempahan',
    icon: CalendarDays,
    module: 'tempahan',
    children: [
      { label: 'Papan Pemuka', href: '/tempahan', icon: LayoutDashboard },
      { label: 'Kalendar Interaktif', href: '/tempahan/kalendar', icon: Calendar },
      { label: 'Tempahan Baharu', href: '/tempahan/permohonan-baru', icon: Plus },
      { label: 'Permohonan Saya', href: '/tempahan/permohonan-saya', icon: ClipboardList },
      { label: 'Semakan Kelulusan', href: '/tempahan/kelulusan', icon: ShieldCheck },
      { label: 'Direktori Fasiliti & Bilik', href: '/tempahan/senarai-bilik', icon: Building2 },
      { label: 'Laporan & Analisis', href: '/tempahan/laporan', icon: BarChart3 },
    ],
  },
]


export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, logout: storeLogout } = useAuthStore()
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useSidebar()
  const { language, t } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  const userRole = user?.role?.role_code

  const [transporterCounts, setTransporterCounts] = useState({
    myRequests: 0,
    driverPanel: 0,
    adminApproval: 0
  })

  const [porterCounts, setPorterCounts] = useState({
    myRequests: 0,
    driverPanel: 0,
    receiver: 0,
    manager: 0
  })

  const [priviledgingCounts, setPriviledgingCounts] = useState({
    pendingReviews: 0,
    changesRequested: 0
  })

  const [tempahanPendingCount, setTempahanPendingCount] = useState(0)

  const [priviledgingMode, setPriviledgingMode] = useState<'staff' | 'admin'>(() => {
    try {
      const mode = localStorage.getItem('home_mypriviledging_role_mode')
      if (mode === 'admin') return 'admin'
      if (mode === 'staff') return 'staff'
    } catch {}
    if (userRole && [
      SYSTEM_ROLES.SYSTEM_ADMIN,
      SYSTEM_ROLES.HOSPITAL_ADMIN,
      SYSTEM_ROLES.HOSPITAL_ADMINISTRATOR,
      'admin',
      'superadmin'
    ].includes(userRole as any)) {
      return 'admin'
    }
    return 'staff'
  })

  useEffect(() => {
    const handlePriviledgingModeChange = (e: any) => {
      if (e.detail === 'admin' || e.detail === 'staff') {
        setPriviledgingMode(e.detail)
      }
    }
    window.addEventListener('priviledging_mode_change', handlePriviledgingModeChange)
    return () => window.removeEventListener('priviledging_mode_change', handlePriviledgingModeChange)
  }, [])

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const fetchCounts = async () => {
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

        const { getPorterJobs } = await import('@/modules/myporter/services/porterService')
        const porterRes = await getPorterJobs()
        if (porterRes.data && isMounted) {
          const pList = porterRes.data
          const myActive = pList.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length
          const poolCount = pList.filter(j => j.status === 'broadcasting').length
          const receiverCount = pList.filter(j => j.status === 'pending_receiver_confirmation' || j.status === 'at_destination').length
          const statCount = pList.filter(j => j.urgency === 'stat' && j.status !== 'completed' && j.status !== 'cancelled').length

          setPorterCounts({
            myRequests: myActive,
            driverPanel: poolCount,
            receiver: receiverCount,
            manager: statCount
          })
        }

        const { priviledgingService } = await import('@/modules/mypriviledging/services/priviledgingService')
        if (isMounted) {
          const kpis = priviledgingService.getKpis()
          setPriviledgingCounts({
            pendingReviews: kpis.pendingSubmissions,
            changesRequested: kpis.changesRequestedSubmissions
          })
        }

        const { getBookings } = await import('@/modules/mytempahan/services/tempahanService')
        const tempahanRes = await getBookings()
        if (tempahanRes.data && isMounted) {
          const pending = tempahanRes.data.filter(b => b.status === 'pending').length
          setTempahanPendingCount(pending)
        }
      } catch (err) {
        console.error('Error fetching sidebar counts:', err)
      }
    }

    fetchCounts()

    const interval = setInterval(fetchCounts, 10000)

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
    return roleFiltered
      .filter((item) => item.module === activeModule)
      .map((item) => {
        if (item.module === 'priviledging') {
          return {
            ...item,
            children: priviledgingMode === 'admin' ? PRIVILEDGING_ADMIN_CHILDREN : PRIVILEDGING_STAFF_CHILDREN,
          }
        }
        return item
      })
  }, [userRole, location.pathname, location.state, priviledgingMode])

  const handleLogout = async () => {
    await logout()
    storeLogout()
  }

  // Memoize current pathname to prevent unnecessary recalculations
  const currentPath = useMemo(() => location.pathname, [location.pathname])
  
  // State to track expanded menu items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const fullPath = useMemo(() => location.pathname + location.search, [location.pathname, location.search])

  // Helper function to check if any child or nested child is active
  const hasActiveChild = React.useCallback((item: NavItem): boolean => {
    if (!item.children) return false
    return item.children.some((child) => {
      const childIsActive = child.href.includes('?')
        ? fullPath === child.href
        : currentPath === child.href || currentPath.startsWith(child.href + '/')
      return childIsActive || hasActiveChild(child)
    })
  }, [currentPath, fullPath])

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
    const isActive = item.href.includes('?')
      ? fullPath === item.href
      : currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href + '/'))
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
    } else if (item.href === '/porter/requests/my') {
      badgeCount = porterCounts.myRequests
    } else if (item.href === '/porter/panel') {
      badgeCount = porterCounts.driverPanel
    } else if (item.href === '/porter/receiver') {
      badgeCount = porterCounts.receiver
    } else if (item.href === '/porter/manager') {
      badgeCount = porterCounts.manager
    } else if (item.href === '/priviledging/review-queue') {
      badgeCount = priviledgingCounts.pendingReviews
    } else if (item.href === '/priviledging/my-submissions') {
      badgeCount = priviledgingCounts.changesRequested
    } else if (item.href === '/tempahan/kelulusan') {
      badgeCount = tempahanPendingCount
    }

    let totalChildBadgeCount = 0
    if (item.module === 'transporter') {
      totalChildBadgeCount = transporterCounts.myRequests + transporterCounts.driverPanel + transporterCounts.adminApproval
    } else if (item.module === 'porter') {
      totalChildBadgeCount = porterCounts.myRequests + porterCounts.driverPanel + porterCounts.receiver + porterCounts.manager
    } else if (item.module === 'priviledging') {
      totalChildBadgeCount = priviledgingMode === 'admin'
        ? priviledgingCounts.pendingReviews
        : priviledgingCounts.changesRequested
    } else if (item.module === 'tempahan') {
      totalChildBadgeCount = tempahanPendingCount
    }

    const getTranslatedLabel = (label: string): string => {
      const map: Record<string, string> = {
        'Dashboard': t('nav.dashboard', 'Dashboard'),
        'Administration': t('nav.administration', 'Administration'),
        'Monitoring': t('nav.search', 'Monitoring'),
        'Financial': t('sidebar.mywarrant', 'Financial'),
        'Medical Oxygen': language === 'ms' ? 'Oksigen Perubatan' : 'Medical Oxygen',
        'Oxygen Dashboard': language === 'ms' ? 'Dashboard Oksigen' : 'Oxygen Dashboard',
        'Cylinder Inventory': language === 'ms' ? 'Inventori Silinder' : 'Cylinder Inventory',
        'Cylinder Request': language === 'ms' ? 'Permohonan Silinder' : 'Cylinder Request',
        'QR Generator': language === 'ms' ? 'Jana Kod QR' : 'QR Generator',
        'KEW.PS-4 Cylinder Ledger': language === 'ms' ? 'Lejar KEW.PS-4 Silinder' : 'KEW.PS-4 Cylinder Ledger',
        'Stock Reconciliation': language === 'ms' ? 'Penyelarasan Stok' : 'Stock Reconciliation',
        'Cylinder Report': language === 'ms' ? 'Laporan Silinder' : 'Cylinder Report',
        'Cylinder Maintenance': language === 'ms' ? 'Penyelenggaraan Silinder' : 'Cylinder Maintenance',
        'Supplier Catalog': language === 'ms' ? 'Katalog Pembekal' : 'Supplier Catalog',
        'Hospital Facilities': language === 'ms' ? 'Fasiliti Hospital' : 'Hospital Facilities',
        'Clinic Facilities': language === 'ms' ? 'Fasiliti Klinik' : 'Clinic Facilities',
        'Procurement Reports': language === 'ms' ? 'Laporan Perolehan' : 'Procurement Reports',
        'Financial Reports': language === 'ms' ? 'Laporan Kewangan' : 'Financial Reports',
        'Drug Inventory': language === 'ms' ? 'Inventori Ubat' : 'Drug Inventory',
        'Non-Drug Inventory': language === 'ms' ? 'Inventori Bukan Ubat' : 'Non-Drug Inventory',
        'Drug': language === 'ms' ? 'Ubat' : 'Drug',
        'Non-Drug': language === 'ms' ? 'Bukan Ubat' : 'Non-Drug',
        'Near Expiry': language === 'ms' ? 'Hampir Luput' : 'Near Expiry',
        'Slow-Moving Items': language === 'ms' ? 'Barangan Lambat Bergerak' : 'Slow-Moving Items',
        'Inventory Report': language === 'ms' ? 'Laporan Inventori' : 'Inventory Report',
        'Stock Analysis': language === 'ms' ? 'Analisis Stok' : 'Stock Analysis',
        'Distribution': language === 'ms' ? 'Pengedaran (Inden Store)' : 'Distribution (Store Indent)',
        'Indent Requests': language === 'ms' ? 'Permohonan Inden' : 'Indent Requests',
        'Issue Counter': language === 'ms' ? 'Kaunter Pengeluaran' : 'Issue Counter',
        'Indent Entitlement': language === 'ms' ? 'Kelayakan Inden Jabatan' : 'Indent Entitlement',
        'Warrant': language === 'ms' ? 'Waran' : 'Warrant',
        'APPL Allocation': language === 'ms' ? 'Peruntukan APPL' : 'APPL Allocation',
        'CC Allocation': language === 'ms' ? 'Peruntukan CC' : 'CC Allocation',
        'LP Allocation': language === 'ms' ? 'Peruntukan LP' : 'LP Allocation',
        'Budget Forecasting': language === 'ms' ? 'Ramalan Belanjawan' : 'Budget Forecasting',
        'Purchase Orders': language === 'ms' ? 'Pesanan Pembelian' : 'Purchase Orders',
        'LPO': language === 'ms' ? 'LPO' : 'LPO',
        'Order Tracking': language === 'ms' ? 'Penjejakan Pesanan' : 'Order Tracking',
        'Received Item': language === 'ms' ? 'Penerimaan Barangan' : 'Received Item',
        'Payment': language === 'ms' ? 'Pembayaran' : 'Payment',
        'Credit Notes': language === 'ms' ? 'Nota Kredit' : 'Credit Notes',
        'Penalty': language === 'ms' ? 'Denda & Penalti' : 'Penalty',
        'LOU': language === 'ms' ? 'Surat Aku Janji (LOU)' : 'LOU',
        'Supplier Performance': language === 'ms' ? 'Prestasi Pembekal' : 'Supplier Performance',
        'Breach Log': language === 'ms' ? 'Log Pelanggaran Suhu' : 'Breach Log',
        'Admin Setup': language === 'ms' ? 'Tetapan Pentadbir' : 'Admin Setup',
        'Users': language === 'ms' ? 'Pengguna' : 'Users',
        'Access Requests': language === 'ms' ? 'Permohonan Akses' : 'Access Requests',
        'Memo Approval': language === 'ms' ? 'Kelulusan Memo' : 'Memo Approval',
        'Sensitive Data Requests': language === 'ms' ? 'Permohonan Data Sensitif' : 'Sensitive Data Requests',
        'Hospitals': language === 'ms' ? 'Hospital' : 'Hospitals',
        'Clinics': language === 'ms' ? 'Klinik' : 'Clinics',
        'Departments': language === 'ms' ? 'Jabatan' : 'Departments',
        'Roles & Permissions': language === 'ms' ? 'Peranan & Kebenaran' : 'Roles & Permissions',
        'System Health': language === 'ms' ? 'Kesihatan Sistem' : 'System Health',
        'Backup Status': language === 'ms' ? 'Status Sandaran' : 'Backup Status',
        'Backups': language === 'ms' ? 'Sandaran' : 'Backups',
        'Alerts': language === 'ms' ? 'Amaran' : 'Alerts',
        'Audit Logs': language === 'ms' ? 'Log Audit' : 'Audit Logs',
        'Settings': language === 'ms' ? 'Tetapan' : 'Settings',
        'Carta Organisasi': language === 'ms' ? 'Carta Organisasi' : 'Organizational Chart',
        'Organizational Chart': language === 'ms' ? 'Carta Organisasi' : 'Organizational Chart',
        'Log Pergerakan': language === 'ms' ? 'Log Pergerakan' : 'Movement Log',
        'Log Event': language === 'ms' ? 'Log Event' : 'Event Log',
        'Kalendar Jabatan': language === 'ms' ? 'Kalendar Jabatan' : 'Department Calendar',
      }
      return map[label] || label
    }

    const itemLabel = getTranslatedLabel(item.label)

    if (depth > 0) {
      // Sub-item rendering with sleek tree dots & micro styling
      return (
        <motion.div
          key={`${item.href}-${item.label}`}
          whileHover={{ x: 3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
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
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group relative',
                isActive
                  ? 'text-teal-300 font-semibold bg-teal-500/10 border border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.12)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200 flex-shrink-0",
                  isActive 
                    ? "bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)] scale-125" 
                    : "bg-slate-600 group-hover:bg-slate-400"
                )} />
                <span className="flex-1 truncate">{itemLabel}</span>
                {badgeCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold">
                    {badgeCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </motion.div>
      )
    }

    if (hasChildren) {
      return (
        <div key={`${item.href}-${item.label}`} className="space-y-0.5">
          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => toggleExpanded(item.href)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group relative',
              activeState
                ? 'text-emerald-400 bg-slate-800/80 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
            )}
          >
            {activeState && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
            
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0",
              activeState 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm" 
                : "bg-slate-800/60 text-slate-400 group-hover:bg-slate-700/60 group-hover:text-slate-200"
            )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
            </div>
            
            <span className={cn("flex-1 text-left tracking-tight flex items-center justify-between", sidebarCollapsed && "lg:hidden")}>
              <span className="font-semibold">{itemLabel}</span>
              {totalChildBadgeCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold mr-2">
                  {totalChildBadgeCount}
                </span>
              )}
            </span>
            
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-slate-200" />
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
                <div className="ml-5 mt-1 space-y-1 border-l border-slate-800/90 pl-3">
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
        key={`${item.href}-${item.label}`}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
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
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group relative',
              isActive
                ? 'text-emerald-400 bg-slate-800/80 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
              
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0",
                isActive 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm" 
                  : "bg-slate-800/60 text-slate-400 group-hover:bg-slate-700/60 group-hover:text-slate-200"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
              </div>
              <span className="flex-1 flex justify-between items-center">
                <span>{itemLabel}</span>
                {badgeCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold">
                    {badgeCount}
                  </span>
                )}
              </span>
            </>
          )}
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[60] lg:hidden"
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
          'fixed left-0 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80',
          'flex flex-col z-[60] shadow-2xl shadow-slate-950/50',
          'top-16 sm:top-20 lg:top-24 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] lg:h-[calc(100vh-96px)]',
          'lg:translate-x-0 lg:w-[280px]'
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-5 px-3.5 pb-4 space-y-1.5 custom-scrollbar">
          <div className="flex items-center gap-2 mb-3.5 px-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              NAVIGATION PANEL
            </p>
          </div>
          {filteredNavigation.map((item) => renderNavItem(item))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-lg group hover:border-slate-700/80 transition-all duration-200'
            )}
          >
            <div className="relative">
              <Avatar
                src={user?.profile_photo_url}
                name={user?.full_name}
                size="sm"
                className="ring-2 ring-emerald-500/30 group-hover:ring-emerald-400/60 transition-all"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
            </div>
            
            <div className={cn("flex-1 min-w-0")}>
              <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                {user?.full_name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.role?.role_name}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              title="Logout"
              className={cn(
                "p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors duration-200"
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

