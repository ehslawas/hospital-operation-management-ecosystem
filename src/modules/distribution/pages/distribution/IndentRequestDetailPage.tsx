// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Badge, Spinner, Input } from '@/components/ui'
import {
  getIndentRequestById,
  approveIndentRequest,
  rejectIndentRequest,
} from '@/modules/distribution/services/indentService'
import type { IndentRequestWithRelations, IndentStatus } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

export const IndentRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  const [request, setRequest] = useState<IndentRequestWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Approval state: approved quantities per item ID
  const [approvedQtys, setApprovedQtys] = useState<Record<string, number>>({})
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    const res = await getIndentRequestById(id)
    if (res.error) {
      setError(res.error)
    } else if (res.data) {
      setRequest(res.data)
      const qtyMap: Record<string, number> = {}
      res.data.items?.forEach((it) => {
        qtyMap[it.id] = it.qty_approved !== undefined ? it.qty_approved : it.qty_requested
      })
      setApprovedQtys(qtyMap)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void loadDetail()
  }, [id])

  const handleApprove = async () => {
    if (!id) return
    setIsProcessing(true)
    const res = await approveIndentRequest(id, user?.id || 'user-pharm-01', approvedQtys)
    setIsProcessing(false)
    if (res.error) {
      showError(res.error)
    } else {
      showSuccess('Indent Request Approved! Ready for Issue Counter picking.')
      void loadDetail()
    }
  }

  const handleReject = async () => {
    if (!id) return
    if (!rejectReason.trim()) {
      showError('Please state reason for rejection.')
      return
    }
    setIsProcessing(true)
    const res = await rejectIndentRequest(id, user?.id || 'user-pharm-01', rejectReason)
    setIsProcessing(false)
    if (res.error) {
      showError(res.error)
    } else {
      showSuccess('Indent Request Rejected.')
      void loadDetail()
    }
  }

  const renderStatusBadge = (status: IndentStatus) => {
    const map: Record<IndentStatus, { variant: 'warning' | 'info' | 'success' | 'danger' | 'neutral'; label: string }> = {
      draft: { variant: 'neutral', label: 'Draft' },
      pending: { variant: 'warning', label: 'Pending Store Approval' },
      approved: { variant: 'info', label: 'Approved (Ready to Issue)' },
      rejected: { variant: 'danger', label: 'Rejected' },
      issued: { variant: 'info', label: 'Issued from Store' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'neutral', label: 'Cancelled' },
    }
    const cfg = map[status] || { variant: 'neutral', label: status }
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_INDENT)}
          className="text-slate-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Indent List
        </Button>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error || 'Indent Request not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_INDENT)}
            className="text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-emerald-400">
                {request.indent_number}
              </h1>
              {renderStatusBadge(request.status)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Department Indent Details & Approval Controls
            </p>
          </div>
        </div>

        {request.status === 'approved' && (
          <Button
            onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_ISSUE)}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium"
          >
            Go to Issue Counter <Package className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>

      {/* Meta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Requesting Department
          </p>
          <p className="text-sm font-bold text-slate-100">
            {request.requesting_department?.department_name || 'Nephrology Department'}
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3" /> Requested by: {request.requester?.full_name || 'Department Officer'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Key Dates & Priority
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Requested Date:</span>
            <span className="text-slate-200 font-medium">
              {new Date(request.request_date).toLocaleDateString('en-MY')}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Required Date:</span>
            <span className="text-slate-200 font-medium">{request.required_date || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Priority:</span>
            <span className="text-amber-400 font-semibold uppercase">{request.priority}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Status & Approval Info
          </p>
          {request.approved_by && (
            <p className="text-xs text-slate-300">
              Approved by: <span className="font-semibold">{request.approver?.full_name || 'Pharmacist'}</span>
            </p>
          )}
          {request.issued_at && (
            <p className="text-xs text-teal-400">
              Issued on: {new Date(request.issued_at).toLocaleDateString('en-MY')}
            </p>
          )}
          {request.rejection_reason && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              Reason: {request.rejection_reason}
            </div>
          )}
          {request.notes && (
            <p className="text-xs text-slate-400 italic">Notes: "{request.notes}"</p>
          )}
        </div>
      </div>

      {/* Item Lines Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" /> Requested Line Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-2.5">Item Code & Description</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5 text-center">Req Qty</th>
                <th className="p-2.5 text-center">Approved Qty</th>
                <th className="p-2.5 text-center">Issued Qty</th>
                <th className="p-2.5">Batch / Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {request.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="p-2.5">
                    <p className="font-semibold text-slate-100">{item.item_name}</p>
                    <p className="font-mono text-[10px] text-emerald-400">{item.item_code}</p>
                  </td>
                  <td className="p-2.5 uppercase text-[10px] text-slate-400 font-semibold">
                    {item.item_type}
                  </td>
                  <td className="p-2.5 text-center font-semibold text-slate-200">
                    {item.qty_requested} {item.unit}
                  </td>
                  <td className="p-2.5 text-center">
                    {request.status === 'pending' ? (
                      <Input
                        type="number"
                        min={0}
                        max={item.qty_requested}
                        value={approvedQtys[item.id] !== undefined ? approvedQtys[item.id] : item.qty_requested}
                        onChange={(e) =>
                          setApprovedQtys((prev) => ({
                            ...prev,
                            [item.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-20 text-center mx-auto bg-slate-950 border-slate-800 text-xs py-1"
                      />
                    ) : (
                      <span className="font-bold text-emerald-400">
                        {item.qty_approved ?? item.qty_requested} {item.unit}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-teal-300">
                    {item.qty_issued !== undefined ? `${item.qty_issued} ${item.unit}` : '—'}
                  </td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-400">
                    {item.batch_number ? (
                      <div>
                        <p className="text-slate-200">BN: {item.batch_number}</p>
                        <p className="text-[10px] text-slate-500">Exp: {item.expiry_date}</p>
                      </div>
                    ) : (
                      'Pending Issue'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Store Approval Bar */}
        {request.status === 'pending' && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            {!showRejectInput ? (
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  disabled={isProcessing}
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Indent Request
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-3">
                <label className="block text-xs font-semibold text-rose-400">
                  Reason for Rejection:
                </label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State reason why this indent cannot be fulfilled..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs text-slate-200"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRejectInput(false)}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="bg-rose-600 hover:bg-rose-500 text-xs text-white"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default IndentRequestDetailPage
