// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Hash,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  Shield,
  Clock,
  AlertCircle,
  UserPlus,
  FileText,
} from 'lucide-react'
import { Button, Badge, Avatar, LoadingOverlay, Modal, Select, Textarea } from '@/components/ui'
import { getAccessRequestById, approveAccessRequest, rejectAccessRequest } from '@/services/accessRequestManagementService'
import { getAllRoles } from '@/services/roleService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES, ACCESS_REQUEST_STATUS, SYSTEM_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AccessRequestWithRelations, Role } from '@/types'

/**
 * Map jawatan (job position) to suggested role codes
 * This helps auto-select appropriate roles based on the applicant's job position
 */
const mapJawatanToRole = (jawatan: string): string[] => {
  const jawatanLower = jawatan.toLowerCase()
  
  // Pharmacy roles
  if (jawatanLower.includes('farmasi') || jawatanLower.includes('pharmacy') || jawatanLower.includes('pharmacist')) {
    if (jawatanLower.includes('pengarah') || jawatanLower.includes('director') || jawatanLower.includes('ketua')) {
      return ['pharmacy_manager']
    }
    if (jawatanLower.includes('pegawai') || jawatanLower.includes('officer') || jawatanLower.includes('pharmacist')) {
      return ['pharmacist', 'pharmacy_manager']
    }
    if (jawatanLower.includes('penolong') || jawatanLower.includes('assistant') || jawatanLower.includes('pembantu')) {
      return ['pharmacy_assistant', 'pharmacy_staff']
    }
    return ['pharmacy_staff', 'pharmacy_assistant', 'pharmacist']
  }
  
  // Medical roles
  if (jawatanLower.includes('doktor') || jawatanLower.includes('doctor') || jawatanLower.includes('perubatan')) {
    return ['doctor']
  }
  if (jawatanLower.includes('jururawat') || jawatanLower.includes('nurse') || jawatanLower.includes('sister')) {
    if (jawatanLower.includes('penolong') || jawatanLower.includes('assistant')) {
      return ['nursing_assistant', 'nurse']
    }
    return ['nurse', 'nursing_assistant']
  }
  
  // IT roles
  if (jawatanLower.includes('teknologi maklumat') || jawatanLower.includes('it') || jawatanLower.includes('komputer')) {
    return ['it_staff']
  }
  
  // Administrative roles
  if (jawatanLower.includes('tadbir') || jawatanLower.includes('admin') || jawatanLower.includes('pentadbiran')) {
    return ['admin_staff']
  }
  
  // Default to general staff
  return ['staff', 'admin_staff']
}

/**
 * Filter and sort roles based on jawatan
 */
