import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  Filter,
  Send,
  Calendar,
  Edit,
} from 'lucide-react'
import { Button, Input, Select, Badge, Pagination, Modal, Textarea } from '@/components/ui'
import { getMemos, getMemoCountsByStatus, approveMemo, rejectMemo, publishMemo } from '@/services/memoService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { formatDate, cn } from '@/lib/utils'
import { MEMO_STATUS, MEMO_TYPES, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import type { MemoWithRelations, MemoStatus, MemoType, MemoPriority } from '@/types'

const statusConfig: Record<MemoStatus, { color: string; bgColor: string; icon: React.ElementType; variant: 'success' | 'error' | 'warning' | 'gray' | 'primary' }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Edit, variant: 'gray' },
  pending_approval: { color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock, variant: 'warning' },
  approved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, variant: 'success' },
  rejected: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle, variant: 'error' },
  published: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Send, variant: 'primary' },
  archived: { color: 'text-gray-500', bgColor: 'bg-gray-50', icon: FileText, variant: 'gray' },
}

const typeConfig: Record<MemoType, { label: string; color: string }> = {
  announcement: { label: 'Announcement', color: 'bg-blue-100 text-blue-700' },
  policy: { label: 'Policy', color: 'bg-purple-100 text-purple-700' },
  event: { label: 'Event', color: 'bg-green-100 text-green-700' },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-700' },
  maintenance: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
}

const priorityConfig: Record<MemoPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-500' },
  normal: { label: 'Normal', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-amber-500' },
  urgent: { label: 'Urgent', color: 'text-red-500' },
}

