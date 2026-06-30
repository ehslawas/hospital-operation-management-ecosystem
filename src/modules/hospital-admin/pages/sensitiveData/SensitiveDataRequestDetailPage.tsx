// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  AlertCircle,
  Ban,
} from 'lucide-react'
import { Button, Badge, Input, Textarea, Modal } from '@/components/ui'
import {
  getSensitiveDataRequestById,
  approveSensitiveDataRequest,
  denySensitiveDataRequest,
  revokeAccess,
} from '@/services/sensitiveDataRequestService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { formatDate, cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { SensitiveDataRequestWithRelations, SensitiveDataRequestStatus, SensitiveDataCategory } from '@/types'

const statusConfig: Record<SensitiveDataRequestStatus, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock, label: 'Pending Review' },
  approved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Approved' },
  denied: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle, label: 'Denied' },
  expired: { color: 'text-gray-500', bgColor: 'bg-gray-100', icon: Clock, label: 'Expired' },
  revoked: { color: 'text-red-500', bgColor: 'bg-red-50', icon: Ban, label: 'Revoked' },
}

const categoryLabels: Record<SensitiveDataCategory, { label: string; description: string }> = {
  phi: { label: 'Personal Health Information', description: 'Medical history, diagnosis, treatment plans, lab results' },
  financial: { label: 'Financial Information', description: 'Billing records, insurance details, payment history' },
  contact: { label: 'Contact Information', description: 'Emergency contacts, next of kin, address details' },
  all: { label: 'Complete Record', description: 'Full access to all patient data' },
}

