import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, Settings, Home } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { Avatar, Badge } from '@/components/ui'
import { SYSTEM_ROLES, MODULE_DEFINITIONS, ROLE_DISPLAY_NAMES, ROUTES } from '@/lib/constants'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { LanguageSelector } from '@/shared/components/LanguageSelector'

/**
 * Get current module name based on route
 */
const getCurrentModule = (pathname: string): { name: string; code?: string } | null => {
  // MyTempahan
  if (pathname.startsWith('/tempahan') || pathname.startsWith('/hub/tempahan')) {
    return { name: 'MyTempahan', code: 'tempahan' }
  }

  // MyPriviledging
  if (pathname.startsWith('/priviledging') || pathname.startsWith('/hub/priviledging')) {
    return { name: 'MyPriviledging', code: 'priviledging' }
  }

  // MyFormulari
  if (pathname.startsWith('/formulari') || pathname.startsWith('/hub/formulari')) {
    return { name: 'MyFormulari', code: 'formulari' }
  }

  // MyCrossBorder
  if (pathname.startsWith('/crossborder')) {
    return { name: 'MyCrossBorder', code: 'crossborder' }
  }

  // MySuhu
  if (pathname.startsWith('/suhu')) {
    return { name: 'MySuhu', code: 'suhu' }
  }

  // MyKunci
  if (pathname.startsWith('/kunci')) {
    return { name: 'MyKunci', code: 'kunci' }
  }

  // MyStaff
  if (pathname.startsWith('/staff') || pathname.startsWith('/hub/staff')) {
    return { name: 'MyStaff', code: 'staff' }
  }

  // MyPerolehan
  if (pathname.startsWith('/perolehan') || pathname.startsWith('/hub/perolehan')) {
    return { name: 'MyPerolehan', code: 'perolehan' }
  }


  // Medical Oxygen / MyCylinder
  if (pathname.startsWith('/pharmacy/oxygen')) {
    return { name: 'MyCylinder', code: 'cylinder' }
  }

  // MyInventory
  if (pathname.startsWith('/pharmacy/inventory')) {
    return { name: 'MyInventory', code: 'inventory' }
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

  // Porter
  if (pathname.startsWith('/porter') || pathname.startsWith('/hub/porter')) {
    const module = MODULE_DEFINITIONS.find(m => m.code === 'system_porter')
    return { name: module?.name || 'MyPorter', code: 'system_porter' }
  }

  // Transporter
  if (pathname.startsWith('/transporter') || pathname.startsWith('/hub/transporter')) {
    const module = MODULE_DEFINITIONS.find(m => m.code === 'system_transporter')
    return { name: module?.name || 'MyTransporter', code: 'system_transporter' }
  }

  // MyPHiS
  if (pathname.startsWith('/hub/myphis') || pathname.includes('/myphis')) {
    return { name: 'MyPHiS', code: 'myphis' }
  }

  // MyMSDS
  if (pathname.startsWith('/hub/mymsds') || pathname.includes('/mymsds')) {
    return { name: 'MyMSDS', code: 'mymsds' }
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
    SYSTEM_ROLES.ASSISTANT_PHARMACIST,
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
  const { t } = useLanguage()

  // Determine current module
  const currentModule = useMemo(() => {
    const routeModule = getCurrentModule(location.pathname)
    if (routeModule) return routeModule

    // Check if we came from a specific module via navigation state (e.g. from profile click)
    const state = location.state as any
    if (state && typeof state === 'object' && state.fromModule) {
      return state.fromModule
    }

    return { name: getModuleFromRole(user?.role?.role_code) || 'HOME System', code: undefined }
  }, [location.pathname, location.state, user?.role?.role_code])

  // Get role display name
  const roleDisplayName = useMemo(() => {
    const roleCode = user?.role?.role_code
    if (!roleCode) return 'User'

    return ROLE_DISPLAY_NAMES[roleCode] || user?.role?.role_name || 'User'
  }, [user?.role])

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 text-white z-40 shadow-2xl shadow-slate-950/40">
      <div className="h-16 sm:h-20 lg:h-24 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Side - Branding */}
        <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-6 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors flex-shrink-0"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Jata Negara & Branding - Clickable to return home */}
          <div 
            className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 cursor-pointer group min-w-0"
            onClick={() => navigate('/')}
            title="Return to Landing Page"
          >
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src="/512px-Jata_MalaysiaV2.svg.png"
                alt="Jata Negara"
                className="relative w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain flex-shrink-0 group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              />
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent group-hover:from-white group-hover:to-teal-300 transition-all duration-300 whitespace-nowrap">
                  H.O.M.E.
                </h1>
              </div>
              <p className="hidden md:block text-[11px] lg:text-xs text-slate-300 font-medium leading-tight tracking-wide group-hover:text-white transition-colors truncate">
                Hospital Operation & Management Ecosystem
              </p>
              <p className="hidden md:block text-[9px] lg:text-[10px] text-teal-400/90 font-semibold leading-tight mt-0.5 uppercase tracking-[0.15em] truncate">
                {t('system.ministry', 'MINISTRY OF HEALTH MALAYSIA')}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-10 bg-slate-800/80 mx-1 flex-shrink-0" />

          {/* Module & Role Info */}
          <div className="hidden xl:flex flex-col gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">MODULE:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/25 shadow-[0_0_12px_rgba(20,184,166,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse mr-1.5" />
                {currentModule.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ROLE:</span>
              <span className="text-xs font-semibold text-slate-200 bg-slate-800/70 px-2.5 py-0.5 rounded-md border border-slate-700/60 truncate max-w-[180px]">
                {roleDisplayName}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-2.5 lg:gap-3 flex-shrink-0">
          {/* Home / Landing Page */}
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
            title="Return to Landing Page"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Search - Hidden on mobile */}
          <button className="hidden sm:block p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-1.5 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1 right-1 sm:top-2 sm:right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          </button>

          {/* Language Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-0.5 flex-shrink-0">
            <LanguageSelector variant="header" />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-slate-800/80 flex-shrink-0" />

          {/* User Profile Trigger */}
          <button
            onClick={() => navigate(ROUTES.PROFILE, { state: { fromModule: currentModule } })}
            className="flex items-center gap-2 sm:gap-3 hover:bg-slate-900/90 border border-transparent hover:border-slate-800 rounded-xl px-1.5 sm:px-2.5 py-1.5 transition-all duration-200 group flex-shrink-0"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                {user?.full_name}
              </p>
              <p className="text-[11px] text-slate-400">
                {user?.hospital?.hospital_name || 'Hospital'}
              </p>
            </div>
            <Avatar
              src={user?.profile_photo_url}
              name={user?.full_name}
              size="sm"
              className="w-7 h-7 sm:w-10 sm:h-10 ring-2 ring-teal-500/30 group-hover:ring-teal-400/60 transition-all duration-200 flex-shrink-0"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