const getRelevantRoles = (allRoles: Role[], jawatan?: string, hospitalId?: string): Role[] => {
  // Filter by hospital
  let filtered = allRoles.filter(r => {
    if (hospitalId) {
      return !r.hospital_id || r.hospital_id === hospitalId
    }
    return !r.hospital_id
  })
  
  // Exclude admin roles from suggestions (they should be manually assigned)
  filtered = filtered.filter(r => 
    r.role_code !== 'system_admin' && r.role_code !== 'hospital_admin'
  )
  
  // If jawatan is provided, prioritize matching roles
  if (jawatan) {
    const suggestedRoleCodes = mapJawatanToRole(jawatan)
    const suggestedRoles: Role[] = []
    const otherRoles: Role[] = []
    
    filtered.forEach(role => {
      if (suggestedRoleCodes.includes(role.role_code)) {
        suggestedRoles.push(role)
      } else {
        otherRoles.push(role)
      }
    })
    
    // Sort suggested roles by priority (order in suggestedRoleCodes array)
    suggestedRoles.sort((a, b) => {
      const aPriority = suggestedRoleCodes.indexOf(a.role_code)
      const bPriority = suggestedRoleCodes.indexOf(b.role_code)
      return aPriority - bPriority
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
    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  const fetchRequest = async () => {
    if (!requestId || !currentUser) return

    setIsLoading(true)
    try {
      // SECURITY: Validate access before fetching
      const isHospitalAdmin = currentUser.role?.role_code === SYSTEM_ROLES.HOSPITAL_ADMIN
      
      // Fetch roles and request in parallel
      const [requestData, roles] = await Promise.all([
        getAccessRequestById(requestId, currentUser.id), // Pass user ID for validation
        getAllRoles()
      ])
      
      // SECURITY: Additional UI-level check for Hospital Admins
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
        // Get relevant roles based on jawatan and hospital
        const relevantRoles = getRelevantRoles(
          roles, 
          requestData.jawatan, 
          requestData.hospital_id
        )
        
        // Set default role based on jawatan (first suggested role)
        if (relevantRoles.length > 0) {
          setSelectedRoleId(relevantRoles[0].id)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load access request details'
      toast.error('Error', errorMessage.includes('Access denied') || errorMessage.includes('permission') 
        ? errorMessage 
        : 'Failed to load access request details')
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
        toast.success('Success', `Access request approved. User account created with Employee ID: ${result.employeeId || 'N/A'}`)
        navigate(ROUTES.ADMIN_ACCESS_REQUESTS)
      } else {
        toast.error('Error', result.error || 'Failed to approve access request')
      }
    } catch (error) {
      toast.error('Error', 'Failed to approve access request')
      console.error('Error approving request:', error)
    } finally {
      setIsProcessing(false)
      setShowApproveModal(false)
    }
  }

  const handleReject = async () => {
    if (!request || !currentUser) {
      return
    }

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
      console.error('Error rejecting request:', error)
    } finally {
      setIsProcessing(false)
      setShowRejectModal(false)
      setRejectionReason('')
    }
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading access request details..." />
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Access request not found</p>
      </div>
    )
  }

  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  } as const

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  } as const

  const StatusIcon = statusIcons[request.status] || Clock

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN_ACCESS_REQUESTS)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back to Requests
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Access Request Details</h1>
        </div>
        {request.status === ACCESS_REQUEST_STATUS.PENDING && (
          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              onClick={() => setShowRejectModal(true)}
              leftIcon={<XCircle className="w-5 h-5" />}
            >
              Reject Request
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowApproveModal(true)}
              leftIcon={<CheckCircle className="w-5 h-5" />}
            >
              Approve Request
            </Button>
          </div>
        )}
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 rounded-xl border flex items-center gap-3',
          request.status === ACCESS_REQUEST_STATUS.PENDING && 'bg-amber-50 border-amber-200',
          request.status === ACCESS_REQUEST_STATUS.APPROVED && 'bg-green-50 border-green-200',
          request.status === ACCESS_REQUEST_STATUS.REJECTED && 'bg-red-50 border-red-200'
        )}
      >
        <StatusIcon
          className={cn(
            'w-6 h-6',
            request.status === ACCESS_REQUEST_STATUS.PENDING && 'text-amber-600',
            request.status === ACCESS_REQUEST_STATUS.APPROVED && 'text-green-600',
            request.status === ACCESS_REQUEST_STATUS.REJECTED && 'text-red-600'
          )}
        />
        <div className="flex-1">
          <p className="font-semibold text-slate-900">
            Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </p>
          <p className="text-sm text-slate-600">
            Requested on {formatDate(request.created_at)}
            {request.reviewed_at && ` â€¢ Reviewed on ${formatDate(request.reviewed_at)}`}
          </p>
        </div>
        <Badge variant={statusColors[request.status]}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-start gap-6">
              <Avatar
                src={request.profile_photo_url}
                alt={request.full_name}
                fallback={request.full_name.charAt(0)}
                size="xl"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{request.full_name}</h2>
                <p className="text-slate-600 mb-4">{request.email}</p>

                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={Hash} label="IC Number" value={request.ic_number} />
                  <InfoItem icon={Phone} label="Phone" value={request.phone_number} />
                  <InfoItem
                    icon={Calendar}
                    label="Date of Birth"
                    value={request.date_of_birth ? formatDate(request.date_of_birth) : 'N/A'}
                  />
                  <InfoItem
                    icon={User}
                    label="Gender"
                    value={request.gender ? request.gender.charAt(0).toUpperCase() + request.gender.slice(1) : 'N/A'}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Address"
                    value={request.address || 'N/A'}
                    fullWidth
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Department Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Department & Role Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={Building2}
                label="Hospital"
                value={request.hospital?.hospital_name || 'N/A'}
              />
              <InfoItem
                icon={Briefcase}
                label="Department"
                value={request.department?.department_name || 'N/A'}
              />
              <InfoItem
                icon={Shield}
                label="Position (Jawatan)"
                value={request.jawatan}
                fullWidth
              />
            </div>
          </motion.div>

          {/* Emergency Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={User}
                label="Contact Name"
                value={request.emergency_contact_name || 'N/A'}
              />
              <InfoItem
                icon={Phone}
                label="Contact Phone"
                value={request.emergency_contact_phone || 'N/A'}
              />
              <InfoItem
                icon={User}
                label="Relationship"
                value={request.emergency_contact_relationship || 'N/A'}
              />
              {request.emergency_contact_address && (
                <InfoItem
                  icon={MapPin}
                  label="Contact Address"
                  value={request.emergency_contact_address}
                  fullWidth
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review Information */}
          {request.reviewed_at && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Information</h3>
              <div className="space-y-3">
                <InfoItem
                  icon={User}
                  label="Reviewed By"
                  value={request.reviewed_by_user?.full_name || 'N/A'}
                  small
                />
                <InfoItem
                  icon={Clock}
                  label="Reviewed At"
                  value={formatDate(request.reviewed_at)}
                  small
                />
                {request.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-800">{request.rejection_reason}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Request Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <TimelineItem
                icon={FileText}
                title="Request Submitted"
                date={formatDate(request.created_at)}
                active
              />
              {request.reviewed_at && (
                <TimelineItem
                  icon={request.status === ACCESS_REQUEST_STATUS.APPROVED ? CheckCircle : XCircle}
                  title={
                    request.status === ACCESS_REQUEST_STATUS.APPROVED
                      ? 'Request Approved'
                      : 'Request Rejected'
                  }
                  date={formatDate(request.reviewed_at)}
                  active
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Access Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to approve this access request? A user account will be created for{' '}
            <strong>{request.full_name}</strong>.
          </p>

          <Select
            label="Assign Role"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            required
            helperText={request?.jawatan ? `Suggested based on job position: ${request.jawatan}` : undefined}
            options={(() => {
              // Get relevant roles based on jawatan and hospital
              const relevantRoles = getRelevantRoles(
                availableRoles,
                request?.jawatan,
                request?.hospital_id
              )
              
              return relevantRoles.map((r) => ({
                value: r.id,
                label: r.role_name,
              }))
            })()}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              isLoading={isProcessing}
              disabled={!selectedRoleId}
              leftIcon={<CheckCircle className="w-5 h-5" />}
            >
              Approve & Create Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Access Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to reject this access request from <strong>{request.full_name}</strong>?
          </p>

          <Textarea
            label="Rejection Reason"
            placeholder="Please provide a reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              isLoading={isProcessing}
              disabled={!rejectionReason.trim()}
              leftIcon={<XCircle className="w-5 h-5" />}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface InfoItemProps {
  icon: React.ElementType
  label: string
  value: string
  fullWidth?: boolean
  small?: boolean
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, fullWidth, small }) => (
  <div className={cn('flex items-start gap-3', fullWidth && 'md:col-span-2')}>
    <Icon className={cn('text-slate-400 flex-shrink-0 mt-0.5', small ? 'w-4 h-4' : 'w-5 h-5')} />
    <div className="flex-1 min-w-0">
      <p className={cn('text-slate-500', small ? 'text-xs' : 'text-sm')}>{label}</p>
      <p className={cn('font-semibold text-slate-900 mt-0.5', small ? 'text-sm' : 'text-base')}>
        {value}
      </p>
    </div>
  </div>
)

interface TimelineItemProps {
  icon: React.ElementType
  title: string
  date: string
  active?: boolean
}

const TimelineItem: React.FC<TimelineItemProps> = ({ icon: Icon, title, date, active }) => (
  <div className="flex items-start gap-3">
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
        active ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
      )}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 pt-1">
      <p className={cn('font-medium', active ? 'text-slate-900' : 'text-slate-500')}>{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{date}</p>
    </div>
  </div>
)

export default AccessRequestDetailPage

