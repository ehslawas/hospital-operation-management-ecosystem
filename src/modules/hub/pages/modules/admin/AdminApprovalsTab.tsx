import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  User,
  Mail,
  Hash,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  AlertCircle,
  Check,
  X
} from 'lucide-react'
import { getAccessRequests, approveAccessRequest, rejectAccessRequest } from '@/services/accessRequestManagementService'
import { getAllRoles } from '@/services/roleService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'
import type { AccessRequestWithRelations, Role } from '@/types'

export const AdminApprovalsTab: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastStore()
  const { user: currentLoggedUser } = useAuthStore()

  const [requests, setRequests] = useState<AccessRequestWithRelations[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  // Selected request details modal
  const [selectedRequest, setSelectedRequest] = useState<AccessRequestWithRelations | null>(null)
  const [assignedRole, setAssignedRole] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Rejection modal
  const [rejectionRequest, setRejectionRequest] = useState<AccessRequestWithRelations | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAccessRequests({
        page: 1,
        pageSize: 100,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      })
      setRequests(result.data || [])
    } catch (error) {
      showError('Error', 'Failed to load registration requests')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, showError])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  useEffect(() => {
    const fetchRolesList = async () => {
      try {
        const rolesList = await getAllRoles()
        // Filter out system administrator roles for safety
        setRoles(rolesList.filter((r) => r.role_code !== 'system_admin'))
      } catch (err) {
        console.error(err)
      }
    }
    fetchRolesList()
  }, [])

  const handleOpenApproval = (req: AccessRequestWithRelations) => {
    setSelectedRequest(req)
    
    // Attempt role auto-suggestion
    const title = req.jawatan.toLowerCase()
    let suggestedRole = roles.find(r => r.role_code === 'pharmacist')?.id || ''
    if (title.includes('nurse') || title.includes('jururawat')) {
      suggestedRole = roles.find(r => r.role_code === 'nurse')?.id || ''
    } else if (title.includes('assistant') || title.includes('penolong') || title.includes('pembantu')) {
      suggestedRole = roles.find(r => r.role_code === 'pharmacy_assistant')?.id || ''
    } else if (title.includes('director') || title.includes('pengarah') || title.includes('ketua')) {
      suggestedRole = roles.find(r => r.role_code === 'pharmacy_manager')?.id || ''
    } else if (title.includes('admin') || title.includes('kerani')) {
      suggestedRole = roles.find(r => r.role_code === 'admin_staff')?.id || ''
    }
    setAssignedRole(suggestedRole || (roles.length > 0 ? roles[0].id : ''))
  }

  const handleApprove = async () => {
    if (!selectedRequest || !assignedRole) {
      showError('Error', 'Please assign a role.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await approveAccessRequest(
        selectedRequest.id,
        currentLoggedUser?.id || '',
        assignedRole
      )
      if (result && result.success) {
        showSuccess('Success', `${selectedRequest.full_name} has been approved as an active user.`)
        setSelectedRequest(null)
        fetchRequests()
      } else {
        showError('Error', result?.error || 'Failed to approve request')
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to approve request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenRejection = (req: AccessRequestWithRelations) => {
    setRejectionRequest(req)
    setRejectionReason('')
  }

  const handleReject = async () => {
    if (!rejectionRequest || !rejectionReason.trim()) {
      showError('Error', 'Please provide a reason for rejection.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await rejectAccessRequest(
        rejectionRequest.id,
        currentLoggedUser?.id || '',
        rejectionReason.trim()
      )
      if (result && result.success) {
        showSuccess('Success', `Registration for ${rejectionRequest.full_name} has been rejected.`)
        setRejectionRequest(null)
        fetchRequests()
      } else {
        showError('Error', result?.error || 'Failed to reject request')
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to reject request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header, Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Carian nama, no IC, jawatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === 'rejected'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === 'all'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Main Request Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        {isLoading ? (
          <div className="p-12 space-y-4">
            <div className="h-5 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-5 bg-white/5 rounded w-11/12 animate-pulse" />
            <div className="h-5 bg-white/5 rounded w-10/12 animate-pulse" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-600" />
            <div>
              <p className="text-white font-bold">No requests found</p>
              <p className="text-slate-500 text-sm mt-1">There are no pending registrations matching this filter.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Nama Pemohon</th>
                <th className="p-4">Maklumat KKM</th>
                <th className="p-4">Sebab Hubungan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 text-sm font-medium">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {req.profile_photo_url ? (
                          <img src={req.profile_photo_url} alt={req.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold">{req.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          {req.ic_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.jawatan}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.department?.department_name || 'No Dept'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{req.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{req.email}</span>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(req.status)}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenApproval(req)}
                        title="Lihat Maklumat / Luluskan"
                        className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500 hover:text-white transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleOpenRejection(req)}
                          title="Tolak"
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail & Approval Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden relative z-10 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-400" />
                  Semakan Maklumat Pendaftaran
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Demographics</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                        {selectedRequest.profile_photo_url ? (
                          <img src={selectedRequest.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-bold">{selectedRequest.full_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{selectedRequest.ic_number}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-24">Jawatan:</span>
                        <span className="font-semibold text-white">{selectedRequest.jawatan}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-24">Jabatan:</span>
                        <span className="text-white">{selectedRequest.department?.department_name || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2 font-mono">
                        <span className="text-slate-500 w-24">Emel:</span>
                        <span className="text-white">{selectedRequest.email}</span>
                      </div>
                      <div className="flex gap-2 font-mono">
                        <span className="text-slate-500 w-24">Telefon:</span>
                        <span className="text-white">{selectedRequest.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Emergency Contact</h4>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama:</span>
                        <span className="font-bold text-white">{selectedRequest.emergency_contact_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hubungan:</span>
                        <span className="text-white">{selectedRequest.emergency_contact_relationship || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">No Tel:</span>
                        <span className="text-white">{selectedRequest.emergency_contact_phone || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-slate-500">Alamat:</span>
                        <span className="text-slate-300 block bg-slate-950/40 p-2 rounded border border-white/5">
                          {selectedRequest.emergency_contact_address || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status-specific action panels */}
                {selectedRequest.status === 'pending' ? (
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Pemberian Akses (Access Settings)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-2">Pilih Peranan (Assign Role)</label>
                        <select
                          value={assignedRole}
                          onChange={(e) => setAssignedRole(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="">-- Sila pilih peranan --</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.role_name} ({r.role_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400 leading-relaxed font-medium">
                        <strong>Nota:</strong> No. Pekerja (Employee ID) akan ditetapkan secara automatik menggunakan No. IC pemohon (iaitu <code>{selectedRequest.ic_number.replace(/-/g, '')}</code>) selaras dengan tetapan pendaftaran KKM.
                      </div>
                    </div>
                  </div>
                ) : selectedRequest.status === 'rejected' ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                      <XCircle className="w-4 h-4" /> Ditolak (Registration Rejected)
                    </div>
                    <div>Sebab Penolakan: {selectedRequest.rejection_reason || 'Tiada sebab dinyatakan'}</div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                      <CheckCircle className="w-4 h-4" /> Diluluskan (Registration Active)
                    </div>
                    <div>Diluluskan oleh penyemak hospital pada {selectedRequest.reviewed_at ? formatDate(selectedRequest.reviewed_at) : 'N/A'}.</div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-slate-950/40 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Tutup
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedRequest(null)
                        handleOpenRejection(selectedRequest)
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting || !assignedRole}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? 'Approving...' : 'Approve & Activate'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Cause Modal */}
      <AnimatePresence>
        {rejectionRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectionRequest(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-500" />
                  Sebab Penolakan Pendaftaran
                </h3>
                <button
                  onClick={() => setRejectionRequest(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400">
                  Sila nyatakan sebab permohonan pendaftaran untuk <strong>{rejectionRequest.full_name}</strong> ditolak. Maklum balas ini akan dipaparkan kepada pemohon.
                </p>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  placeholder="E.g. No kad pengenalan (IC) tidak sepadan dengan rekod rasmi jawatan KKM."
                />
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-950/40 flex justify-end gap-3">
                <button
                  onClick={() => setRejectionRequest(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