const urgencyLabels = {
  routine: { label: 'Routine', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  urgent: { label: 'Urgent', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  emergency: { label: 'Emergency', color: 'text-red-600', bgColor: 'bg-red-100' },
}

export const SensitiveDataRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  
  const [request, setRequest] = useState<SensitiveDataRequestWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDenyModal, setShowDenyModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  
  // Form data
  const [accessDuration, setAccessDuration] = useState('1')
  const [denialReason, setDenialReason] = useState('')

  const fetchRequest = useCallback(async () => {
    if (!requestId) return
    
    setIsLoading(true)
    try {
      const data = await getSensitiveDataRequestById(requestId)
      setRequest(data)
      if (data) {
        setAccessDuration(data.access_duration_hours.toString())
      }
    } catch (error) {
      showError('Error', 'Failed to load request details')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  const handleApprove = async () => {
    if (!request || !user) return
    
    setIsProcessing(true)
    try {
      await approveSensitiveDataRequest(request.id, user.id, parseInt(accessDuration))
      showSuccess('Approved', 'Access request has been approved')
      setShowApproveModal(false)
      fetchRequest()
    } catch (error) {
      showError('Error', 'Failed to approve request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeny = async () => {
    if (!request || !user || !denialReason.trim()) return
    
    setIsProcessing(true)
    try {
      await denySensitiveDataRequest(request.id, user.id, denialReason)
      showSuccess('Denied', 'Access request has been denied')
      setShowDenyModal(false)
      fetchRequest()
    } catch (error) {
      showError('Error', 'Failed to deny request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRevoke = async () => {
    if (!request || !user) return
    
    setIsProcessing(true)
    try {
      await revokeAccess(request.id, user.id)
      showSuccess('Revoked', 'Access has been revoked')
      setShowRevokeModal(false)
      fetchRequest()
    } catch (error) {
      showError('Error', 'Failed to revoke access')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Request not found</h2>
        <Button variant="ghost" onClick={() => navigate(ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS)} className="mt-4">
          Back to list
        </Button>
      </div>
    )
  }

  const statusConf = statusConfig[request.status]
  const StatusIcon = statusConf.icon
  const categoryInfo = categoryLabels[request.data_category]
  const urgencyInfo = urgencyLabels[request.urgency]
  const isPending = request.status === 'pending'
  const isApproved = request.status === 'approved'
  const isAccessActive = isApproved && request.access_expires_at && new Date(request.access_expires_at) > new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', statusConf.bgColor)}>
              <StatusIcon className={cn('w-6 h-6', statusConf.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Access Request Review</h1>
              <Badge variant={
                request.status === 'pending' ? 'warning' :
                request.status === 'approved' ? 'success' :
                request.status === 'denied' ? 'error' : 'gray'
              }>
                {statusConf.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isPending && (
            <>
              <Button
                variant="danger"
                onClick={() => setShowDenyModal(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Deny
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowApproveModal(true)}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Approve
              </Button>
            </>
          )}
          {isAccessActive && (
            <Button
              variant="danger"
              onClick={() => setShowRevokeModal(true)}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Revoke Access
            </Button>
          )}
        </div>
      </motion.div>

      {/* Urgency Banner */}
      {request.urgency !== 'routine' && isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'rounded-xl p-4 border',
            request.urgency === 'emergency' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          )}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'w-5 h-5',
              request.urgency === 'emergency' ? 'text-red-600' : 'text-amber-600'
            )} />
            <p className={cn(
              'font-medium',
              request.urgency === 'emergency' ? 'text-red-900' : 'text-amber-900'
            )}>
              {request.urgency === 'emergency' 
                ? 'EMERGENCY REQUEST - Requires immediate attention'
                : 'URGENT REQUEST - Priority review needed'
              }
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Patient Name</p>
                <p className="font-medium text-gray-900">{request.patient_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IC Number</p>
                <p className="font-medium text-gray-900">{request.patient_ic}</p>
              </div>
            </div>
          </motion.div>

          {/* Data Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              Data Category Requested
            </h3>
            <div className={cn(
              'p-4 rounded-lg',
              request.data_category === 'all' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
            )}>
              <p className="font-medium text-gray-900">{categoryInfo.label}</p>
              <p className="text-sm text-gray-600 mt-1">{categoryInfo.description}</p>
            </div>
            {request.data_category === 'all' && (
              <div className="flex items-center gap-2 mt-3 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Full access requested - review carefully</span>
              </div>
            )}
          </motion.div>

          {/* Justification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Justification
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.justification}</p>
          </motion.div>

          {/* Denial Reason (if denied) */}
          {request.status === 'denied' && request.denial_reason && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-red-50 rounded-xl border border-red-200 p-6"
            >
              <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Denial Reason
              </h3>
              <p className="text-red-800">{request.denial_reason}</p>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Request Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Urgency</p>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium mt-1',
                  urgencyInfo.bgColor, urgencyInfo.color
                )}>
                  {urgencyInfo.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Requested Duration</p>
                <p className="font-medium text-gray-900">{request.access_duration_hours} hour(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Request Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(request.created_at, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {request.approved_at && (
                <div>
                  <p className="text-sm text-gray-500">Reviewed Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(request.approved_at, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              {request.access_expires_at && (
                <div>
                  <p className="text-sm text-gray-500">Access Expires</p>
                  <p className={cn(
                    'font-medium',
                    new Date(request.access_expires_at) > new Date() ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {formatDate(request.access_expires_at, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Requestor Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Requested By</h3>
            {request.requestor ? (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{request.requestor.full_name}</p>
                <p className="text-sm text-gray-500">{request.requestor.email}</p>
                <p className="text-sm text-gray-500">{request.requestor.jawatan}</p>
              </div>
            ) : (
              <p className="text-gray-500">Unknown</p>
            )}
          </motion.div>

          {/* Reviewer Info */}
          {request.approved_by_user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Reviewed By</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{request.approved_by_user.full_name}</p>
                <p className="text-sm text-gray-500">{request.approved_by_user.email}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Access Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to approve access to <strong>{categoryInfo.label}</strong> for patient <strong>{request.patient_name}</strong>.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Duration (hours)
            </label>
            <Select
              value={accessDuration}
              onChange={(e) => setAccessDuration(e.target.value)}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="24">24 hours</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              isLoading={isProcessing}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Approve Access
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deny Modal */}
      <Modal
        isOpen={showDenyModal}
        onClose={() => setShowDenyModal(false)}
        title="Deny Access Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for denying this request.
          </p>
          
          <Textarea
            label="Denial Reason"
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="Enter the reason for denial..."
            rows={4}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowDenyModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeny}
              isLoading={isProcessing}
              disabled={!denialReason.trim()}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Deny Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        title="Revoke Access"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to revoke access for this request? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowRevokeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRevoke}
              isLoading={isProcessing}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Revoke Access
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Select component for the modal
const Select: React.FC<{
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}> = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  >
    {children}
  </select>
)

export default SensitiveDataRequestDetailPage

