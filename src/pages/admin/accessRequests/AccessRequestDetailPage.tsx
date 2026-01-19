import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  User,
  Hash,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  Shield,
  Clock,
  AlertCircle,
  FileText,
  ChevronLeft
} from 'lucide-react'
import { Button, Badge, Avatar, LoadingOverlay, Modal, Select, Textarea } from '@/components/ui'
import { AdminPageLayout } from '@/components/admin'
import { getAccessRequestById, approveAccessRequest, rejectAccessRequest } from '@/services/accessRequestManagementService'
import { getAllRoles } from '@/services/roleService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, ACCESS_REQUEST_STATUS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import type { AccessRequestWithRelations, Role } from '@/types'

// Helper functions kept as is
const mapJawatanToRole = (jawatan: string): string[] => {
  const jawatanLower = jawatan.toLowerCase()
  if (jawatanLower.includes('farmasi') || jawatanLower.includes('pharmacy') || jawatanLower.includes('pharmacist')) {
    if (jawatanLower.includes('pengarah') || jawatanLower.includes('director') || jawatanLower.includes('ketua')) return ['pharmacist']
    if (jawatanLower.includes('penolong') || jawatanLower.includes('assistant') || jawatanLower.includes('pembantu')) return ['assistant_pharmacist']
    return ['pharmacist', 'assistant_pharmacist']
  }
  if (jawatanLower.includes('doktor') || jawatanLower.includes('doctor') || jawatanLower.includes('perubatan') || jawatanLower.includes('medical officer')) {
    if (jawatanLower.includes('ketua') || jawatanLower.includes('director') || jawatanLower.includes('pengarah')) return ['hospital_director', 'medical_officer']
    if (jawatanLower.includes('penolong') || jawatanLower.includes('assistant')) return ['senior_assistant_medical_officer', 'assistant_medical_officer']
    return ['medical_officer']
  }
  if (jawatanLower.includes('jururawat') || jawatanLower.includes('nurse') || jawatanLower.includes('matron') || jawatanLower.includes('sister')) {
    if (jawatanLower.includes('matron')) return ['matron']
    if (jawatanLower.includes('sister')) return ['sister']
    return ['nurse']
  }
  if (jawatanLower.includes('makmal') || jawatanLower.includes('lab') || jawatanLower.includes('laboratory') || jawatanLower.includes('mlt')) {
    if (jawatanLower.includes('patologi') || jawatanLower.includes('pathologist')) return ['pathologist']
    return ['medical_lab_technician']
  }
  if (jawatanLower.includes('radiologi') || jawatanLower.includes('radiology') || jawatanLower.includes('x-ray')) return ['radiographer']
  if (jawatanLower.includes('pemandu') || jawatanLower.includes('driver')) return ['hospital_driver']
  if (jawatanLower.includes('pembantu rawatan') || jawatanLower.includes('hca') || jawatanLower.includes('health care')) return ['general_service_assistant']
  if (jawatanLower.includes('tadbir') || jawatanLower.includes('admin') || jawatanLower.includes('pentadbiran') || jawatanLower.includes('administration')) return ['hospital_administrator']
  if (jawatanLower.includes('physio') || jawatanLower.includes('fisioterapi')) return ['physiotherapist']
  if (jawatanLower.includes('occupational') || jawatanLower.includes('cara kerja')) return ['occupational_therapist']
  return ['general_service_assistant']
}

const getRelevantRoles = (allRoles: Role[], jawatan?: string, hospitalId?: string): Role[] => {
  let filtered = allRoles.filter(r => {
    if (hospitalId) return !r.hospital_id || r.hospital_id === hospitalId
    return !r.hospital_id
  })
  filtered = filtered.filter(r => r.role_code !== 'system_admin' && r.role_code !== 'hospital_admin')
  if (jawatan) {
    const suggestedRoleCodes = mapJawatanToRole(jawatan)
    const suggestedRoles: Role[] = []
    const otherRoles: Role[] = []
    filtered.forEach(role => {
      if (suggestedRoleCodes.includes(role.role_code)) suggestedRoles.push(role)
      else otherRoles.push(role)
    })
    suggestedRoles.sort((a, b) => {
      return suggestedRoleCodes.indexOf(a.role_code) - suggestedRoleCodes.indexOf(b.role_code)
    })
    return [...suggestedRoles, ...otherRoles]
  }
  return filtered
}

