import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Megaphone,
  MapPin,
  Link,
  ExternalLink,
  FileText,
  UploadCloud,
  Download,
  Paperclip,
  Trash2,
  Pencil,
  History,
  ShieldAlert,
  Flame,
  Globe,
  Sparkles,
  Info,
  Check,
  Search,
  ShieldCheck,
  Edit3
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { ROUTES } from '@/lib/constants'
import {
  getStaffReminders,
  createStaffReminder,
  updateStaffReminder,
  deleteStaffReminderWithAudit,
  toggleStaffReminderStatus
} from '@/modules/mystaff/services/staffService'
import type { StaffReminder, ReminderType, ReminderPriority } from '@/shared/types/mystaff'
import { Button, SlideOver, Badge } from '@/components/ui'
import { AuditReasonModal } from '../components/AuditReasonModal'
import { AuditLogDrawer } from '../components/AuditLogDrawer'

export const StaffReminderPage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const user = useAuthStore(state => state.user)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [reminders, setReminders] = useState<StaffReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit & Audit State
  const [editingReminder, setEditingReminder] = useState<StaffReminder | null>(null)
  const [deletingReminder, setDeletingReminder] = useState<StaffReminder | null>(null)
  const [editReason, setEditReason] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false)

  // Form State
  const [formType, setFormType] = useState<ReminderType>('cme')
  const [formPriority, setFormPriority] = useState<ReminderPriority>('medium')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formTime, setFormTime] = useState('14:30')
  const [formLink, setFormLink] = useState('')
  const [formDocName, setFormDocName] = useState('')
  const [formDocUrl, setFormDocUrl] = useState('')
  const [docInputMode, setDocInputMode] = useState<'upload' | 'url'>('upload')

  const loadReminders = async () => {
    try {
      setIsLoading(true)
      const res = await getStaffReminders({
        hospitalId: user?.hospital_id,
        departmentId: user?.department_id,
        includeDismissed: true
      })
      if (res.data) setReminders(res.data)
    } catch (e) {
      console.error(e)
      toast.error('Ralat memuatkan senarai peringatan')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()
  }, [user?.hospital_id, user?.department_id])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Saiz fail melebihi had maksimum 15MB.')
      return
    }

    setFormDocName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setFormDocUrl(reader.result as string)
      toast.success(`Fail "${file.name}" sedia dilampirkan.`)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveDoc = () => {
    setFormDocName('')
    setFormDocUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenCreate = () => {
    setEditingReminder(null)
    setFormTitle('')
    setFormDesc('')
    setFormType('cme')
    setFormPriority('medium')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormTime('14:30')
    setFormLink('')
    setFormDocName('')
    setFormDocUrl('')
    setEditReason('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsSlideOverOpen(true)
  }

  const handleOpenEdit = (rem: StaffReminder, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingReminder(rem)
    setFormTitle(rem.tajuk)
    setFormDesc(rem.penerangan || '')
    setFormType(rem.jenis_peringatan)
    setFormPriority(rem.keutamaan || 'medium')
    const dt = new Date(rem.tarikh_peringatan)
    setFormDate(dt.toISOString().split('T')[0])
    setFormTime(dt.toTimeString().substring(0, 5))
    setFormLink(rem.meeting_link || '')
    setFormDocName(rem.attachment_name || '')
    setFormDocUrl(rem.attachment_url || '')
    setEditReason('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsSlideOverOpen(true)
  }

  const handleOpenDelete = (rem: StaffReminder, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingReminder(rem)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async (reason: string) => {
    if (!deletingReminder) return
    try {
      await deleteStaffReminderWithAudit(deletingReminder.id, {
        reason,
        actor_id: user?.id || 'demo-user',
        actor_name: user?.full_name || 'AMRI AMIT',
        actor_role: user?.jawatan || 'Pegawai Farmasi',
        record_title: deletingReminder.tajuk
      })
      toast.success('Peringatan telah dipadam dan jejak audit rasmi disimpan.')
      setReminders(prev => prev.filter(r => r.id !== deletingReminder.id))
      setIsDeleteModalOpen(false)
      setDeletingReminder(null)
    } catch {
      toast.error('Gagal memadam peringatan.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Sila masukkan tajuk peringatan.')
      return
    }

    if (editingReminder && !editReason.trim()) {
      toast.error('Sila nyatakan sebab / justifikasi pindaan (Wajib untuk rekod audit).')
      return
    }

    try {
      setSubmitting(true)
      const fullDateTime = `${formDate}T${formTime}:00`

      if (editingReminder) {
        // UPDATE existing record with audit
        const res = await updateStaffReminder(
          editingReminder.id,
          {
            tajuk: formTitle,
            penerangan: formDesc,
            jenis_peringatan: formType,
            keutamaan: formPriority,
            meeting_link: formLink.trim() ? formLink.trim() : null,
            attachment_name: formDocName.trim() ? formDocName.trim() : null,
            attachment_url: formDocUrl.trim() ? formDocUrl.trim() : null,
            tarikh_peringatan: fullDateTime
          },
          {
            reason: editReason.trim(),
            actor_id: user?.id || 'demo-user-id',
            actor_name: user?.full_name || 'AMRI AMIT',
            actor_role: user?.jawatan || 'Pegawai Bertugas'
          }
        )
        if (res.error) throw new Error(res.error)
        toast.success('Rekod acara berjaya dikemaskini dan jejak audit disimpan!')
      } else {
        // CREATE new record
        const res = await createStaffReminder({
          user_id: user?.id || 'demo-user-id',
          hospital_id: user?.hospital_id || 'hosp-1',
          department_id: user?.department_id || 'dept-1',
          tajuk: formTitle,
          penerangan: formDesc,
          jenis_peringatan: formType,
          keutamaan: formPriority,
          meeting_link: formLink.trim() ? formLink.trim() : null,
          attachment_name: formDocName.trim() ? formDocName.trim() : null,
          attachment_url: formDocUrl.trim() ? formDocUrl.trim() : null,
          tarikh_peringatan: fullDateTime,
          remind_before_minutes: 1440,
          is_shared_dept: true,
          is_dismissed: false,
          is_recurring: false
        })
        if (res.error) throw new Error(res.error)
        toast.success('Peringatan CME / Program berjaya dijadualkan!')
      }

      setIsSlideOverOpen(false)
      setEditingReminder(null)
      setEditReason('')
      await loadReminders()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan rekod peringatan')
    } finally {
      setSubmitting(false)
    }
  }

  const reminderTypeConfigs: Record<
    ReminderType,
    { label: string; desc: string; icon: React.ReactNode; color: string; badgeBg: string }
  > = {
    cme: {
      label: 'Sesi CME / CPD Hospital',
      desc: 'Pembentangan klinikal, perkongsian kes, & kredit CPD',
      icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
      color: 'border-purple-500 bg-purple-50/50 text-purple-900',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    meeting: {
      label: 'Mesyuarat / Perjumpaan',
      desc: 'Mesyuarat bulanan, taklimat pagi & perjumpaan khas',
      icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
      color: 'border-indigo-500 bg-indigo-50/50 text-indigo-900',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    course: {
      label: 'Kursus & Latihan',
      desc: 'Bengkel kemahiran, seminar dan latihan jabatan',
      icon: <Stethoscope className="w-4 h-4 text-teal-600" />,
      color: 'border-teal-500 bg-teal-50/50 text-teal-900',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    deadline: {
      label: 'Tarikh Akhir Serahan',
      desc: 'Deadlines audit, stok opname, atau data KPI',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      color: 'border-amber-500 bg-amber-50/50 text-amber-900',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    submission: {
      label: 'Penyerahan Laporan',
      desc: 'Penghantaran laporan kewangan / stok bulanan',
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      color: 'border-rose-500 bg-rose-50/50 text-rose-900',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    other: {
      label: 'Peringatan Umum',
      desc: 'Hebahan peribadi atau memo dalaman jabatan',
      icon: <Bell className="w-4 h-4 text-slate-600" />,
      color: 'border-slate-500 bg-slate-50 text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const priorityConfigs: Record<
    ReminderPriority,
    { label: string; sub: string; badge: string; border: string; dot: string; icon: React.ReactNode }
  > = {
    low: {
      label: 'Rendah',
      sub: 'Hebahan umum & makluman santai',
      badge: 'bg-slate-100 text-slate-900 border-slate-300 font-bold',
      border: 'border-slate-400',
      dot: 'bg-slate-500',
      icon: <Info className="w-3.5 h-3.5 text-slate-600" />
    },
    medium: {
      label: 'Biasa',
      sub: 'Jadual operasi standard jabatan',
      badge: 'bg-sky-100 text-sky-950 border-sky-300 font-bold',
      border: 'border-sky-500',
      dot: 'bg-sky-600',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
    },
    high: {
      label: 'Tinggi',
      sub: 'Kehadiran diwajibkan / Sasaran utama',
      badge: 'bg-amber-100 text-amber-950 border-amber-300 font-black',
      border: 'border-amber-500',
      dot: 'bg-amber-600',
      icon: <Flame className="w-3.5 h-3.5 text-amber-700" />
    },
    critical: {
      label: 'Kritikal',
      sub: 'Mandatori / Tindakan segera & Audit',
      badge: 'bg-rose-100 text-rose-950 border-rose-300 font-black animate-pulse',
      border: 'border-rose-500',
      dot: 'bg-rose-600',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
    }
  }

  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')

  const handleToggleDone = async (id: string, isDone: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      // Optimistic local state update
      setReminders(prev =>
        prev.map(r => (r.id === id ? { ...r, is_dismissed: isDone } : r))
      )
      const res = await toggleStaffReminderStatus(id, isDone)
      if (res.error) {
        toast.error(res.error)
        await loadReminders()
        return
      }
      if (isDone) {
        toast.success('Acara / Program berjaya ditandakan sebagai SELESAI!')
      } else {
        toast.info('Status dikembalikan kepada Belum Selesai.')
      }
    } catch {
      toast.error('Ralat mengemaskini status rekod.')
      await loadReminders()
    }
  }

  const counts = useMemo(() => {
    const pending = reminders.filter(r => !r.is_dismissed).length
    const completed = reminders.filter(r => r.is_dismissed).length
    return { pending, completed, total: reminders.length }
  }, [reminders])

  const filteredReminders = useMemo(() => {
    return reminders.filter(r => {
      if (statusFilter === 'pending' && r.is_dismissed) return false
      if (statusFilter === 'completed' && !r.is_dismissed) return false
      if (selectedType !== 'ALL' && r.jenis_peringatan !== selectedType) return false
      if (selectedPriority !== 'ALL' && (r.keutamaan || 'medium') !== selectedPriority) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = r.tajuk?.toLowerCase().includes(q)
        const matchDesc = r.penerangan?.toLowerCase().includes(q)
        const matchDoc = r.attachment_name?.toLowerCase().includes(q)
        const matchUser = (r.user?.full_name || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchDoc && !matchUser) return false
      }
      return true
    })
  }, [reminders, statusFilter, selectedType, selectedPriority, searchQuery])

  return (
    <div className="p-6 md:p-8 w-full space-y-6 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500" />
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
            className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">
                Log Event & Jadual CME Jabatan
              </h1>
              <Badge variant="gray" className="font-mono text-[10px] font-bold py-0.5 px-2 text-purple-700 bg-purple-50 border-purple-200">
                SENARAI LOG & AKTIVITI
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Senarai Rasmi Sesi CME / CPD, Mesyuarat Jabatan, Pautan Pantas & Dokumen Rujukan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAuditDrawerOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Log Audit & Pindaan</span>
          </button>

          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-md hover:shadow-lg font-bold flex items-center gap-2 px-5 py-2.5 transition-all text-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>Jadual Event Baru</span>
          </Button>
        </div>
      </div>

      {/* Main Status Filter Tabs (Belum Selesai / Telah Selesai / Semua) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Tab 1: Belum Selesai (Aktif) */}
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
            statusFilter === 'pending'
              ? 'bg-amber-50/90 border-2 border-amber-500 ring-2 ring-amber-400/20 shadow-md'
              : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-100 text-amber-800'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs font-black uppercase tracking-wider ${
                statusFilter === 'pending' ? 'text-amber-950' : 'text-slate-800'
              }`}>
                Belum Selesai (Aktif)
              </div>
              <div className={`text-xs font-medium mt-0.5 ${
                statusFilter === 'pending' ? 'text-amber-800' : 'text-slate-500'
              }`}>
                Perlu tindakan / Sesi akan datang
              </div>
            </div>
          </div>
          <span className={`text-xl font-black px-3 py-0.5 rounded-xl border tabular-nums ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            {counts.pending}
          </span>
        </button>

        {/* Tab 2: Telah Selesai */}
        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/90 border-2 border-emerald-500 ring-2 ring-emerald-400/20 shadow-md'
              : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${
              statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs font-black uppercase tracking-wider ${
                statusFilter === 'completed' ? 'text-emerald-950' : 'text-slate-800'
              }`}>
                Telah Selesai
              </div>
              <div className={`text-xs font-medium mt-0.5 ${
                statusFilter === 'completed' ? 'text-emerald-800' : 'text-slate-500'
              }`}>
                Selesai / Laporan dihantar
              </div>
            </div>
          </div>
          <span className={`text-xl font-black px-3 py-0.5 rounded-xl border tabular-nums ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            {counts.completed}
          </span>
        </button>

        {/* Tab 3: Semua Rekod */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
            statusFilter === 'all'
              ? 'bg-purple-50/90 border-2 border-purple-600 ring-2 ring-purple-400/20 shadow-md'
              : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${
              statusFilter === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-100 text-purple-800'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs font-black uppercase tracking-wider ${
                statusFilter === 'all' ? 'text-purple-950' : 'text-slate-800'
              }`}>
                Semua Rekod
              </div>
              <div className={`text-xs font-medium mt-0.5 ${
                statusFilter === 'all' ? 'text-purple-800' : 'text-slate-500'
              }`}>
                Keseluruhan aktiviti jabatan
              </div>
            </div>
          </div>
          <span className={`text-xl font-black px-3 py-0.5 rounded-xl border tabular-nums ${
            statusFilter === 'all'
              ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            {counts.total}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tajuk program, kategori, penceramah, dokumen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            {[
              { id: 'ALL', label: 'Semua Kategori' },
              { id: 'cme', label: 'CME / CPD' },
              { id: 'meeting', label: 'Mesyuarat' },
              { id: 'course', label: 'Kursus / Latihan' },
              { id: 'deadline', label: 'Tarikh Akhir' },
              { id: 'submission', label: 'Laporan' },
              { id: 'other', label: 'Umum' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter Sub-Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tapis Keutamaan:</span>
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'critical', label: 'Kritikal', dot: 'bg-rose-500' },
            { id: 'high', label: 'Tinggi', dot: 'bg-amber-500' },
            { id: 'medium', label: 'Biasa', dot: 'bg-sky-500' },
            { id: 'low', label: 'Rendah', dot: 'bg-slate-400' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPriority(p.id)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                selectedPriority === p.id
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {p.dot && <span className={`w-2 h-2 rounded-full ${p.dot}`} />}
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reminder Records Table (List with Columns) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-black text-slate-800 tracking-wider font-mono">
              <tr>
                <th className="px-6 py-4">Kategori & Keutamaan</th>
                <th className="px-6 py-4">Tajuk Acara / Sesi & Sinopsis</th>
                <th className="px-6 py-4">Tarikh & Masa</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pautan Sesi (1-Click)</th>
                <th className="px-6 py-4">Dokumen Rujukan (1-Click)</th>
                <th className="px-6 py-4">Didaftarkan Oleh</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <Bell className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Tiada rekod acara atau sesi CME dijumpai</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {statusFilter === 'pending'
                        ? 'Semua acara / program telah diselesaikan! Klik tab "Telah Selesai" untuk melihat arkib.'
                        : 'Sila cuba kata carian lain atau klik "Jadual Event Baru" untuk mendaftar.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReminders.map((rem: StaffReminder) => {
                  const remDate = new Date(rem.tarikh_peringatan)
                  const typeConf = reminderTypeConfigs[rem.jenis_peringatan as ReminderType] || reminderTypeConfigs.other
                  const prioConf = priorityConfigs[(rem.keutamaan || 'medium') as ReminderPriority] || priorityConfigs.medium
                  const isDone = !!rem.is_dismissed

                  return (
                    <tr
                      key={rem.id}
                      className={`transition-colors group ${
                        isDone ? 'bg-slate-50/40 hover:bg-slate-50/80 opacity-80' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Column 1: Category & Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${typeConf.badgeBg}`}>
                            {typeConf.icon}
                            <span>{typeConf.label}</span>
                          </span>
                          <div>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${prioConf.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${prioConf.dot}`} />
                              <span>{prioConf.label}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Title & Synopsis */}
                      <td className="px-6 py-4 min-w-[280px]">
                        <h4 className={`font-extrabold text-sm transition-colors leading-snug ${
                          isDone ? 'text-slate-600 line-through' : 'text-slate-900 group-hover:text-purple-700'
                        }`}>
                          {rem.tajuk}
                        </h4>
                        {rem.penerangan && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {rem.penerangan}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            WAD & JABATAN
                          </span>
                          {rem.last_edited_by_name && (
                            <span className="text-[10px] text-amber-900 font-bold bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1" title={rem.last_edit_reason || 'Pindaan data'}>
                              <Edit3 className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>Dipinda: {rem.last_edited_by_name}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Date & Time */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>
                            {remDate.toLocaleDateString('ms-MY', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>
                            {remDate.toLocaleTimeString('ms-MY', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Status Selesai Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Telah Selesai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>Belum Selesai</span>
                          </span>
                        )}
                      </td>

                      {/* Column 5: Meeting Link */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rem.meeting_link ? (
                          <a
                            href={rem.meeting_link.startsWith('http') ? rem.meeting_link : `https://${rem.meeting_link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white transition-all shadow-xs text-xs font-bold group/link"
                          >
                            <Globe className="w-3.5 h-3.5 text-purple-600 group-hover/link:text-white shrink-0" />
                            <span>
                              {rem.meeting_link.includes('meet.google')
                                ? 'Google Meet'
                                : rem.meeting_link.includes('zoom.us')
                                ? 'Zoom Meeting'
                                : rem.meeting_link.includes('teams.microsoft')
                                ? 'MS Teams'
                                : 'Pautan Acara'}
                            </span>
                            <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal italic">
                            Tiada pautan
                          </span>
                        )}
                      </td>

                      {/* Column 6: Document Attachment */}
                      <td className="px-6 py-4">
                        {rem.attachment_url || rem.attachment_name ? (
                          <a
                            href={rem.attachment_url || '#'}
                            download={rem.attachment_name || 'Dokumen_Rujukan'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all shadow-xs text-xs font-bold max-w-[200px] group/doc"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600 group-hover/doc:text-white shrink-0" />
                            <span className="truncate">
                              {rem.attachment_name || 'Dokumen Slaid'}
                            </span>
                            <Download className="w-3 h-3 group-hover/doc:translate-y-0.5 transition-transform shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal italic">
                            Tiada dokumen
                          </span>
                        )}
                      </td>

                      {/* Column 7: Submitter Profile */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {rem.user?.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {rem.user?.full_name || user?.full_name || 'AMRI AMIT'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {rem.user?.jawatan || user?.jawatan || 'Pegawai Bertugas'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 8: Actions (Mark as Done, Edit with Audit, Delete with Reason) */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDone ? (
                            <button
                              onClick={(e) => handleToggleDone(rem.id, true, e)}
                              title="Tanda acara/sesi ini sebagai Selesai"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Tanda Selesai</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleToggleDone(rem.id, false, e)}
                              title="Kembalikan status kepada Belum Selesai"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Buka Semula</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleOpenEdit(rem, e)}
                            title="Kemaskini Rekod & Rekod Log Pindaan"
                            className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all border border-slate-200 shadow-2xs hover:shadow-xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleOpenDelete(rem, e)}
                            title="Padam Peringatan & Rekod Sebab Pemadaman"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200 shadow-2xs hover:shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SlideOver Drawer: Borang Acara / Kemaskini (Slide from Right) */}
      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => {
          setIsSlideOverOpen(false)
          setEditingReminder(null)
        }}
        size="3xl"
        title={editingReminder ? 'Kemaskini Rekod Acara / Sesi CME' : 'Jadualkan Log Event & Sesi CME'}
        description={editingReminder ? 'Pindaan rasmi rekod program jabatan dengan catatan jejak audit mandatori' : 'Pendaftaran Sesi CME, Mesyuarat Rasmi, Pautan Pantas & Dokumen Rujukan'}
      >
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 pb-28 text-slate-800">
          {/* Submitter & Department Context Pill */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-slate-50 border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shadow-sm text-sm">
                {user?.full_name ? user.full_name.charAt(0) : 'P'}
              </div>
              <div>
                <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                  {editingReminder ? 'Pegawai Yang Meminda' : 'Didaftarkan Oleh'}
                </p>
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {user?.full_name || 'Pegawai Jabatan'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {user?.jawatan || 'Pegawai Bertugas'} • {user?.department?.department_name || 'Jabatan Farmasi'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white border border-purple-200 text-purple-700 shadow-xs">
              {editingReminder ? 'MOD PINDAAN' : 'KONGSI JABATAN'}
            </span>
          </div>

          {/* Mandatory Edit Reason Box if Editing */}
          {editingReminder && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-400 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Sebab / Justifikasi Pindaan (Mandatori Rekod Audit) <span className="text-rose-600">*</span></span>
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  AUDIT LOG
                </span>
              </div>

              {/* Quick Preset Chips for Edit Reason */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Pertukaran Tarikh & Masa Sesi',
                  'Pembetulan Pautan / Link Sesi',
                  'Kemaskini Dokumen Slaid CME',
                  'Pembetulan Maklumat / Tajuk Acara',
                  'Penukaran Penceramah / Bilik Seminar'
                ].map((chip, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setEditReason(chip)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      editReason === chip
                        ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/60'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                required
                value={editReason}
                onChange={e => setEditReason(e.target.value)}
                placeholder="Cth: Dipinda atas arahan Dr. Penyelaras CME kerana pertindihan bilik mesyuarat..."
                className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          )}

          {/* Category Selector with Interactive Visual Tiles */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Kategori Acara / Program <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(reminderTypeConfigs) as ReminderType[]).map(key => {
                const conf = reminderTypeConfigs[key]
                const isSelected = formType === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormType(key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/80 shadow-sm ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100 shrink-0">
                      {conf.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-extrabold text-xs text-slate-900 leading-snug">
                        {conf.label}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 line-clamp-1">
                        {conf.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority Level Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Tahap Keutamaan (Priority Level) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-medium">Tentukan tahap urgensi</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(priorityConfigs) as ReminderPriority[]).map(pKey => {
                const pConf = priorityConfigs[pKey]
                const isSelected = formPriority === pKey
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setFormPriority(pKey)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 relative ${
                      isSelected
                        ? `${pConf.border} bg-white shadow-md ring-2 ring-purple-500/20 font-black`
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {pConf.icon}
                      <span className={`text-xs font-extrabold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {pConf.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-1">
                      {pConf.sub.split('/')[0]}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className={`w-2 h-2 rounded-full block ${pConf.dot}`} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tajuk Sesi CME / Nama Acara <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="cth. CME: Update on Antibiotic Stewardship Guideline 2026"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Date & Time Grid with Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Tarikh Program <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-medium text-slate-400">YYYY-MM-DD</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition-all shadow-xs"
                />
              </div>
              {/* Quick Date Presets */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFormDate(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + 1)
                    setFormDate(d.toISOString().split('T')[0])
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                >
                  Esok
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + 7)
                    setFormDate(d.toISOString().split('T')[0])
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                >
                  +1 Minggu
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Masa Mula <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-medium text-slate-400">24-Hour</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formTime}
                  onChange={e => setFormTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition-all shadow-xs"
                />
              </div>
              {/* Quick Time Presets */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFormTime('08:30')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                >
                  08:30 AM
                </button>
                <button
                  type="button"
                  onClick={() => setFormTime('11:00')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                >
                  11:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setFormTime('14:30')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                >
                  02:30 PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick Meeting Link Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-600" />
                <span>Pautan Sesi / Video Meeting (Pilihan)</span>
              </span>
              <span className="text-[10px] text-slate-400">Google Meet / Zoom / URL</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link className="w-4 h-4 text-purple-500" />
              </div>
              <input
                type="url"
                placeholder="cth. https://meet.google.com/abc-defg-hij atau https://zoom.us/j/..."
                value={formLink}
                onChange={e => setFormLink(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition-all shadow-xs"
              />
            </div>
            {/* Quick URL Prefix Helpers */}
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFormLink('https://meet.google.com/')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              >
                + Google Meet
              </button>
              <button
                type="button"
                onClick={() => setFormLink('https://zoom.us/j/')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
              >
                + Zoom
              </button>
              <button
                type="button"
                onClick={() => setFormLink('https://teams.microsoft.com/')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                + Teams
              </button>
            </div>
          </div>

          {/* Document Attachment & Direct Access Section */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokumen Rujukan / Slaid Lampiran (Pilihan)</span>
              </label>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDocInputMode('upload')}
                  className={`px-2 py-0.5 rounded ${docInputMode === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}
                >
                  Muat Naik Fail
                </button>
                <button
                  type="button"
                  onClick={() => setDocInputMode('url')}
                  className={`px-2 py-0.5 rounded ${docInputMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}
                >
                  Pautan Dokumen
                </button>
              </div>
            </div>

            {docInputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                />

                {!formDocName ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-4 text-center transition-all bg-white hover:bg-purple-50/30 group"
                  >
                    <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-purple-600 mx-auto mb-1.5 transition-colors" />
                    <p className="text-xs font-bold text-slate-700 group-hover:text-purple-900">
                      Klik untuk Pilih Dokumen / Slaid CME
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Menyokong fail PDF, Word, PowerPoint & Gambar (Maks. 15MB)
                    </p>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{formDocName}</p>
                        <p className="text-[10px] text-emerald-700 font-medium">Fail sedia untuk akses segera staf</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDoc}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama Dokumen (cth. Garis Panduan Antibiotik 2026.pdf)"
                  value={formDocName}
                  onChange={e => setFormDocName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                <input
                  type="url"
                  placeholder="URL Dokumen Google Drive / Portal KKM (cth. https://drive.google.com/...)"
                  value={formDocUrl}
                  onChange={e => setFormDocUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            )}
          </div>

          {/* Description & Synopsis */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Butiran / Sinopsis Sesi
            </label>
            <textarea
              rows={3}
              placeholder="Masukkan sinopsis topik pembentangan, senarai jemputan, lokasi bilik seminar, atau arahan persiapan sebelum sesi..."
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition-all shadow-xs resize-none"
            />
          </div>

          {/* Sticky Bottom Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSlideOverOpen(false)
                setEditingReminder(null)
              }}
              className="border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-2xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold px-7 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              {submitting ? 'Menyimpan...' : editingReminder ? 'Simpan Pindaan & Log Audit' : 'Jadualkan Peringatan'}
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* Audit Reason Modal for Delete Action */}
      <AuditReasonModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingReminder(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Sahkan Pemadaman Rekod Acara"
        recordTitle={deletingReminder?.tajuk || ''}
        actionType="DELETE"
        actorName={user?.full_name || 'AMRI AMIT'}
        actorRole={user?.jawatan || 'Pegawai Farmasi'}
        presetReasons={[
          'Sesi / Acara Dibatalkan Penganjur',
          'Tersilap Masuk Maklumat / Rekod Berganda',
          'Pertindihan Jadual Kerja / Sesi Ditunda',
          'Penceramah Tidak Dapat Hadir',
          'Pertukaran ke Program Lain'
        ]}
      />

      {/* Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        defaultModule="REMINDER"
        title="Log Audit & Sejarah Pindaan Event / CME"
      />
    </div>
  )
}

export default StaffReminderPage
