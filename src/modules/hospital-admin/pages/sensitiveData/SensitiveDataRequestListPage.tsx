// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  User,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { Button, Input, Select, Badge, Pagination, Avatar } from '@/components/ui'
import { getSensitiveDataRequests, getPendingRequestsCount } from '@/services/sensitiveDataRequestService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { formatDate, cn } from '@/lib/utils'
import { ROUTES, SENSITIVE_DATA_CATEGORY, SENSITIVE_DATA_REQUEST_STATUS, SENSITIVE_DATA_URGENCY, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import type { SensitiveDataRequestWithRelations, SensitiveDataRequestStatus, SensitiveDataUrgency, SensitiveDataCategory } from '@/types'

const statusConfig: Record<SensitiveDataRequestStatus, { color: string; bgColor: string; icon: React.ElementType; variant: 'success' | 'error' | 'warning' | 'gray' }> = {
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock, variant: 'warning' },
  approved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, variant: 'success' },
  denied: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle, variant: 'error' },
  expired: { color: 'text-gray-500', bgColor: 'bg-gray-100', icon: Clock, variant: 'gray' },
  revoked: { color: 'text-red-500', bgColor: 'bg-red-50', icon: XCircle, variant: 'error' },
}

const urgencyConfig: Record<SensitiveDataUrgency, { color: string; label: string }> = {
  routine: { color: 'text-gray-600', label: 'Routine' },
  urgent: { color: 'text-amber-600', label: 'Urgent' },
  emergency: { color: 'text-red-600', label: 'Emergency' },
}

const categoryLabels: Record<SensitiveDataCategory, string> = {
  phi: 'Personal Health Info',
  financial: 'Financial',
  contact: 'Contact Info',
  all: 'All Data',
}

export const SensitiveDataRequestListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { error: showError } = useToastStore()
  
  const [requests, setRequests] = useState<SensitiveDataRequestWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Pending counts
  const [pendingCounts, setPendingCounts] = useState<{
    total: number
    routine: number
    urgent: number
    emergency: number
  }>({ total: 0, routine: 0, urgent: 0, emergency: 0 })

  const hospitalId = user?.hospital_id || ''

  const fetchRequests = useCallback(async () => {
    if (!hospitalId) return
    
    setIsLoading(true)
    try {
      const result = await getSensitiveDataRequests({
        page: currentPage,
        pageSize,
        hospitalId,
        status: statusFilter as SensitiveDataRequestStatus | 'all',
        urgency: urgencyFilter as SensitiveDataUrgency | 'all',
        category: categoryFilter as SensitiveDataCategory | 'all',
        search: search || undefined,
      })

      setRequests(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      showError('Error', 'Failed to load requests')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [hospitalId, currentPage, pageSize, statusFilter, urgencyFilter, categoryFilter, search])

  const fetchPendingCounts = useCallback(async () => {
    if (!hospitalId) return
    
    try {
      const counts = await getPendingRequestsCount(hospitalId)
      setPendingCounts(counts)
    } catch (error) {
      console.error('Failed to fetch pending counts:', error)
    }
  }, [hospitalId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  useEffect(() => {
    fetchPendingCounts()
  }, [fetchPendingCounts])

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 p-8 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Sensitive Data Access Requests</h1>
                <p className="text-rose-100 text-sm">Review and approve requests to access sensitive patient data</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchRequests}
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

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{pendingCounts.total}</p>
            <p className="text-sm font-medium text-slate-600">Pending Requests</p>
            <p className="text-xs text-slate-500">Awaiting review</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{pendingCounts.emergency}</p>
            <p className="text-sm font-medium text-slate-600">Emergency</p>
            <p className="text-xs text-slate-500">High priority</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{pendingCounts.urgent}</p>
            <p className="text-sm font-medium text-slate-600">Urgent</p>
            <p className="text-xs text-slate-500">Requires attention</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{pendingCounts.routine}</p>
            <p className="text-sm font-medium text-slate-600">Routine</p>
            <p className="text-xs text-slate-500">Standard priority</p>
          </div>
        </div>
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
              placeholder="Search by patient name, IC number, or requester..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-40 h-11 border-slate-300 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              {Object.entries(SENSITIVE_DATA_REQUEST_STATUS).map(([key, value]) => (
                <option key={value} value={value}>
                  {key.replace('_', ' ')}
                </option>
              ))}
            </Select>
            <Select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-40 h-11 border-slate-300 focus:border-primary-500"
            >
              <option value="all">All Urgency</option>
              {Object.entries(SENSITIVE_DATA_URGENCY).map(([key, value]) => (
                <option key={value} value={value}>
                  {key}
                </option>
              ))}
            </Select>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-48 h-11 border-slate-300 focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(SENSITIVE_DATA_CATEGORY).map(([key, value]) => (
                <option key={value} value={value}>
                  {categoryLabels[value as SensitiveDataCategory]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Request List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Access Requests
            </h2>
            <Badge variant="gray" size="sm">
              {total} {total === 1 ? 'request' : 'requests'}
            </Badge>
          </div>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto animate-spin mb-4" />
            <p className="text-slate-500">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No requests found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {requests.map((request, index) => {
                const statusConf = statusConfig[request.status]
                const StatusIcon = statusConf.icon
                const urgencyConf = urgencyConfig[request.urgency]
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`${ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}/${request.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        statusConf.bgColor
                      )}>
                        <StatusIcon className={cn('w-5 h-5', statusConf.color)} />
                      </div>

                      {/* Request Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-sm font-semibold', urgencyConf.color)}>
                            [{urgencyConf.label}]
                          </span>
                          <Badge variant={statusConf.variant} size="sm">
                            {request.status}
                          </Badge>
                          <Badge variant="gray" size="sm">
                            {categoryLabels[request.data_category]}
                          </Badge>
                        </div>

                        <p className="font-medium text-gray-900">
                          Patient: {request.patient_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          IC: {request.patient_ic}
                        </p>

                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {request.justification}
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.requestor?.full_name || 'Unknown'}
                          </span>
                          <span>
                            Requested: {formatDate(request.created_at)}
                          </span>
                          {request.access_duration_hours && (
                            <span>
                              Duration: {request.access_duration_hours}h
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`${ROUTES.ADMIN_SENSITIVE_DATA_REQUESTS}/${request.id}`)
                        }}
                        leftIcon={<Eye className="w-4 h-4" />}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        Review
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 bg-slate-50/50">
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
    </div>
  )
}

export default SensitiveDataRequestListPage

