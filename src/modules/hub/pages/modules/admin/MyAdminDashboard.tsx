import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  Activity,
  UserCheck,
  Users,
  Building2,
  Lock,
  Settings
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui'

// Sub-components import
import { AdminOverviewTab } from './AdminOverviewTab'
import { AdminApprovalsTab } from './AdminApprovalsTab'
import { AdminUsersTab } from './AdminUsersTab'
import { AdminDepartmentsTab } from './AdminDepartmentsTab'
import { AdminRbacTab } from './AdminRbacTab'

export const MyAdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('overview')

  const { user } = useAuthStore()

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: Activity },
    { id: 'approvals', label: 'Kelulusan Akses', icon: UserCheck },
    { id: 'users', label: 'Urus Pengguna', icon: Users },
    { id: 'departments', label: 'Pemantauan Jabatan', icon: Building2 },
    { id: 'rbac', label: 'Had Kuasa (RBAC)', icon: Lock }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab onTabChange={setActiveTab} />
      case 'approvals':
        return <AdminApprovalsTab />
      case 'users':
        return <AdminUsersTab />
      case 'departments':
        return <AdminDepartmentsTab />
      case 'rbac':
        return <AdminRbacTab />
      default:
        return <AdminOverviewTab onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Back Button & Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(ROUTES.HUB)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors mb-4 group text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Hub Utama</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">MyAdmin</h1>
              <p className="text-slate-400 text-xs mt-0.5">Control Center & System Administration</p>
            </div>
          </div>
        </div>

        {/* Action controls & Dynamic decorative logo/badge */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {user?.role?.role_code === 'system_admin' && (
            <Button
              onClick={() => navigate(ROUTES.ADMIN_MODULES)}
              variant="outline"
              size="sm"
              className="border-teal-500/30 hover:border-teal-500 text-teal-400 hover:text-teal-300 bg-teal-500/5 hover:bg-teal-500/10 flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-teal-400" />
              <span>System Admin Console</span>
            </Button>
          )}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 font-mono">KKM SECURITY ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Tabs Header bar */}
      <div className="border-b border-white/5 flex overflow-x-auto no-scrollbar scroll-smooth gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap outline-none focus:outline-none select-none text-slate-400 hover:text-white"
            >
              <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Active Tab View wrapper */}
      <div className="pt-2">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {renderActiveTab()}
        </motion.div>
      </div>
    </div>
  )
}

export default MyAdminDashboard
