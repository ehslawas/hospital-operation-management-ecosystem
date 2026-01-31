import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/routes'
import { ToastContainer, Toaster } from '@/components/ui'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/services/supabase'
import { queryClient } from '@/lib/queryClient'
import { ReloadPrompt } from '@/components/ReloadPrompt'

function App() {
  const { setLoading, checkSession, logout, setSupabaseSessionReady } = useAuthStore()

  useEffect(() => {
    // OPTIMISTIC SESSION INITIALIZATION
    // Performance fix: Set session ready IMMEDIATELY if we have persisted user data.
    // This allows all 50+ pages to start fetching data without waiting for Supabase.
    // Background verification still happens to handle expired sessions gracefully.

    const initAuth = async () => {
      try {
        console.log('[App] Initializing auth...')

        // Get current persisted state
        const { user, isAuthenticated } = useAuthStore.getState()

        // 1. Check local session validity (expiry time)
        const isLocalSessionValid = checkSession()

        // IMMEDIATE: If we have valid persisted auth, allow pages to fetch immediately
        if (isAuthenticated && user?.hospital_id && isLocalSessionValid) {
          console.log('[App] Local session valid, setting session ready immediately')
          setSupabaseSessionReady(true)
          setLoading(false)
        } else {
          // If local session invalid, we might still want to try Supabase check,
          // but usually we can just assume logged out if local is expired.
          if (!isAuthenticated) {
            setLoading(false)
            setSupabaseSessionReady(true) // Ready as "guest"
          }
        }

        // 2. Background verification with Supabase (FIRE AND FORGET)
        // We do NOT await this. It runs in parallel.
        console.log('[App] Starting background Supabase session verification...')

        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.error('[App] Background session check warning:', error.message)
            // If it's a timeout or network error, we TRUST our local session
            // We only logout if it's a clear "Invalid Session" error from Supabase
            if (error.message.includes('refresh_token_not_found') || error.message.includes('invalid_grant')) {
              console.warn('[App] Critical session error, logging out')
              logout()
              setSupabaseSessionReady(true)
            }
            return
          }

          if (!session) {
            // No session on server, but we thought we were logged in?
            if (isLocalSessionValid && isAuthenticated) {
              console.warn('[App] Supabase says no session, but local is valid. Potential sync issue.')
              // Optional: enforce logout here, or trust local until next explicit failure
              // For now, let's trust Supabase authoritative state if it returns successfully with null
              console.log('[App] Clearing invalid local session')
              logout()
            }
          } else {
            console.log('[App] Supabase session verified in background')
            // If we weren't ready yet (e.g. cold start with no local state), mark ready now
            if (!useAuthStore.getState().supabaseSessionReady) {
              setSupabaseSessionReady(true)
            }
          }
        }).catch(err => {
          console.error('[App] Unexpected background auth error:', err)
          // Swallow error, don't crash app
        })

      } catch (error) {
        console.error('[App] Auth initialization error:', error)
        setSupabaseSessionReady(true)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [checkSession, setLoading, logout, setSupabaseSessionReady])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        <ToastContainer />
        <Toaster />
        <ReloadPrompt />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
