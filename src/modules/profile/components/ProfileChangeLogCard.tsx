// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, RefreshCw, ArrowRight, ShieldCheck, UserCheck, Camera, Lock, Key, Clock, FileText } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { getUserProfileAuditLogs, type ProfileAuditLogItem } from '../services/profileService'
import { formatDate } from '@/lib/utils'

interface ProfileChangeLogCardProps {
  userId: string
  refreshTrigger?: number
}

function formatLogDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

function getActionMeta(action: string): { label: string; variant: string; icon: any } {
  const norm = (action || '').toUpperCase()
  if (norm.includes('UPDATE_PROFILE_PHOTO') || norm.includes('PHOTO')) {
    return { label: 'Photo Updated', variant: 'info', icon: Camera }
  }
  if (norm.includes('REMOVE_PROFILE_PHOTO')) {
    return { label: 'Photo Removed', variant: 'warning', icon: Camera }
  }
  if (norm.includes('PASSWORD')) {
    return { label: 'Password Changed', variant: 'success', icon: Lock }
  }
  if (norm.includes('LOGIN')) {
    return { label: 'User Login', variant: 'default', icon: Key }
  }
  if (norm.includes('UPDATE_PROFILE') || norm.includes('UPDATE')) {
    return { label: 'Profile Updated', variant: 'primary', icon: UserCheck }
  }
  return { label: action.replace(/_/g, ' '), variant: 'default', icon: FileText }
}

export const ProfileChangeLogCard: React.FC<ProfileChangeLogCardProps> = ({
  userId,
  refreshTrigger = 0,
}) => {
  const [logs, setLogs] = useState<ProfileAuditLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchLogs = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true)
    try {
      const data = await getUserProfileAuditLogs(userId)
      setLogs(data)
    } catch (err) {
      console.error('Failed to load profile audit logs:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [userId, refreshTrigger])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Change History & Activity Log</h3>
            <p className="text-xs text-gray-500">
              Audit trail of your recent profile updates and account security actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {logs.length} {logs.length === 1 ? 'event' : 'events'}
          </span>
          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing || isLoading}
            title="Refresh logs"
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Spinner size="md" />
          <p className="text-xs">Loading activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 px-4 text-center bg-slate-50 border border-slate-200/60 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">No profile changes recorded yet</p>
          <p className="text-xs text-slate-500 mt-0.5">
            When you update your photo or personal information, details will be audited and logged here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
          <AnimatePresence>
            {logs.map((log, index) => {
              const meta = getActionMeta(log.action)
              const Icon = meta.icon

              return (
                <motion.div
                  key={log.id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="py-3.5 first:pt-1 last:pb-1 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
                        <Icon className="w-3.5 h-3.5 text-primary-600" />
                        {meta.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Module: {log.module || 'profile'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="tabular-nums">{formatLogDate(log.created_at)}</span>
                    </div>
                  </div>

                  {/* Changes List */}
                  {log.changes && log.changes.length > 0 ? (
                    <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5 space-y-1.5 text-xs">
                      {log.changes.map((ch, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 flex-wrap text-slate-700"
                        >
                          <span className="font-semibold text-slate-600 min-w-[110px]">
                            {ch.label}:
                          </span>
                          <div className="flex items-center gap-2 flex-1 justify-end font-mono">
                            <span className="text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded line-through max-w-[200px] truncate">
                              {String(ch.oldValue)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded font-semibold max-w-[220px] truncate">
                              {String(ch.newValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 pl-1">
                      Event recorded: <span className="font-medium">{log.action}</span>
                    </p>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default ProfileChangeLogCard
