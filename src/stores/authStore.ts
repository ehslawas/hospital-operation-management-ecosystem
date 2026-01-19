import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'
import { SESSION_TIMEOUT_MINUTES } from '@/lib/constants'
import type { UserWithRelations } from '@/types'

const SESSION_DURATION = SESSION_TIMEOUT_MINUTES * 60 * 1000

interface AuthState {
  user: UserWithRelations | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpiresAt: number | null
  activeRoleCode: string | null
  supabaseSessionReady: boolean // NEW: Tracks if Supabase session has been verified

  // Actions
  setUser: (user: UserWithRelations | null) => void
  setLoading: (isLoading: boolean) => void
  login: (user: UserWithRelations) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  checkSession: () => boolean
  extendSession: () => void
  setActiveRoleCode: (roleCode: string | null) => void
  setSupabaseSessionReady: (ready: boolean) => void // NEW
}



export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionExpiresAt: null,
      activeRoleCode: null,
      supabaseSessionReady: false, // NEW: Starts as false, set to true after session verified

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

        // Menu loading is now handled by Sidebar component to prevent race conditions
        // and ensure consistent behavior across page reloads vs fresh logins
        console.log('[AuthStore] Login successful, session established')
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiresAt: null,
          activeRoleCode: null,
          supabaseSessionReady: false, // Reset on logout
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
              'pharmacist',
              'assistant_pharmacist'
            ].includes(activeRoleCode)) {
              simulatedDept = 'pharmacy_logistics'
            }

            // If switching back to Admin, we want to ensure we see Hospital Admin menus
            if (activeRoleCode === 'hospital_admin' || activeRoleCode === 'system_admin' || !activeRoleCode) {
              simulatedDept = 'hospital_admin'
            }

            useMenuStore.getState().fetchMenus(user.id, {
              roleCode: activeRoleCode || undefined,
              departmentCode: simulatedDept,
              user: user
            })
          })
        }
      },

      setSupabaseSessionReady: (ready) => {
        set({ supabaseSessionReady: ready })
        console.log('[AuthStore] Supabase session ready:', ready)
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

