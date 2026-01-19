import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/routes'
import { ToastContainer } from '@/components/ui'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/services/supabase'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const { setLoading, checkSession, logout, setSupabaseSessionReady } = useAuthStore()

  useEffect(() => {
    // Verify Supabase session on app initialization
    // This is critical: the persisted Zustand state may say "authenticated"
    // but Supabase session may not be ready yet (e.g., after page refresh)
    const initAuth = async () => {
      try {
        console.log('[App] Initializing auth and verifying Supabase session...')

        // 1. Check local session validity (expiry time)
        const isLocalSessionValid = checkSession()
        if (!isLocalSessionValid) {
          console.log('[App] Local session expired or invalid, logging out')
          logout()
          setSupabaseSessionReady(true) // Session is "ready" (user is logged out)
          return
        }

        // 2. Verify with Supabase that the session is actually valid
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[App] Supabase session error:', error)
          logout()
          setSupabaseSessionReady(true)
          return
        }

        if (!session) {
          // No active Supabase session, but local store says authenticated
          // This means session expired on Supabase side
          console.log('[App] No Supabase session found, clearing local state')
          logout()
          setSupabaseSessionReady(true)
          return
        }

        // 3. Session is valid on both sides
        console.log('[App] Supabase session verified successfully for user:', session.user.id)
        setSupabaseSessionReady(true)

      } catch (error) {
        console.error('[App] Auth initialization error:', error)
        setSupabaseSessionReady(true) // Even on error, mark as "ready" so UI doesn't hang
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
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
