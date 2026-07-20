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
  AlertCircle
} from 'lucide-react'
import { getUsers, updateUser } from '@/services/userService'
import { getAllRoles } from '@/services/roleService'
import { getDepartments } from '@/services/departmentService'
import { useToastStore } from '@/stores/toastStore'
import type { UserWithRelations, Role, Department } from '@/types'

export const AdminUsersTab: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastStore()

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
  const [assignedRole, setAssignedRole] = useState('')
  const [assignedDept, setAssignedDept] = useState('')
  const [assignedStatus, setAssignedStatus] = useState<any>('active')
  const [isSaving, setIsSaving] = useState(false)

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
    setAssignedRole(user.role_id)
    setAssignedDept(user.department_id || '')
    setAssignedStatus(user.status)
  }

  const handleSave = async () => {
    if (!editingUser) return

    setIsSaving(true)
    try {
      await updateUser(editingUser.id, {
        role_id: assignedRole,
        department_id: assignedDept || undefined,
        status: assignedStatus
      })

      showSuccess('Success', `Account settings for ${editingUser.full_name} updated successfully.`)
      setEditingUser(null)
      fetchUsersList()
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update user profile')
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
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
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
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold">
                    {editingUser.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">{editingUser.full_name}</div>
                    <div className="text-xs text-slate-400 font-mono">IC: {editingUser.ic_number}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Peranan (Role)</label>
                    <select
                      value={assignedRole}
                      onChange={(e) => setAssignedRole(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.role_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Jabatan (Department)</label>
                    <select
                      value={assignedDept}
                      onChange={(e) => setAssignedDept(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="">Tiada Jabatan (No Department)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Status Akaun (Account Status)</label>
                    <select
                      value={assignedStatus}
                      onChange={(e) => setAssignedStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending Review</option>
                    </select>
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
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
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
