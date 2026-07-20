import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  Building2,
  ShieldAlert,
  ArrowRight,
  Database,
  ShieldCheck,
  Activity,
  Settings
} from 'lucide-react'
import { getAccessRequests } from '@/services/accessRequestManagementService'
import { getUsers } from '@/services/userService'
import { getRoles } from '@/services/roleService'
import { getDepartments } from '@/services/departmentService'
import { getAuditLogs } from '@/services/auditLogService'
import { formatDate } from '@/lib/utils'
import type { AuditLogWithRelations } from '@/types'

interface AdminOverviewTabProps {
  onTabChange: (tabId: string) => void
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ onTabChange }) => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalUsers: 0,
    totalDepartments: 0,
    totalRoles: 0
  })
  const [recentLogs, setRecentLogs] = useState<AuditLogWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoading(true)
      try {
        const [requestsRes, usersRes, rolesRes, deptsRes, logsRes] = await Promise.all([
          getAccessRequests({ page: 1, pageSize: 1, status: 'pending' }),
          getUsers({ page: 1, pageSize: 1 }),
          getRoles({ page: 1, pageSize: 1 }),
          getDepartments({ page: 1, pageSize: 1 }),
          getAuditLogs({ page: 1, pageSize: 5 })
        ])

        setStats({
          pendingRequests: requestsRes.total || 0,
          totalUsers: usersRes.total || 0,
          totalDepartments: deptsRes.total || 0,
          totalRoles: rolesRes.total || 0
        })

        setRecentLogs(logsRes.data || [])
      } catch (error) {
        console.error('Error loading overview stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  }

  const statCards = [
    {
      id: 'approvals',
      title: 'Permohonan Akses (Pending)',
      value: stats.pendingRequests,
      desc: 'Awaiting registration review',
      icon: UserCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
      action: () => onTabChange('approvals')
    },
    {
      id: 'users',
      title: 'Jumlah Pengguna',
      value: stats.totalUsers,
      desc: 'Active accounts inside ecosystem',
      icon: Users,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
      action: () => onTabChange('users')
    },
    {
      id: 'departments',
      title: 'Bilangan Jabatan',
      value: stats.totalDepartments,
      desc: 'Hospital clinical departments',
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      action: () => onTabChange('departments')
    },
    {
      id: 'rbac',
      title: 'Peranan RBAC',
      value: stats.totalRoles,
      desc: 'Security permission configurations',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      action: () => onTabChange('rbac')
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome & System State banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-white/5 relative overflow-hidden"
      >
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-xl font-bold text-white mb-2">MyAdmin Control Panel</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Welcome to the Hospital Operations administrative backbone. From here, you can orchestrate user identities, verify registration requests under KKM regulations, audit access control levels, and configure module RLS settings.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 hidden lg:block">
          <Settings className="w-36 h-36 animate-spin-slow text-teal-400" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.id}
              variants={itemVariants}
              onClick={card.action}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`p-6 rounded-2xl bg-slate-900/50 backdrop-blur-xl border ${card.border} cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-slate-950/50`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-slate-500 hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                {isLoading ? (
                  <div className="h-9 w-12 bg-white/5 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                    {card.value}
                  </p>
                )}
                <h3 className="text-sm font-semibold text-slate-200">{card.title}</h3>
                <p className="text-xs text-slate-400 font-medium">{card.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Grid: Audit Log + Quick Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Logs (Left 2 columns) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              Jejak Audit Aktiviti (Recent Audit Logs)
            </h3>
            <button
              onClick={() => onTabChange('users')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors"
            >
              View Users List <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5">
            {isLoading ? (
              <div className="p-12 space-y-4">
                <div className="h-5 bg-white/5 rounded w-full animate-pulse" />
                <div className="h-5 bg-white/5 rounded w-11/12 animate-pulse" />
                <div className="h-5 bg-white/5 rounded w-10/12 animate-pulse" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No recent system activity logged.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Staff / Pengguna</th>
                    <th className="p-4">Modul</th>
                    <th className="p-4">Aktiviti (Action)</th>
                    <th className="p-4 text-right">Tarikh & Masa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 text-sm font-medium">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="text-white text-sm font-semibold">
                            {log.user?.full_name || 'System / Batch'}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {log.user?.employee_id || 'AUTO'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-white/5 capitalize">
                          {log.module?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-right text-xs text-slate-400 font-mono">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Operations Panel (Right 1 column) */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
              <Database className="w-5 h-5 text-indigo-400" />
              Tindakan Segera (Quick Operations)
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => onTabChange('approvals')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left group"
              >
                <div>
                  <div className="text-white text-sm font-semibold group-hover:text-teal-400 transition-colors">
                    Semakan Kelulusan
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Review and activate pending staff requests
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onTabChange('rbac')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left group"
              >
                <div>
                  <div className="text-white text-sm font-semibold group-hover:text-emerald-400 transition-colors">
                    Matriks Kebenaran (RBAC)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Audit and toggle role capability switches
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onTabChange('users')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left group"
              >
                <div>
                  <div className="text-white text-sm font-semibold group-hover:text-cyan-400 transition-colors">
                    Kemaskini Peranan Ahli
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Assign departments and set account status
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Nota Keselamatan
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Sistem HOME merekodkan setiap kelulusan peranan dan audit log secara kekal. Pastikan kelayakan kakitangan disemak dengan teliti berdasarkan jawatan rasmi KKM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
