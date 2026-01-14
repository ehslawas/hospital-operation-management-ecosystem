import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserWithRelations } from '@/types'

interface AuthState {
  user: UserWithRelations | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpiresAt: number | null
  activeRoleCode: string | null

  // Actions
  setUser: (user: UserWithRelations | null) => void
  setLoading: (isLoading: boolean) => void
  login: (user: UserWithRelations) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  checkSession: () => boolean
  extendSession: () => void
  setActiveRoleCode: (roleCode: string | null) => void
}

// Session duration in milliseconds (Phase 9: Security - 30 minute timeout)
const SESSION_DURATION = 30 * 60 * 1000

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionExpiresAt: null,
      activeRoleCode: null,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      login: (user) => {
        const expiresAt = Date.now() + SESSION_DURATION
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiresAt: expiresAt,
        })

        // Load menus for the user with proper context
        import('@/stores/menuStore').then(({ useMenuStore }) => {
          // Determine department context based on user's role
          const roleCode = user.role?.role_code
          let deptContext: string | undefined = undefined

          // Pharmacy roles get pharmacy context
          if (roleCode && [
            'pharmacy_director', 'pharmacy_manager', 'pharmacist',
            'pharmacy_assistant', 'pharmacy_storekeeper', 'pharmacy_staff'
          ].includes(roleCode)) {
            deptContext = 'pharmacy_logistics'
          }
          // Admin roles get admin context
          else if (roleCode === 'hospital_admin' || roleCode === 'system_admin') {
            deptContext = 'hospital_admin'
          }

          useMenuStore.getState().fetchMenus(user.id, { departmentCode: deptContext })
        })
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiresAt: null,
          activeRoleCode: null, // Clear view mode on logout
        })

        // Clear menus on logout
        import('@/stores/menuStore').then(({ useMenuStore }) => {
          useMenuStore.getState().clearMenus()
        })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          })
        }
      },

      checkSession: () => {
        const { sessionExpiresAt, isAuthenticated } = get()
        if (!isAuthenticated || !sessionExpiresAt) return false

        if (Date.now() > sessionExpiresAt) {
          get().logout()
          return false
        }

        return true
      },

      extendSession: () => {
        const { isAuthenticated } = get()
        if (isAuthenticated) {
          set({
            sessionExpiresAt: Date.now() + SESSION_DURATION,
          })
        }
      },

      setActiveRoleCode: (activeRoleCode) => {
        set({ activeRoleCode })

        // Trigger menu re-fetch with simulated context
        const user = get().user
        if (user) {
          import('@/stores/menuStore').then(({ useMenuStore }) => {
            // Infer department based on role for better simulation
            let simulatedDept = undefined

            if (activeRoleCode && [
              'pharmacy_director',
              'pharmacy_manager',
              'pharmacist',
              'pharmacy_assistant',
              'pharmacy_storekeeper',
              'pharmacy_staff'
            ].includes(activeRoleCode)) {
              simulatedDept = 'pharmacy_logistics'
            }

            // If switching back to Admin, we want to ensure we see Hospital Admin menus
            if (activeRoleCode === 'hospital_admin' || activeRoleCode === 'system_admin' || !activeRoleCode) {
              simulatedDept = 'hospital_admin'
            }

            useMenuStore.getState().fetchMenus(user.id, {
              roleCode: activeRoleCode || undefined,
              departmentCode: simulatedDept
            })
          })
        }
      },
    }),
    {
      name: 'home-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiresAt: state.sessionExpiresAt,
        activeRoleCode: state.activeRoleCode,
      }),
    }
  )
)

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)