export const MemoListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  
  const [memos, setMemos] = useState<MemoWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Counts
  const [statusCounts, setStatusCounts] = useState<Record<MemoStatus, number>>({
    draft: 0,
    pending_approval: 0,
    approved: 0,
    rejected: 0,
    published: 0,
    archived: 0,
  })
  
  // Action modals
  const [selectedMemo, setSelectedMemo] = useState<MemoWithRelations | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const hospitalId = user?.hospital_id || ''

  const fetchMemos = useCallback(async () => {
    if (!hospitalId) return
    
    setIsLoading(true)
    try {
      const result = await getMemos({
        page: currentPage,
        pageSize,
        hospitalId,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        memoType: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
      })

      setMemos(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load memos')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [hospitalId, currentPage, pageSize, statusFilter, typeFilter, search])

  const fetchCounts = useCallback(async () => {
    if (!hospitalId) return
    
    try {
      const counts = await getMemoCountsByStatus(hospitalId)
      setStatusCounts(counts)
    } catch (error) {
      console.error('Failed to fetch counts:', error)
    }
  }, [hospitalId])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  const handleApprove = async () => {
    if (!selectedMemo || !user) return
    
    setIsProcessing(true)
    try {
      await approveMemo(selectedMemo.id, user.id)
      showSuccess('Approved', 'Memo has been approved')
      setShowApproveModal(false)
      setSelectedMemo(null)
      fetchMemos()
      fetchCounts()
    } catch (error) {
      showError('Error', 'Failed to approve memo')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedMemo || !user || !rejectionReason.trim()) return
    
    setIsProcessing(true)
    try {
      await rejectMemo(selectedMemo.id, user.id, rejectionReason)
      showSuccess('Rejected', 'Memo has been rejected')
      setShowRejectModal(false)
      setSelectedMemo(null)
      setRejectionReason('')
      fetchMemos()
      fetchCounts()
    } catch (error) {
      showError('Error', 'Failed to reject memo')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePublish = async (memo: MemoWithRelations) => {
    setIsProcessing(true)
    try {
      await publishMemo(memo.id)
      showSuccess('Published', 'Memo has been published')
      fetchMemos()
      fetchCounts()
    } catch (error) {
      showError('Error', 'Failed to publish memo')
    } finally {
      setIsProcessing(false)
    }
  }

  const pendingCount = statusCounts.pending_approval

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Memo Approval</h1>
                <p className="text-violet-100 text-sm">Review and approve memo posts for publication</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchMemos}
              disabled={isLoading}
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
            >
              Refresh
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </motion.div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">
                {pendingCount} Memo{pendingCount > 1 ? 's' : ''} Pending Approval
              </h3>
              <p className="text-sm text-amber-700">Review and approve memos before they can be published</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        <button
          onClick={() => { setStatusFilter('all'); setCurrentPage(1) }}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
        </button>
        {Object.entries(statusCounts).map(([status, count]) => {
          const config = statusConfig[status as MemoStatus]
          return (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
                statusFilter === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <span className={cn(
                'px-1.5 py-0.5 rounded text-xs',
                statusFilter === status ? 'bg-white/20' : config.bgColor
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search memos by title, content, or author..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-12 h-11 border-slate-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-48 h-11 border-slate-300 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              {Object.entries(MEMO_TYPES).map(([key, value]) => (
                <option key={value} value={value}>
                  {typeConfig[value as MemoType].label}
                </option>
              ))}
            </Select>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setCurrentPage(1) }}
            className="text-slate-600 hover:text-slate-900"
          >
            Reset Filters
          </Button>
        </div>
      </motion.div>

      {/* Memo List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary-600" />
              Memos
            </h2>
            <Badge variant="gray" size="sm">
              {total} {total === 1 ? 'memo' : 'memos'}
            </Badge>
          </div>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto animate-spin mb-4" />
            <p className="text-gray-500">Loading memos...</p>
          </div>
        ) : memos.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No memos found</h3>
            <p className="text-gray-500">There are no memos matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {memos.map((memo, index) => {
                const statusConf = statusConfig[memo.status]
                const StatusIcon = statusConf.icon
                const typeConf = typeConfig[memo.memo_type]
                const priorityConf = priorityConfig[memo.priority]
                const isPending = memo.status === 'pending_approval'
                const isApproved = memo.status === 'approved'
                
                return (
                  <motion.div
                    key={memo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        statusConf.bgColor
                      )}>
                        <StatusIcon className={cn('w-5 h-5', statusConf.color)} />
                      </div>

                      {/* Memo Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            typeConf.color
                          )}>
                            {typeConf.label}
                          </span>
                          <Badge variant={statusConf.variant} size="sm">
                            {memo.status.replace('_', ' ')}
                          </Badge>
                          <span className={cn('text-xs font-medium', priorityConf.color)}>
                            {priorityConf.label} Priority
                          </span>
                        </div>

                        <h4 className="font-medium text-gray-900">{memo.title}</h4>
                        
                        <div 
                          className="text-sm text-gray-600 mt-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: memo.content.replace(/<[^>]*>/g, ' ').slice(0, 150) + '...' }}
                        />

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>By: {memo.created_by_user?.full_name || 'Unknown'}</span>
                          <span>Created: {formatDate(memo.created_at)}</span>
                          {memo.publish_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Publish: {formatDate(memo.publish_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isPending && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMemo(memo)
                                setShowRejectModal(true)
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedMemo(memo)
                                setShowApproveModal(true)
                              }}
                              leftIcon={<CheckCircle className="w-4 h-4" />}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                        {isApproved && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePublish(memo)}
                            isLoading={isProcessing}
                            leftIcon={<Send className="w-4 h-4" />}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setCurrentPage(1)
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => { setShowApproveModal(false); setSelectedMemo(null) }}
        title="Approve Memo"
      >
        {selectedMemo && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedMemo.title}</h4>
              <div 
                className="text-sm text-gray-600 mt-2"
                dangerouslySetInnerHTML={{ __html: selectedMemo.content }}
              />
            </div>
            
            <p className="text-gray-600">
              Are you sure you want to approve this memo? Once approved, it can be published.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => { setShowApproveModal(false); setSelectedMemo(null) }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                isLoading={isProcessing}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Approve Memo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setSelectedMemo(null); setRejectionReason('') }}
        title="Reject Memo"
      >
        {selectedMemo && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedMemo.title}</h4>
            </div>
            
            <Textarea
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              rows={4}
              required
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => { setShowRejectModal(false); setSelectedMemo(null); setRejectionReason('') }}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={isProcessing}
                disabled={!rejectionReason.trim()}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject Memo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MemoListPage

