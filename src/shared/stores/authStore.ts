import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserWithRelations } from '@/types'

interface AuthState {
  user: UserWithRelations | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpiresAt: number | null
  
  // Actions
  setUser: (user: UserWithRelations | null) => void
  setLoading: (isLoading: boolean) => void
  login: (user: UserWithRelations) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  checkSession: () => boolean
  extendSession: () => void
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
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiresAt: null,
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
    }),
    {
      name: 'home-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
    }
  )
)

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)

