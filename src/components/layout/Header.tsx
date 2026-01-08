import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { Avatar, Badge } from '@/components/ui'
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

  // System Admin
  if (pathname.startsWith('/admin') && pathname.includes('/modules')) {
    return { name: 'System Administration', code: 'system_admin' }
  }

  // Hospital Admin
  if (pathname.startsWith('/admin') && !pathname.includes('/modules')) {
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
    SYSTEM_ROLES.PHARMACY_DIRECTOR,
    SYSTEM_ROLES.PHARMACY_MANAGER,
    SYSTEM_ROLES.PHARMACIST,
    SYSTEM_ROLES.PHARMACY_ASSISTANT,
    SYSTEM_ROLES.PHARMACY_STOREKEEPER,
    SYSTEM_ROLES.PHARMACY_STAFF,
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
      <div className="min-h-[112px] px-8 py-5 flex items-center justify-between">
        {/* Left Side - Branding */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Jata Negara & Branding */}
          <div className="flex items-center gap-4">
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              className="w-20 h-20 object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl font-bold tracking-tight">H.O.M.E.</h1>
              </div>
              <p className="text-sm text-slate-300 leading-tight">
                Hospital Operation & Management Ecosystem
              </p>
              <p className="text-xs text-slate-400 leading-tight mt-1">
                KEMENTERIAN KESIHATAN MALAYSIA
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-white/20 mx-2" />

          {/* Module & Role Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Module:</span>
              <Badge variant="primary" size="sm" className="bg-teal-500/20 text-teal-100 border-teal-400/30">
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
        <div className="flex items-center gap-3">
          {/* Search */}
          <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* Settings */}
          <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/20" />

          {/* User */}
          <button
            onClick={() => navigate(ROUTES.PROFILE)}
            className="flex items-center gap-3 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
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
              size="md"
              className="ring-2 ring-white/20"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
