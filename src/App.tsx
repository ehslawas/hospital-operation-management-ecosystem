import React, { useEffect } from 'react'
import { AppRouter } from '@/routes'
import { ToastContainer } from '@/components/ui'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthStore } from '@/stores/authStore'

function App() {
  const { setLoading, checkSession, logout } = useAuthStore()

  useEffect(() => {
    // Check if there's an existing session
    const initAuth = async () => {
      try {
        // Check session validity
        const isValid = checkSession()
        if (!isValid) {
          // Session expired or invalid, ensure user is logged out
          logout()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // On error, ensure loading is set to false
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [checkSession, setLoading, logout])

  return (
    <ErrorBoundary>
      <AppRouter />
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App

