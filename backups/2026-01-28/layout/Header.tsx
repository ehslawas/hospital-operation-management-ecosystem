import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { Avatar, Badge, LogoImage } from '@/components/ui'
import { SYSTEM_ROLES, MODULE_DEFINITIONS, ROLE_DISPLAY_NAMES, ROUTES } from '@/lib/constants'

/**
 * Get current module name based on route
 */
const getCurrentModule = (pathname: string): { name: string; code?: string } | null => {
  // Pharmacy Logistics
  if (pathname.startsWith('/pharmacy')) {
    const module = MODULE_DEFINITIONS.find(m => m.code === 'pharmacy_logistics')
    return { name: module?.name || 'Pharmacy Logistics', code: 'pharmacy_logistics' }
  }

  // System & Hospital Admin
  if (pathname.startsWith('/admin')) {
    if (pathname.includes('/users') || pathname.includes('/roles') || pathname.includes('/modules') || pathname.includes('/features') || pathname.includes('/permissions')) {
      return { name: 'System Administration', code: 'system_admin' }
    }
    return { name: 'Hospital Administration', code: 'hospital_admin' }
  }

  // Dashboard
  if (pathname === '/dashboard' || pathname === '/') {
    return null // Will be determined by user role
  }

  return null
}

/**
 * Get module name from user role
 */
const getModuleFromRole = (roleCode?: string): string | null => {
  if (!roleCode) return null

  // Pharmacy roles
  if ([
    SYSTEM_ROLES.PHARMACIST,
    SYSTEM_ROLES.ASSISTANT_PHARMACIST,
  ].includes(roleCode as any)) {
    return 'Pharmacy Logistics'
  }

  // System Admin
  if (roleCode === SYSTEM_ROLES.SYSTEM_ADMIN) {
    return 'System Administration'
  }

  // Hospital Admin
  if (roleCode === SYSTEM_ROLES.HOSPITAL_ADMIN) {
    return 'Hospital Administration'
  }

  return null
}

export const Header: React.FC = () => {
  const { user, activeRoleCode, setActiveRoleCode } = useAuthStore()
  const { toggleSidebar } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  const isHospitalAdmin = user?.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
  const isSystemAdmin = user?.role?.role_code === SYSTEM_ROLES.SYSTEM_ADMIN
  const canSwitchView = isHospitalAdmin || isSystemAdmin

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const newRole = value === 'original' ? null : value
    setActiveRoleCode(newRole)
    // Redirect to dashboard to refresh visual context
    navigate(ROUTES.DASHBOARD)
  }

  // Determine current module
  const currentModule = useMemo(() => {
    const routeModule = getCurrentModule(location.pathname)
    if (routeModule) return routeModule
    const effectiveRole = activeRoleCode || user?.role?.role_code
    const moduleName = getModuleFromRole(effectiveRole) || user?.department?.department_name || 'HOME System'
    return { name: moduleName, code: undefined }
  }, [location.pathname, user?.role?.role_code, user?.department?.department_name, activeRoleCode])

  // Get role display name
  const roleDisplayName = useMemo(() => {
    const roleCode = user?.role?.role_code
    if (!roleCode) return 'User'

    return ROLE_DISPLAY_NAMES[roleCode] || user?.role?.role_name || 'User'
  }, [user?.role])

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white z-40 shadow-lg no-print">
      <div className="min-h-[88px] xs:min-h-[96px] sm:min-h-[104px] px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-4 sm:py-5 flex items-center justify-between gap-3 xs:gap-4 sm:gap-5">
        {/* Left Side - Branding */}
        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden touch-target p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Jata Negara & Branding - Always Visible */}
          <div className="flex items-center gap-3 xs:gap-4 sm:gap-5 min-w-0 flex-1">
            <LogoImage
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              size={64}
              priority
              className="flex-shrink-0 w-16 h-16 xs:w-[72px] xs:h-[72px] sm:w-20 sm:h-20"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-lg xs:text-xl sm:text-2xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                H.O.M.E
              </h1>
              <p className="text-[10px] xs:text-xs sm:text-sm text-blue-100 leading-tight mt-0.5 line-clamp-1">
                Hospital Operation & Management Ecosystem
              </p>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-blue-200 font-semibold uppercase tracking-wide mt-0.5 line-clamp-1">
                KEMENTERIAN KESIHATAN MALAYSIA (KKM)
              </p>
            </div>
          </div>

          {/* Divider - Hidden on very small screens */}
          <div className="w-px h-14 xs:h-16 sm:h-20 bg-white/20 mx-2 xs:mx-3 hidden sm:block" />

          {/* Module & Role Info - Larger */}
          <div className="flex flex-col gap-1 xs:gap-1.5 min-w-0 hidden md:flex">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs xs:text-sm text-slate-400 uppercase tracking-wide whitespace-nowrap">MODULE:</span>
              <Badge variant="primary" size="sm" className="bg-teal-600/90 text-white border-teal-400/30 text-xs xs:text-sm whitespace-nowrap font-semibold rounded-full px-3 py-1.5">
                {currentModule.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs xs:text-sm text-slate-400 uppercase tracking-wide whitespace-nowrap">ROLE:</span>
              <span className="text-xs xs:text-sm font-bold text-white truncate">{roleDisplayName}</span>
            </div>
          </div>
        </div>

        {/* View Switcher for Admins */}
        {canSwitchView && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">View Mode:</span>
            <select
              value={activeRoleCode || 'original'}
              onChange={handleRoleChange}
              className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 cursor-pointer hover:text-blue-400 transition-colors py-0"
            >
              <option value="original" className="bg-slate-800">{isSystemAdmin ? 'System Admin' : 'Hospital Admin'}</option>
              <option value={SYSTEM_ROLES.PHARMACIST} className="bg-slate-800">Pharmacist View</option>
            </select>
            {activeRoleCode && (
              <Badge variant="warning" size="sm" className="animate-pulse">Active View</Badge>
            )}
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Search - Hidden on very small screens */}
          <button className="hidden sm:block touch-target p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Search">
            <Search className="w-5 h-5 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
          </button>

          {/* Notifications */}
          <button className="relative touch-target p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 xs:w-2.5 xs:h-2.5 bg-rose-500 rounded-full" />
          </button>

          {/* Settings */}
          <button className="hidden sm:block touch-target p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Settings">
            <Settings className="w-5 h-5 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
          </button>

          {/* Divider - Hidden on small screens */}
          <div className="w-px h-8 bg-white/20 hidden sm:block" />

          {/* User */}
          <button
            onClick={() => navigate(ROUTES.PROFILE)}
            className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 hover:bg-white/10 rounded-lg px-2 xs:px-2.5 sm:px-3 py-1.5 transition-colors touch-target min-w-[44px]"
            aria-label="User profile"
          >
            <div className="text-right hidden lg:block min-w-0">
              <p className="text-sm xs:text-sm sm:text-base font-medium text-white truncate max-w-[120px] sm:max-w-none">
                {user?.full_name}
              </p>
              <p className="text-xs xs:text-xs sm:text-sm text-slate-300 truncate max-w-[120px] sm:max-w-none">
                {user?.hospital?.hospital_name || 'Hospital'}
              </p>
            </div>
            <Avatar
              src={user?.profile_photo_url}
              name={user?.full_name}
              size="md"
              className="ring-2 ring-white/20 w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
