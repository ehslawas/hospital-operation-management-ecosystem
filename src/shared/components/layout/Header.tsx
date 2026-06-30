import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, Settings, Home } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { Avatar, Badge } from '@/components/ui'
import { SYSTEM_ROLES, MODULE_DEFINITIONS, ROLE_DISPLAY_NAMES, ROUTES } from '@/lib/constants'

/**
 * Get current module name based on route
 */
const getCurrentModule = (pathname: string): { name: string; code?: string } | null => {
  // MySuhu
  if (pathname.startsWith('/suhu')) {
    return { name: 'MySuhu', code: 'suhu' }
  }

  // Medical Oxygen / MyCylinder
  if (pathname.startsWith('/pharmacy/oxygen')) {
    return { name: 'MyCylinder', code: 'cylinder' }
  }

  // Pharmacy Logistics
  if (pathname.startsWith('/pharmacy')) {
    const module = MODULE_DEFINITIONS.find(m => m.code === 'pharmacy_logistics')
    return { name: module?.name || 'MyWarrant', code: 'pharmacy_logistics' }
  }

  // System Admin
  if (pathname.startsWith('/admin') && pathname.includes('/modules')) {
    return { name: 'System Administration', code: 'system_admin' }
  }

  // Hospital Admin
  if (pathname.startsWith('/admin') && !pathname.includes('/modules')) {
    return { name: 'Hospital Administration', code: 'hospital_admin' }
  }

  // Transporter
  if (pathname.startsWith('/hub/transporter')) {
    const module = MODULE_DEFINITIONS.find(m => m.code === 'system_transporter')
    return { name: module?.name || 'MyTransporter', code: 'system_transporter' }
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
    SYSTEM_ROLES.PHARMACY_DIRECTOR,
    SYSTEM_ROLES.PHARMACY_MANAGER,
    SYSTEM_ROLES.PHARMACIST,
    SYSTEM_ROLES.PHARMACY_ASSISTANT,
    SYSTEM_ROLES.PHARMACY_STOREKEEPER,
    SYSTEM_ROLES.PHARMACY_STAFF,
  ].includes(roleCode as any)) {
    return 'MyWarrant'
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
  const { user } = useAuthStore()
  const { toggleSidebar } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine current module
  const currentModule = useMemo(() => {
    const routeModule = getCurrentModule(location.pathname)
    if (routeModule) return routeModule
    return { name: getModuleFromRole(user?.role?.role_code) || 'HOME System', code: undefined }
  }, [location.pathname, user?.role?.role_code])

  // Get role display name
  const roleDisplayName = useMemo(() => {
    const roleCode = user?.role?.role_code
    if (!roleCode) return 'User'

    return ROLE_DISPLAY_NAMES[roleCode] || user?.role?.role_name || 'User'
  }, [user?.role])

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white z-40 shadow-lg">
      <div className="h-20 sm:min-h-[112px] px-4 sm:px-8 flex items-center justify-between">
        {/* Left Side - Branding */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Jata Negara & Branding - Clickable to return home */}
          <div 
            className="flex items-center gap-2 sm:gap-4 cursor-pointer group"
            onClick={() => navigate('/')}
            title="Return to Landing Page"
          >
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              className="w-10 h-10 sm:w-20 sm:h-20 object-contain flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg sm:text-3xl font-bold tracking-tight group-hover:text-cyan-200 transition-colors">H.O.M.E.</h1>
              </div>
              <p className="text-[10px] sm:text-sm text-slate-300 leading-tight group-hover:text-slate-200 transition-colors">
                Hospital Operation & Management Ecosystem
              </p>
              <p className="text-[8px] sm:text-xs text-slate-400 leading-tight mt-0.5 sm:mt-1">
                KEMENTERIAN KESIHATAN MALAYSIA
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-12 bg-white/20 mx-2" />

          {/* Module & Role Info */}
          <div className="hidden lg:flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Module:</span>
              <Badge variant="primary" size="sm" className="bg-teal-600 text-white border-none px-3 rounded-full font-bold">
                {currentModule.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Role:</span>
              <span className="text-xs font-semibold text-white">{roleDisplayName}</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Home / Landing Page */}
          <button 
            onClick={() => navigate('/')}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Return to Landing Page"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Search - Hidden on very small mobile */}
          <button className="hidden xs:block p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/20" />

          {/* User */}
          <button
            onClick={() => navigate(ROUTES.PROFILE)}
            className="flex items-center gap-2 sm:gap-3 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-300">
                {user?.hospital?.hospital_name || 'Hospital'}
              </p>
            </div>
            <Avatar
              src={user?.profile_photo_url}
              name={user?.full_name}
              size="sm"
              className="sm:w-10 sm:h-10 ring-2 ring-white/20"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