export const AccessRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user: currentUser } = useAuthStore()
  const [request, setRequest] = useState<AccessRequestWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])

  useEffect(() => {
    if (requestId) fetchRequest()
  }, [requestId])

  const fetchRequest = async () => {
    if (!requestId || !currentUser) return
    setIsLoading(true)
    try {
      const isHospitalAdmin = currentUser.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
      const [requestData, roles] = await Promise.all([
        getAccessRequestById(requestId, currentUser.id),
        getAllRoles()
      ])

      if (requestData && isHospitalAdmin && currentUser.hospital_id) {
        if (requestData.hospital_id !== currentUser.hospital_id) {
          toast.error('Access Denied', 'You do not have permission to view access requests from other hospitals.')
          navigate(ROUTES.ADMIN_ACCESS_REQUESTS)
          return
        }
      }

      setRequest(requestData)
      setAvailableRoles(roles)

      if (requestData && roles.length > 0) {
        const relevantRoles = getRelevantRoles(roles, requestData.jawatan, requestData.hospital_id)
        if (relevantRoles.length > 0) setSelectedRoleId(relevantRoles[0].id)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load access request details'
      toast.error('Error', errorMessage)
      navigate(ROUTES.ADMIN_ACCESS_REQUESTS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!request || !currentUser || !selectedRoleId) {
      toast.error('Error', 'Please select a role for the user')
      return
    }
    setIsProcessing(true)
    try {
      const result = await approveAccessRequest(request.id, currentUser.id, selectedRoleId)
      if (result.success) {
        toast.success('Success', `Access request approved. User account created.`)
        navigate(ROUTES.ADMIN_ACCESS_REQUESTS)
      } else {
        toast.error('Error', result.error || 'Failed to approve access request')
      }
    } catch (error) {
      toast.error('Error', 'Failed to approve access request')
    } finally {
      setIsProcessing(false)
      setShowApproveModal(false)
    }
  }

  const handleReject = async () => {
    if (!request || !currentUser) return
    if (!rejectionReason.trim()) {
      toast.error('Error', 'Please provide a reason for rejection')
      return
    }
    setIsProcessing(true)
    try {
      const result = await rejectAccessRequest(request.id, currentUser.id, rejectionReason)
      if (result.success) {
        toast.success('Success', 'Access request rejected')
        navigate(ROUTES.ADMIN_ACCESS_REQUESTS)
      } else {
        toast.error('Error', result.error || 'Failed to reject access request')
      }
    } catch (error) {
      toast.error('Error', 'Failed to reject access request')
    } finally {
      setIsProcessing(false)
      setShowRejectModal(false)
      setRejectionReason('')
    }
  }

  if (isLoading) return <LoadingOverlay fullScreen message="Loading access request details..." />
  if (!request) return <div className="flex items-center justify-center h-64"><p className="text-slate-600">Access request not found</p></div>

  const actions = request.status === ACCESS_REQUEST_STATUS.PENDING ? (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        onClick={() => setShowRejectModal(true)}
        leftIcon={<XCircle className="w-4 h-4" />}
      >
        Reject
      </Button>
      <Button
        variant="primary"
        onClick={() => setShowApproveModal(true)}
        leftIcon={<CheckCircle className="w-4 h-4" />}
      >
        Approve
      </Button>
    </div>
  ) : null

  return (
    <AdminPageLayout
      title="Request Details"
      description={`Reviewing request from ${request.full_name}`}
      icon={User}
      breadcrumbs={[{ label: 'Access Requests', href: ROUTES.ADMIN_ACCESS_REQUESTS }, { label: 'Details' }]}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={cn(
          'p-4 rounded-xl border flex items-center gap-3',
          request.status === ACCESS_REQUEST_STATUS.PENDING && 'bg-amber-50 border-amber-200',
          request.status === ACCESS_REQUEST_STATUS.APPROVED && 'bg-emerald-50 border-emerald-200',
          request.status === ACCESS_REQUEST_STATUS.REJECTED && 'bg-rose-50 border-rose-200'
        )}>
          {request.status === ACCESS_REQUEST_STATUS.PENDING && <Clock className="w-6 h-6 text-amber-600" />}
          {request.status === ACCESS_REQUEST_STATUS.APPROVED && <CheckCircle className="w-6 h-6 text-emerald-600" />}
          {request.status === ACCESS_REQUEST_STATUS.REJECTED && <XCircle className="w-6 h-6 text-rose-600" />}

          <div className="flex-1">
            <p className="font-semibold text-slate-900 capitalize">
              Status: {request.status}
            </p>
            <p className="text-sm text-slate-600">
              Requested on {formatDate(request.created_at)}
              {request.reviewed_at && ` • Reviewed on ${formatDate(request.reviewed_at)}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start gap-6">
                <Avatar src={request.profile_photo_url} alt={request.full_name} name={request.full_name} size="xl" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{request.full_name}</h2>
                  <p className="text-slate-600 mb-4">{request.email}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={Hash} label="IC Number" value={request.ic_number} />
                    <InfoItem icon={Phone} label="Phone" value={request.phone_number} />
                    <InfoItem icon={Calendar} label="DOB" value={request.date_of_birth ? formatDate(request.date_of_birth) : 'N/A'} />
                    <InfoItem icon={User} label="Gender" value={request.gender || 'N/A'} />
                    <InfoItem icon={MapPin} label="Address" value={request.address || 'N/A'} fullWidth />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={Building2} label="Hospital" value={request.hospital?.hospital_name || 'N/A'} />
                <InfoItem icon={Briefcase} label="Department" value={request.department?.department_name || 'N/A'} />
                <InfoItem icon={Shield} label="Position" value={request.jawatan} fullWidth />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={User} label="Name" value={request.emergency_contact_name || 'N/A'} />
                <InfoItem icon={Phone} label="Phone" value={request.emergency_contact_phone || 'N/A'} />
                <InfoItem icon={User} label="Relationship" value={request.emergency_contact_relationship || 'N/A'} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {request.reviewed_at && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Info</h3>
                <div className="space-y-3">
                  <InfoItem icon={User} label="Reviewed By" value={request.reviewed_by_user?.full_name || 'N/A'} small />
                  <InfoItem icon={Clock} label="Date" value={formatDate(request.reviewed_at)} small />
                  {request.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-bold text-red-800 mb-1">Reason:</p>
                      <p className="text-sm text-red-700">{request.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Request">
          <div className="space-y-4">
            <p>Approve request for <strong>{request.full_name}</strong>?</p>
            <Select
              label="Assign Role"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              options={getRelevantRoles(availableRoles, request.jawatan, request.hospital_id).map(r => ({ value: r.id, label: r.role_name }))}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
              <Button onClick={handleApprove} isLoading={isProcessing} disabled={!selectedRoleId}>Confirm</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Request">
          <div className="space-y-4">
            <p>Reject request for <strong>{request.full_name}</strong>?</p>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} isLoading={isProcessing} disabled={!rejectionReason}>Reject</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminPageLayout>
  )
}

const InfoItem: React.FC<{ icon: any, label: string, value: string, fullWidth?: boolean, small?: boolean }> = ({ icon: Icon, label, value, fullWidth, small }) => (
  <div className={cn('flex items-start gap-3', fullWidth && 'md:col-span-2')}>
    <Icon className={cn('text-slate-400 mt-0.5', small ? 'w-4 h-4' : 'w-5 h-5')} />
    <div>
      <p className={cn('text-slate-500', small ? 'text-xs' : 'text-sm')}>{label}</p>
      <p className={cn('font-medium text-slate-900', small ? 'text-sm' : 'text-base')}>{value}</p>
    </div>
  </div>
)

export default AccessRequestDetailPage
