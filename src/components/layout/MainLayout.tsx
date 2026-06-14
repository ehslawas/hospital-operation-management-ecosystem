import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { sidebarCollapsed } = useSidebar()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - Full width at top */}
      <Header />

      {/* Sidebar - Below header */}
      <Sidebar />

      {/* Main Content - Padded to the left on desktop for the static sidebar */}
      <div className="flex-1 flex flex-col lg:pl-[280px] pt-20 sm:pt-28 min-h-screen">
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}

export default MainLayout

