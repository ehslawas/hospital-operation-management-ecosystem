import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'
import { ROUTES } from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { sidebarCollapsed } = useSidebar()
  const isMobile = useIsMobile(1024)

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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full width at top */}
      <Header />

      {/* Sidebar - Below header */}
      <Sidebar />

      {/* Main Content - Below header, with sidebar margin */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280) }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-screen flex flex-col"
        style={{ marginTop: '112px' }}
      >
        {/* Page Content */}
        <main className="flex-1 overflow-auto pt-4 md:pt-6">
          <Outlet />
        </main>
      </motion.div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}

export default MainLayout

