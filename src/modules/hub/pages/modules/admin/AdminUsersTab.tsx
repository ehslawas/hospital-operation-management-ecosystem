import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Shield,
  Building2,
  Mail,
  Phone,
  Edit,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { getUsers, updateUser, adminResetUserPassword } from '@/services/userService'
import { sendPasswordResetEmail } from '@/services/emailService'
import { getAllRoles } from '@/services/roleService'
import { getDepartments } from '@/services/departmentService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import type { UserWithRelations, Role, Department } from '@/types'

export const AdminUsersTab: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastStore()
  const { user: currentUser } = useAuthStore()

  // Check if logged-in user is Super Admin
  const isSuperAdmin =
    !currentUser ||
    currentUser?.role?.role_code === 'system_admin' ||
    currentUser?.role?.role_code === 'superadmin' ||
    currentUser?.role?.role_code === 'super_admin' ||
    currentUser?.role?.role_name?.toLowerCase().includes('system admin') ||
    currentUser?.role?.role_name?.toLowerCase().includes('superadmin') ||
    currentUser?.role?.role_name?.toLowerCase().includes('super admin')

  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserWithRelations | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editIcNumber, setEditIcNumber] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmployeeId, setEditEmployeeId] = useState('')
  const [editJawatan, setEditJawatan] = useState('')
  const [assignedRole, setAssignedRole] = useState('')
  const [assignedDept, setAssignedDept] = useState('')
  const [assignedStatus, setAssignedStatus] = useState<any>('active')
  const [isSaving, setIsSaving] = useState(false)

  // Password Reset State (Super Admin Only)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(true)

  const fetchUsersList = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getUsers({
        page: 1,
        pageSize: 150, // Grab first batch
        search: search || undefined,
        departmentId: deptFilter !== 'all' ? deptFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      })
      
      let data = result.data || []
      // Client-side role filter fallback if service doesn't process it natively
      if (roleFilter !== 'all') {
        data = data.filter((u) => u.role_id === roleFilter)
      }
      setUsers(data)
    } catch (error) {
      showError('Error', 'Failed to retrieve user accounts')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [search, roleFilter, deptFilter, statusFilter, showError])

  useEffect(() => {
    fetchUsersList()
  }, [fetchUsersList])

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [rolesList, deptsList] = await Promise.all([
          getAllRoles(),
          getDepartments({ page: 1, pageSize: 100 })
        ])
        setRoles(rolesList)
        setDepartments(deptsList.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchMetadata()
  }, [])

  const handleOpenEdit = (user: UserWithRelations) => {
    setEditingUser(user)
    setEditFullName(user.full_name || '')
    setEditIcNumber(user.ic_number || '')
    setEditEmail(user.email || '')
    setEditPhone(user.phone_number || '')
    setEditEmployeeId(user.employee_id || '')
    setEditJawatan(user.jawatan || '')
    setAssignedRole(user.role_id || '')
    setAssignedDept(user.department_id || '')
    setAssignedStatus(user.status || 'active')

    // Reset password management state
    setNewPassword('')
    setShowPassword(false)
    setIsCopied(false)
    setIsPasswordSectionOpen(true)
  }

  const handleGeneratePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lowercase = 'abcdefghijkmnopqrstuvwxyz'
    const numbers = '23456789'
    const special = '!@#$%&*?'

    let generated = ''
    generated += uppercase[Math.floor(Math.random() * uppercase.length)]
    generated += lowercase[Math.floor(Math.random() * lowercase.length)]
    generated += numbers[Math.floor(Math.random() * numbers.length)]
    generated += special[Math.floor(Math.random() * special.length)]

    const all = uppercase + lowercase + numbers + special
    for (let i = 0; i < 8; i++) {
      generated += all[Math.floor(Math.random() * all.length)]
    }

    const shuffled = generated.split('').sort(() => 0.5 - Math.random()).join('')
    setNewPassword(shuffled)
    setShowPassword(true)
    showSuccess('Kata Laluan Dijana', 'Kata laluan kukuh telah dijana secara automatik.')
  }

  const handleCopyPassword = () => {
    if (!newPassword) return
    navigator.clipboard.writeText(newPassword)
    setIsCopied(true)
    showSuccess('Disalin', 'Kata laluan disalin ke papan keratan (clipboard).')
    setTimeout(() => setIsCopied(false), 2500)
  }

  const handleDirectPasswordReset = async () => {
    if (!editingUser) return
    if (!isSuperAdmin) {
      showError('Akses Ditolak', 'Hanya Super Admin dibenarkan menetapkan kata laluan pengguna.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      showError('Kata Laluan Tidak Sah', 'Sila masukkan kata laluan sekurang-kurangnya 6 aksara.')
      return
    }

    setIsResettingPassword(true)
    try {
      const emailToUse = editEmail || editingUser.email
      const result = await adminResetUserPassword(editingUser.id, emailToUse, newPassword)

      if (result.success) {
        showSuccess(
          'Kata Laluan Berjaya Dikemaskini',
          result.message || `Kata laluan bagi ${editFullName || editingUser.full_name} berjaya dikemaskini.`
        )
      } else {
        showError('Gagal Mengemaskini', result.error || 'Gagal mengemaskini kata laluan pengguna.')
      }
    } catch (err: any) {
      showError('Ralat', err.message || 'Ralat semasa menetapkan semula kata laluan')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleSendResetEmail = async () => {
    if (!editingUser) return
    if (!isSuperAdmin) {
      showError('Akses Ditolak', 'Hanya Super Admin dibenarkan menghantar emel tetapan semula kata laluan.')
      return
    }
    const emailToUse = editEmail || editingUser.email
    if (!emailToUse) {
      showError('Emel Diperlukan', 'Pengguna ini tiada rekod emel untuk dihantar.')
      return
    }

    setIsSendingResetEmail(true)
    try {
      const result = await sendPasswordResetEmail(emailToUse)
      if (result.success) {
        showSuccess('Emel Dihantar', `Pautan tetapan semula kata laluan telah dihantar ke ${emailToUse}.`)
      } else {
        showError('Gagal Menghantar', result.error || 'Gagal menghantar emel tetapan semula.')
      }
    } catch (err: any) {
      showError('Ralat', err.message || 'Ralat semasa menghantar emel.')
    } finally {
      setIsSendingResetEmail(false)
    }
  }

  const handleSave = async () => {
    if (!editingUser) return

    if (!isSuperAdmin) {
      showError('Akses Ditolak', 'Hanya Super Admin dibenarkan untuk mengemaskini maklumat pengguna.')
      return
    }

    setIsSaving(true)
    try {
      await updateUser(editingUser.id, {
        full_name: editFullName,
        ic_number: editIcNumber,
        email: editEmail,
        phone_number: editPhone,
        employee_id: editEmployeeId,
        jawatan: editJawatan,
        role_id: assignedRole,
        department_id: assignedDept || undefined,
        status: assignedStatus
      })

      showSuccess('Kejayaan', `Maklumat akaun bagi ${editFullName} berjaya dikemaskini.`)
      setEditingUser(null)
      fetchUsersList()
    } catch (error: any) {
      showError('Ralat', error.message || 'Gagal mengemaskini profil pengguna')
    } finally {
      setIsSaving(false)
    }
  }


  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'suspended':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtering Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center bg-slate-900/40 p-4 rounded-xl border border-white/5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Carian nama, email, no pekerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Semua Peranan (All Roles)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.role_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Semua Jabatan (All Depts)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Semua Status (All Status)</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        {isLoading ? (
          <div className="p-12 space-y-4">
            <div className="h-5 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-5 bg-white/5 rounded w-11/12 animate-pulse" />
            <div className="h-5 bg-white/5 rounded w-10/12 animate-pulse" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-600" />
            <div>
              <p className="text-white font-bold">Tiada pengguna ditemui</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting search query or filters.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Staff Details</th>
                <th className="p-4">Security Role</th>
                <th className="p-4">Jabatan (Department)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 text-sm font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 text-slate-400 font-bold uppercase">
                        {u.profile_photo_url ? (
                          <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold">{u.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          ID: {u.employee_id || 'NOT_ASSIGNED'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span>{u.role?.role_name || 'No Role'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      <span>{u.department?.department_name || 'Not assigned'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(u.status)}`}>
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-teal-400" />
                  Kemaskini Pengguna (Edit User Profile)
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Authorization Banner */}
                {isSuperAdmin ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Hak Akses: Super Admin (Penyuntingan Dibenarkan)</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Superadmin</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Hanya Super Admin sahaja yang dibenarkan mengemaskini maklumat pengguna ini.</span>
                  </div>
                )}

                {/* User Summary Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold uppercase">
                    {(editFullName || editingUser.full_name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-bold truncate">{editFullName || editingUser.full_name}</div>
                    <div className="text-xs text-slate-400 font-mono">IC: {editIcNumber || editingUser.ic_number || 'Tiada Data'}</div>
                  </div>
                </div>

                {/* Edit Form Fields */}
                <div className="space-y-4 pt-1">
                  {/* Nama Penuh */}
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">Nama Penuh (Full Name)</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      disabled={!isSuperAdmin}
                      placeholder="Masukkan nama penuh"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* No. KP / IC */}
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">No. Kad Pengenalan / IC</label>
                    <input
                      type="text"
                      value={editIcNumber}
                      onChange={(e) => setEditIcNumber(e.target.value)}
                      disabled={!isSuperAdmin}
                      placeholder="Contoh: 861102025693"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs"
                    />
                  </div>

                  {/* Emel & No. Telefon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Emel (Email Address)</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        disabled={!isSuperAdmin}
                        placeholder="pengguna@moh.gov.my"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">No. Telefon (Phone)</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        disabled={!isSuperAdmin}
                        placeholder="012-3456789"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* No. Pekerja & Jawatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">No. Pekerja (Employee ID)</label>
                      <input
                        type="text"
                        value={editEmployeeId}
                        onChange={(e) => setEditEmployeeId(e.target.value)}
                        disabled={!isSuperAdmin}
                        placeholder="SYS001"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1.5">Jawatan (Position/Title)</label>
                      <input
                        type="text"
                        value={editJawatan}
                        onChange={(e) => setEditJawatan(e.target.value)}
                        disabled={!isSuperAdmin}
                        placeholder="Pegawai Farmasi"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Peranan (Role) */}
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">Peranan (Role)</label>
                    <select
                      value={assignedRole}
                      onChange={(e) => setAssignedRole(e.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.role_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jabatan (Department) */}
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">Jabatan (Department)</label>
                    <select
                      value={assignedDept}
                      onChange={(e) => setAssignedDept(e.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Tiada Jabatan (No Department)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Akaun */}
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">Status Akaun (Account Status)</label>
                    <select
                      value={assignedStatus}
                      onChange={(e) => setAssignedStatus(e.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending Review</option>
                    </select>
                  </div>

                  {/* Super Admin Password Management Section */}
                  <div className="pt-2">
                    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-amber-950/20 overflow-hidden shadow-lg">
                      {/* Section Header Accordion */}
                      <button
                        type="button"
                        onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
                        className="w-full p-3 flex items-center justify-between bg-amber-500/10 hover:bg-amber-500/15 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                              <span>Tetapan Semula Kata Laluan</span>
                              <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">SUPERADMIN ONLY</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Tukar kata laluan terus atau hantar pautan pengesahan ke emel pengguna
                            </p>
                          </div>
                        </div>
                        <div className="text-slate-400 p-1">
                          {isPasswordSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Section Body */}
                      <AnimatePresence>
                        {isPasswordSectionOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 space-y-3.5 border-t border-amber-500/10"
                          >
                            {isSuperAdmin ? (
                              <>
                                {/* Direct Password Input & Tools */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between flex-wrap gap-1">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                                      Kata Laluan Baharu (New Password)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={handleGeneratePassword}
                                      className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2.5 py-1 rounded-md transition-all font-medium"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Jana Rawak (Generate)
                                    </button>
                                  </div>

                                  <div className="relative flex items-center gap-1.5">
                                    <div className="relative flex-1">
                                      <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Masukkan atau jana kata laluan baharu..."
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-all"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                                        title={showPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                                      >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    </div>

                                    {newPassword && (
                                      <button
                                        type="button"
                                        onClick={handleCopyPassword}
                                        className="px-2.5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
                                        title="Salin kata laluan"
                                      >
                                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span className="text-[11px] font-medium">{isCopied ? 'Disalin' : 'Salin'}</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Direct Reset Action Button */}
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={handleDirectPasswordReset}
                                      disabled={isResettingPassword || !newPassword || newPassword.length < 6}
                                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      {isResettingPassword ? (
                                        <>
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                          <span>Menetapkan Kata Laluan Baharu...</span>
                                        </>
                                      ) : (
                                        <>
                                          <KeyRound className="w-4 h-4" />
                                          <span>Tetapkan Kata Laluan Baharu Sekarang</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Separator / Alternative option */}
                                <div className="relative flex py-1 items-center">
                                  <div className="flex-grow border-t border-white/5"></div>
                                  <span className="flex-shrink mx-2 text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Atau Pilihan Emel</span>
                                  <div className="flex-grow border-t border-white/5"></div>
                                </div>

                                {/* Send Reset Email Button */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={handleSendResetEmail}
                                    disabled={isSendingResetEmail || !(editEmail || editingUser.email)}
                                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    {isSendingResetEmail ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Menghantar Emel Pautan...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-3.5 h-3.5 text-teal-400" />
                                        <span className="truncate">Hantar Pautan Set Semula ke ({editEmail || editingUser.email || 'Tiada Emel'})</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                                <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                <span>Akses Terhad: Hanya akaun Super Admin dibenarkan membuat pertukaran kata laluan pengguna.</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-slate-950/40 flex justify-end gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isSuperAdmin || isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
