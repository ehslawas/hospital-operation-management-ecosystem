import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { ToastContainer } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/constants'

export const HubLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-teal-500 font-medium">Memuatkan sistem...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
      {/* Background elements to match the login theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {/* Global Footer for Hub */}
        <footer className="py-6 px-8 text-center text-slate-500 text-sm border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
          <p>© {new Date().getFullYear()} Kementerian Kesihatan Malaysia. Hospital Operation Management Ecosystem.</p>
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}

export default HubLayout
