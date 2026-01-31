import React, { useMemo, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useMenus, useMenusLoading, useMenuStore, useIsMenusInitialized } from '@/stores/menuStore'
import { useSidebar } from '@/stores/uiStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { Avatar, LoadingOverlay } from '@/components/ui'
import { getIconComponent } from '@/lib/iconMapper'
import { ROLE_DISPLAY_NAMES } from '@/lib/constants'
import type { MenuItem } from '@/stores/menuStore'

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, logout: authLogout } = useAuthStore()
  const menus = useMenus()
  const menusLoading = useMenusLoading()
  const menusError = useMenuStore((state) => state.error)
  const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useSidebar()
  const isMobile = useIsMobile(1024)


  // Debug menus
  useEffect(() => {
    if (menus.length > 0) {
      console.log('[Sidebar] Current Menus Logic Path:')
      console.table(menus.map(m => ({
        label: m.label,
        path: m.path,
        hasChildren: m.children && m.children.length > 0,
        isHeader: !!m.isHeader
      })))

      // Also log the first level of children for the header
      if (menus[0].children) {
        console.log('[Sidebar] Header Children:')
        console.table(menus[0].children.map(m => ({
          label: m.label,
          path: m.path,
          hasChildren: m.children && m.children.length > 0
        })))
      }
    }
  }, [menus])

  // Auto-fetch menus on mount if empty but user logged in AND Supabase session is ready
  const supabaseSessionReady = useAuthStore((state) => state.supabaseSessionReady)
  const menusInitialized = useIsMenusInitialized()

  useEffect(() => {
    // CRITICAL: Wait for Supabase session to be verified before fetching menus
    // This prevents the race condition where we try to fetch menus before auth.uid() is available
    if (!supabaseSessionReady) {
      console.log('[Sidebar] Waiting for Supabase session to be verified...')
      return
    }

    // Fix: Only auto-fetch if NOT initialized and NOT loading
    // We removed !menusError check so that we don't block retries if error state is cleared elsewhere
    // but typically if there is an error, we show the error UI instead of auto-fetching loop
    if (user?.id && !menusInitialized && !menusLoading) {
      console.log('[Sidebar] Supabase session ready, triggering initial menu fetch')

      // Determine department context based on user's role
      const roleCode = user.role?.role_code
      let deptContext: string | undefined = undefined

      // Simple, robust context determination
      if (roleCode) {
        const r = roleCode.toLowerCase()
        if (r === 'pharmacist' || r === 'assistant_pharmacist') {
          deptContext = 'pharmacy_logistics'
        } else if (r === 'hospital_admin') {
          deptContext = 'hospital_admin'
        } else if (r === 'system_admin') {
          deptContext = 'system_admin'
        }
      }

      useMenuStore.getState().fetchMenus(user.id, {
        departmentCode: deptContext,
        user: user
      })
    }
  }, [user?.id, menusInitialized, menusLoading, supabaseSessionReady]) // Fixed: Removed menus.length and menusError to prevent loops

  const handleLogout = async () => {
    console.log('Logout clicked')
    try {
      await authLogout()
      console.log('Logout successful')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Memoize current pathname to prevent unnecessary recalculations
  const currentPath = useMemo(() => location.pathname, [location.pathname])

  // State to track expanded menu items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Helper function to check if any child or nested child is active
  const hasActiveChild = React.useCallback((item: MenuItem): boolean => {
    if (!item.children || item.children.length === 0) return false
    return item.children.some((child) => {
      const childIsActive = currentPath === child.path || currentPath.startsWith(child.path + '/')
      return childIsActive || hasActiveChild(child)
    })
  }, [currentPath])

  // Auto-expand items with active children on mount and path change
  useEffect(() => {
    const newExpanded = new Set<string>()

    const checkAndExpand = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          if (hasActiveChild(item)) {
            newExpanded.add(item.id)
          }
          checkAndExpand(item.children)
        }
      })
    }

    checkAndExpand(menus)
    setExpandedItems(newExpanded)
  }, [currentPath, menus, hasActiveChild])

  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const isExpanded = React.useCallback((id: string) => expandedItems.has(id), [expandedItems])

  const renderNavItem = React.useCallback((item: MenuItem, depth = 0) => {
    const Icon = getIconComponent(item.icon)
    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
    const hasChildren = item.children && item.children.length > 0
    const expanded = hasChildren && isExpanded(item.id)
    const hasActive = hasActiveChild(item)

    // Indentation based on depth (though wrapper handles most, precise padding helps)
    // Indentation based on depth (though wrapper handles most, precise padding helps)

    if (item.isHeader) {
      return (
        <div key={item.id} className="mb-6">
          <div className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-2xl text-base font-semibold tracking-tight transition-all duration-300',
            'text-royal-blue bg-gradient-to-r from-blue-50/50 via-white/50 to-transparent border border-blue-100/50 shadow-sm glass',
            sidebarCollapsed && 'justify-center border-none bg-none shadow-none px-0'
          )}>
            <div className="p-2 rounded-xl bg-white shadow-sm border border-blue-100">
              <Icon className="w-5 h-5 text-royal-blue" />
            </div>
            {!sidebarCollapsed && (
              <span className="flex-1 truncate">{item.label}</span>
            )}
          </div>
          {!sidebarCollapsed && item.children && item.children.length > 0 && (
            <div className="mt-4 space-y-1">
              {item.children.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
          {sidebarCollapsed && item.children && item.children.length > 0 && (
            <div className="mt-2 space-y-2 flex flex-col items-center">
              {item.children.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group',
              isActive || hasActive
                ? 'text-royal-blue bg-gradient-to-r from-blue-50 to-blue-50/20 border border-blue-100/50 shadow-sm'
                : 'text-slate-600 hover:text-royal-blue hover:bg-slate-50 border border-transparent',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <Icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-colors",
              isActive || hasActive ? "text-royal-blue" : "text-slate-400 group-hover:text-royal-blue"
            )} />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive || hasActive ? "text-royal-blue" : "text-slate-400 group-hover:text-royal-blue"
                  )} />
                </motion.div>
              </>
            )}
          </button>

          {!sidebarCollapsed && (
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
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
        key={item.id}
        to={item.path}
        onClick={() => console.log('[Sidebar] Navigating to:', item.path, 'Label:', item.label)}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group',
            isActive
              ? 'text-royal-blue bg-gradient-to-r from-blue-50 to-blue-50/20 border border-blue-100/50 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-royal-blue hover:bg-slate-50 border border-transparent',
            sidebarCollapsed && !isMobile && 'justify-center'
          )
        }
      >
        <Icon className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive ? "text-royal-blue" : "text-slate-400 group-hover:text-royal-blue"
        )} />
        {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
      </NavLink>
    )
  }, [currentPath, sidebarCollapsed, expandedItems, hasActiveChild, toggleExpanded, isExpanded, isMobile])

  if (!isMobile) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 glass-sidebar no-print',
          'flex flex-col z-30'
        )}
        style={{ top: '112px', height: 'calc(100vh - 112px)' }}
      >
        <SidebarContent
          menus={menus}
          menusLoading={menusLoading}
          menusError={menusError}
          renderNavItem={renderNavItem}
          user={user}
          handleLogout={handleLogout}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
      </motion.aside>
    )
  }

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              style={{ top: '112px' }}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={cn(
                'fixed left-0 bg-white border-r border-gray-200 no-print',
                'flex flex-col z-50 shadow-xl'
              )}
              style={{ top: '112px', height: 'calc(100vh - 112px)', width: 280 }}
            >
              <SidebarContent
                menus={menus}
                menusLoading={menusLoading}
                renderNavItem={renderNavItem}
                user={user}
                handleLogout={handleLogout}
                sidebarCollapsed={false}
                isMobile={isMobile}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Extracted Content Component to reuse
