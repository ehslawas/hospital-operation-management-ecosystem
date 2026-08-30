// src/modules/mystaff/components/AuditReasonModal.tsx
// Professional Confirmation Modal with Mandatory Reason & Audit Attribution

import React, { useState } from 'react'
import {
  AlertTriangle,
  User,
  Clock,
  Trash2,
  Edit3,
  X,
  ShieldAlert,
  CheckCircle2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui'

interface AuditReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void> | void
  title: string
  recordTitle: string
  actionType: 'DELETE' | 'EDIT'
  actorName: string
  actorRole?: string
  presetReasons?: string[]
  isLoading?: boolean
}

export const AuditReasonModal: React.FC<AuditReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  recordTitle,
  actionType,
  actorName,
  actorRole,
  presetReasons,
  isLoading = false
}) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const isDelete = actionType === 'DELETE'

  const defaultPresets = isDelete
    ? [
        'Sesi / Acara Dibatalkan',
        'Tersilap Masuk Maklumat / Rekod Bertindih',
        'Pertindihan Jadual Kerja',
        'Pegawai Ditugaskan Urusan Lain',
        'Pertukaran Tarikh & Masa Sesi'
      ]
    : [
        'Pertukaran Tarikh / Masa',
        'Pembetulan Pautan / Link Sesi',
        'Kemaskini Dokumen / Lampiran Slaid',
        'Pembetulan Nama Pegawai / Lokasi',
        'Kemaskini Tajuk & Kategori'
      ]

  const options = presetReasons || defaultPresets

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Sila nyatakan sebab / justifikasi tindakan ini (Wajib untuk rekod audit).')
      return
    }
    setError('')
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 scale-100 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Banner */}
        <div className={`p-6 border-b ${
          isDelete ? 'bg-rose-50/80 border-rose-200' : 'bg-amber-50/80 border-amber-200'
        } relative`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
              isDelete ? 'bg-rose-600 text-white shadow-md' : 'bg-amber-600 text-white shadow-md'
            }`}>
              {isDelete ? <Trash2 className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
            </div>
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                  isDelete ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isDelete ? 'AUDIT PEMADAMAN' : 'AUDIT PINDAAN'}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium line-clamp-1">
                Rekod: <span className="font-bold text-slate-900">"{recordTitle}"</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Audit Identity Notice */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate">
                Tindakan direkod atas nama: {actorName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {actorRole || 'Pegawai Bertugas'} • {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Preset Quick Reason Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Pilihan Sebab Pantas:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {options.map((opt, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    setReason(opt)
                    setError('')
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all text-left ${
                    reason === opt
                      ? isDelete
                        ? 'bg-rose-100 text-rose-950 border-rose-300 font-bold shadow-xs'
                        : 'bg-amber-100 text-amber-950 border-amber-300 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea (Mandatory) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Sebab / Justifikasi Terperinci <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Mandatori</span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value)
                if (e.target.value.trim()) setError('')
              }}
              placeholder={isDelete ? 'Cth: Sesi dibatalkan atas arahan Ketua Jabatan kerana pertindihan audit...' : 'Cth: Tarikh dipinda ke 20 Ogos kerana dewan mesyuarat penuh...'}
              className={`w-full p-3 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 placeholder:text-slate-400 transition-all ${
                error
                  ? 'border-rose-400 focus:ring-rose-400/20 bg-rose-50/30'
                  : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
              }`}
            />
            {error && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                  : 'bg-slate-900 hover:bg-black active:scale-95'
              }`}
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  {isDelete ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isDelete ? 'Sahkan Pemadaman & Simpan Log' : 'Sahkan & Simpan Log'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
