// src/modules/mystaff/components/AuditLogDrawer.tsx
// Comprehensive Audit Trail & History Viewer for MyStaff Module (Reminders & Movements)

import React, { useState, useEffect, useMemo } from 'react'
import {
  History,
  Search,
  Calendar,
  Clock,
  User,
  Trash2,
  Edit3,
  PlusCircle,
  CheckCircle2,
  Filter,
  ShieldCheck,
  FileText,
  Briefcase,
  Bell,
  X
} from 'lucide-react'
import { SlideOver, Badge } from '@/components/ui'
import { getStaffAuditLogs } from '@/modules/mystaff/services/staffService'
import type { StaffAuditLog, AuditModuleType, AuditActionType } from '@/shared/types/mystaff'

interface AuditLogDrawerProps {
  isOpen: boolean
  onClose: () => void
  defaultModule?: AuditModuleType | 'ALL'
  title?: string
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  defaultModule = 'ALL',
  title = 'Log Audit & Sejarah Pindaan Rasmi'
}) => {
  const [logs, setLogs] = useState<StaffAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string>(defaultModule)
  const [selectedAction, setSelectedAction] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      const res = await getStaffAuditLogs()
      if (res.data) setLogs(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadLogs()
      if (defaultModule) setSelectedModule(defaultModule)
    }
  }, [isOpen, defaultModule])

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (selectedModule !== 'ALL' && l.module !== selectedModule) return false
      if (selectedAction !== 'ALL' && l.action !== selectedAction) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = l.record_title?.toLowerCase().includes(q)
        const matchReason = l.reason?.toLowerCase().includes(q)
        const matchActor = l.actor_name?.toLowerCase().includes(q)
        if (!matchTitle && !matchReason && !matchActor) return false
      }
      return true
    })
  }, [logs, selectedModule, selectedAction, searchQuery])

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'DELETE':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <Trash2 className="w-3 h-3 text-rose-700" />,
          label: 'PEMADAMAN'
        }
      case 'EDIT':
        return {
          bg: 'bg-amber-100 text-amber-950 border-amber-300',
          icon: <Edit3 className="w-3 h-3 text-amber-700" />,
          label: 'PINDAAN DATA'
        }
      case 'CREATE':
        return {
          bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
          icon: <PlusCircle className="w-3 h-3 text-emerald-700" />,
          label: 'PENDAFTARAN'
        }
      case 'STATUS_CHANGE':
        return {
          bg: 'bg-purple-100 text-purple-950 border-purple-300',
          icon: <CheckCircle2 className="w-3 h-3 text-purple-700" />,
          label: 'STATUS SELESAI'
        }
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <History className="w-3 h-3 text-slate-600" />,
          label: action
        }
    }
  }

  const getModuleBadge = (module: AuditModuleType) => {
    switch (module) {
      case 'MOVEMENT':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          label: 'Pergerakan Staf',
          icon: <Briefcase className="w-3 h-3 text-teal-600" />
        }
      case 'REMINDER':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          label: 'Log Event / CME',
          icon: <Bell className="w-3 h-3 text-purple-600" />
        }
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: module,
          icon: <FileText className="w-3 h-3 text-slate-500" />
        }
    }
  }

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title={title}
      description="Jejak audit penuh merekodkan siapa, bila dan mengapa sesuatu rekod dipinda atau dipadam bagi tujuan ketelusan & integriti data."
    >
      <div className="p-6 md:p-8 space-y-6 text-slate-800 pb-20">
        {/* Top Filter and Search Bar */}
        <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sebab, pegawai, tajuk acara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          {/* Module Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Modul:</span>
            {[
              { id: 'ALL', label: 'Semua Modul' },
              { id: 'REMINDER', label: 'Log Event / CME' },
              { id: 'MOVEMENT', label: 'Pergerakan Staf' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedModule === m.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Action Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Tindakan:</span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'EDIT', label: 'Pindaan', dot: 'bg-amber-500' },
              { id: 'DELETE', label: 'Pemadaman', dot: 'bg-rose-500' }
            ].map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAction(a.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  selectedAction === a.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {a.dot && <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />}
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Jumlah Rekod Audit: {filteredLogs.length}</span>
            <span className="text-[11px] text-slate-400">Susunan: Terkini ke Terawal</span>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
              <p className="text-xs font-bold text-slate-600">Memuatkan rekod audit...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">Tiada rekod audit ditemui</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Sebarang pindaan atau pemadaman rekod akan direkodkan di sini secara automatik.
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const actBadge = getActionBadge(log.action)
              const modBadge = getModuleBadge(log.module)
              const date = new Date(log.created_at)

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3 relative overflow-hidden"
                >
                  {/* Top Bar: Action Badge + Module Tag + Timestamp */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${actBadge.bg}`}>
                        {actBadge.icon}
                        <span>{actBadge.label}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${modBadge.bg}`}>
                        {modBadge.icon}
                        <span>{modBadge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px] font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {date.toLocaleDateString('ms-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}{' '}
                        •{' '}
                        {date.toLocaleTimeString('ms-MY', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Record Title */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tajuk Rekod Terlibat:
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      "{log.record_title}"
                    </h4>
                  </div>

                  {/* Reason Callout Box */}
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    log.action === 'DELETE'
                      ? 'bg-rose-50/50 border-rose-200/80 text-rose-950'
                      : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sebab / Justifikasi Rasmi:</span>
                    </div>
                    <p className="font-semibold italic">"{log.reason}"</p>
                  </div>

                  {/* Actor Strip */}
                  <div className="flex items-center justify-between gap-3 pt-1 text-xs border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                        {log.actor_name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs">
                          {log.actor_name}
                        </span>
                        {log.actor_role && (
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({log.actor_role})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {log.id.slice(-6)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </SlideOver>
  )
}