const SidebarContent = ({
  menus,
  menusLoading,
  menusError,
  renderNavItem,
  user,
  handleLogout,
  sidebarCollapsed,
  isMobile
}: any) => (
  <>
    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto pt-6 px-4 pb-4 space-y-1">
      {(!sidebarCollapsed || isMobile) && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Navigation Panel
        </p>
      )}

      {menusLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingOverlay message="Loading menus..." />
        </div>
      ) : menusError ? (
        <div className="p-4 text-center">
          <p className="text-sm text-red-500 font-medium mb-2">
            Error loading menus
          </p>
          <p className="text-xs text-gray-500 mb-4">{menusError}</p>
          <button
            onClick={() => {
              useMenuStore.getState().fetchMenus(user?.id, { user })
            }}
            className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : menus.length === 0 ? (
        <div className="text-center py-8 px-4">
          <p className="text-gray-500 text-sm mb-2 font-medium">No menus available</p>
          <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg break-all">
            <p>Role: {user?.role?.role_name || user?.role?.role_code}</p>
            <p>Dept: {user?.department?.department_name || user?.department?.department_code}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs text-primary-600 hover:underline"
          >
            Refresh System
          </button>
        </div>
      ) : (
        menus.map((item: any) => renderNavItem(item))
      )}
    </nav>

    {/* User Profile */}
    <div className="p-4 border-t border-gray-100">
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl bg-gray-50',
          sidebarCollapsed && !isMobile && 'justify-center'
        )}
      >
        <Avatar
          src={user?.profile_photo_url}
          name={user?.full_name}
          size="sm"
        />

        {(!sidebarCollapsed || isMobile) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role?.role_code ? (ROLE_DISPLAY_NAMES[user.role.role_code] || user.role.role_name) : ''}
            </p>
            {user?.department && (
              <p className="text-xs text-gray-400 truncate">
                {user.department.department_name}
              </p>
            )}
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
  </>
)

export default Sidebar
