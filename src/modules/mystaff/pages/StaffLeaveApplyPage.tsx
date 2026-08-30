// src/modules/mystaff/pages/StaffLeaveApplyPage.tsx
// Standardized HRMIS Leave Application Form

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Shield,
  HelpCircle,
  Clock
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { ROUTES } from '@/lib/constants'
import {
  getLeaveTypes,
  getLeaveQuotas,
  submitLeaveApplication
} from '@/modules/mystaff/services/staffService'
import type { StaffLeaveType, StaffLeaveQuota } from '@/shared/types/mystaff'
import { Button } from '@/components/ui'

export const StaffLeaveApplyPage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const user = useAuthStore(state => state.user)

  const [leaveTypes, setLeaveTypes] = useState<StaffLeaveType[]>([])
  const [quotas, setQuotas] = useState<StaffLeaveQuota[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalDays, setTotalDays] = useState(1)
  const [reason, setReason] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [replacementOfficerName, setReplacementOfficerName] = useState('')

  useEffect(() => {
    async function loadFormPrerequisites() {
      try {
        setLoading(true)
        const [typesRes, quotasRes] = await Promise.all([
          getLeaveTypes(),
          getLeaveQuotas(user?.id || 'demo-user-id', new Date().getFullYear())
        ])
        if (typesRes.data) {
          setLeaveTypes(typesRes.data)
          if (typesRes.data.length > 0) {
            setSelectedTypeId(typesRes.data[0].id)
          }
        }
        if (quotasRes.data) setQuotas(quotasRes.data)
      } catch (err) {
        console.error(err)
        toast.error('Ralat memuatkan borang permohonan cuti')
      } finally {
        setLoading(false)
      }
    }
    loadFormPrerequisites()
  }, [user?.id])

  // Calculate days between dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setTotalDays(diffDays)
      } else {
        setTotalDays(0)
      }
    }
  }, [startDate, endDate])

  const selectedQuota = quotas.find(q => q.leave_type_id === selectedTypeId)
  const selectedTypeObj = leaveTypes.find(t => t.id === selectedTypeId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || totalDays <= 0 || !reason.trim()) {
      toast.error('Sila lengkapkan maklumat tarikh dan sebab cuti.')
      return
    }

    if (selectedQuota && totalDays > selectedQuota.baki_hari) {
      toast.error(`Baki cuti tidak mencukupi! Anda hanya mempunyai ${selectedQuota.baki_hari} hari baki cuti.`)
      return
    }

    try {
      setSubmitting(true)
      const res = await submitLeaveApplication({
        user_id: user?.id || 'demo-user-id',
        hospital_id: user?.hospital_id || 'hosp-1',
        department_id: user?.department_id || 'dept-1',
        leave_type_id: selectedTypeId,
        tarikh_mula: startDate,
        tarikh_tamat: endDate,
        jumlah_hari: totalDays,
        sesi: 'full',
        sebab: reason,
        status: 'pending',
        is_half_day: false,
        replacement_user_id: 'rep-officer-1'
      })

      if (res.error) throw new Error(res.error)

      toast.success('Permohonan cuti berjaya dihantar ke HOD untuk kelulusan!')
      navigate(ROUTES.STAFF_LEAVE)
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar permohonan cuti')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500" />
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.STAFF_LEAVE)}
            className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Borang Permohonan Cuti
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Sistem Cuti Bersepadu Hospital (Perintah Am Bab C / HRMIS)
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type Selection with Live Quota Card */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Pilihan Jenis Cuti <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {leaveTypes.map(type => {
                const isSelected = type.id === selectedTypeId
                const quota = quotas.find(q => q.leave_type_id === type.id)

                return (
                  <div
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {type.kod_cuti}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{type.nama_cuti}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 font-bold">Baki Layak:</span>
                      <span className="text-emerald-700 font-black">
                        {quota ? `${quota.baki_hari} Hari` : 'Tertakluk'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Date Range & Total Days */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Tempoh Masa Cuti</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tarikh Mula Cuti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tarikh Tamat Cuti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Jumlah Bilangan Hari
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black font-mono text-emerald-700 flex items-center justify-between">
                  <span>{totalDays > 0 ? `${totalDays} Hari` : '0 Hari'}</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Reason & Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sebab Bercuti / Catatan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Sila nyatakan sebab cuti..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Telefon Semasa Bercuti (Kecemasan)
                </label>
                <input
                  type="tel"
                  placeholder="cth. 012-3456789"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pegawai Pengambil Alih Tugas (Replacement Officer)
                </label>
                <input
                  type="text"
                  placeholder="Nama pegawai pengganti..."
                  value={replacementOfficerName}
                  onChange={e => setReplacementOfficerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.STAFF_LEAVE)}
              className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || totalDays <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-md"
            >
              {submitting ? 'Menghantar Permohonan...' : 'Hantar Permohonan Cuti'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StaffLeaveApplyPage
