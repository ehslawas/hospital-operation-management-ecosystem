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
  AlertCircle,
  FileText,
  Boxes,
  Tag,
  Layers,
  RefreshCw,
  Printer,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Badge, Spinner, Input } from '@/components/ui'
import {
  getIndentRequestById,
  approveIndentRequest,
  rejectIndentRequest,
  getIndentItemsStockAvailability,
  canUserApproveIndent,
  getSkuUnit,
  type ItemStoreStockInfo,
} from '@/modules/distribution/services/indentService'
import { IndentIssuePrintView } from '@/modules/distribution/components/IndentIssuePrintView'
import type { IndentRequestWithRelations, IndentStatus } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

export const IndentRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'
  const { success: showSuccess, error: showError } = useToastStore()

  const [request, setRequest] = useState<IndentRequestWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real-time store stock & batch info for each line item
  const [stockInfoMap, setStockInfoMap] = useState<Record<string, ItemStoreStockInfo>>({})
  const [isStockLoading, setIsStockLoading] = useState(false)

  // Approval state: approved quantities per item ID
  const [approvedQtys, setApprovedQtys] = useState<Record<string, number>>({})
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)

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

      // Fetch real-time store stock, active batches & expiry dates
      if (res.data.items && res.data.items.length > 0) {
        setIsStockLoading(true)
        const stockRes = await getIndentItemsStockAvailability(hospitalId, res.data.items)
        if (stockRes.data) {
          setStockInfoMap(stockRes.data)
        }
        setIsStockLoading(false)
      }
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
    const rejectorName = user?.full_name || (user as any)?.name || 'Pharmacist'
    const res = await rejectIndentRequest(id, user?.id || 'user-pharm-01', rejectReason, rejectorName)
    setIsProcessing(false)
    if (res.error) {
      showError(res.error)
    } else {
      showSuccess('Indent Request Rejected.')
      setShowRejectInput(false)
      void loadDetail()
    }
  }

  const renderStatusBadge = (status: IndentStatus) => {
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-md shadow-rose-950/70">
          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          REJECTED
        </span>
      )
    }
    const map: Record<IndentStatus, { variant: 'warning' | 'info' | 'success' | 'error' | 'gray'; label: string }> = {
      draft: { variant: 'gray', label: 'Draft' },
      pending: { variant: 'warning', label: 'Pending Store Approval' },
      approved: { variant: 'info', label: 'Approved (Ready to Issue)' },
      rejected: { variant: 'error', label: 'Rejected' },
      issued: { variant: 'info', label: 'Issued from Store' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'gray', label: 'Cancelled' },
    }
    const cfg = map[status] || { variant: 'gray', label: status }
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
      <div className="p-6 bg-slate-950 min-h-screen text-slate-100 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-sm font-semibold">{error || 'Indent Request not found'}</p>
        <Button onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_INDENT)}>
          Back to Requests
        </Button>
      </div>
    )
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'N/A') return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr || dateStr === 'N/A') return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  const getExpiryStatusBadge = (dateStr?: string) => {
    if (!dateStr || dateStr === 'N/A') return null
    try {
      const exp = new Date(dateStr)
      const now = new Date()
      const diffTime = exp.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Expired
          </span>
        )
      } else if (diffDays <= 90) {
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {diffDays}d left
          </span>
        )
      }
      return null
    } catch {
      return null
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 w-full">
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintOpen(true)}
            className="text-xs font-semibold bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white px-3 py-1.5"
          >
            <Printer className="w-4 h-4 mr-1.5 text-emerald-400" /> Cetak Borang Indent (KEW.PS-11)
          </Button>

          {request.status === 'approved' && (
            <Button
              onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_ISSUE)}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium"
            >
              Go to Issue Counter <Package className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Prominent Rejection Banner */}
      {request.status === 'rejected' && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-4 shadow-xl shadow-rose-950/50 animate-fade-in">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-200">Indent Request Rejected</h3>
              <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Status: Rejected
              </span>
            </div>
            <p className="text-xs text-rose-300/95 font-medium leading-relaxed bg-rose-950/60 p-2.5 rounded-xl border border-rose-900/60">
              <span className="text-rose-400 font-bold">Reason for Rejection:</span> "{request.rejection_reason || 'No reason specified'}"
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Rejected by: <strong className="text-slate-200 font-semibold">{request.approver?.full_name || 'Store Pharmacist'}</strong></span>
              {request.updated_at && (
                <span className="text-slate-500">on {formatDateTime(request.updated_at)}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Meta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Requesting Dept (From) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> Requesting Unit (From)
          </p>
          <p className="text-sm font-bold text-slate-100">
            {request.requesting_department?.department_name || 'Department'}
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3 text-slate-500" /> Requested by: {request.requester?.full_name || 'Staff'}
          </p>
        </div>

        {/* 2. Fulfilling Dept (To / Target) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Target Fulfilling Dept (To)
          </p>
          <p className="text-sm font-bold text-emerald-300">
            {request.fulfilling_department?.department_name || 'Pharmacy logistic'}
          </p>
          <p className="text-[11px] text-emerald-400/80 font-medium">
            🎯 Authorized unit for stock approval & issuing
          </p>
        </div>

        {/* 3. Key Dates & Priority */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Dates & Priority
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Request Date:</span>
            <span className="text-slate-200 font-medium">
              {formatDateTime(request.request_date)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Priority:</span>
            <span className="text-amber-400 font-semibold uppercase">{request.priority}</span>
          </div>
        </div>

        {/* 4. Status & Approval Info */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Status & Approval
          </p>
          {request.status === 'rejected' ? (
            <p className="text-xs text-rose-400">
              Rejected by: <span className="font-semibold text-slate-200">{request.approver?.full_name || 'Officer'}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{formatDateTime(request.updated_at)}</span>
            </p>
          ) : request.approved_by ? (
            <p className="text-xs text-slate-300">
              Approved by: <span className="font-semibold text-emerald-400">{request.approver?.full_name || 'Officer'}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{formatDateTime(request.approved_at || request.updated_at)}</span>
            </p>
          ) : (
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending Approval
            </p>
          )}
          {request.issued_at && (
            <p className="text-xs text-teal-400">
              Issued on: {formatDateTime(request.issued_at)}
            </p>
          )}
        </div>
      </div>

      {/* Item Lines Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" /> Requested Line Items & Store Availability
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live inventory stock, available batches and expiry dates from Pharmacy Main Store
            </p>
          </div>
          {isStockLoading && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing Store Stock...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3 pl-4 min-w-[200px]">Item Code & Description</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-center min-w-[130px]">Store Stock Available</th>
                <th className="p-3 min-w-[140px]">Batch No.</th>
                <th className="p-3 min-w-[140px]">Expiry Date</th>
                <th className="p-3 text-center min-w-[130px]">Batch Qty</th>
                <th className="p-3 text-center min-w-[110px]">Req Qty</th>
                <th className="p-3 text-center min-w-[120px]">Approved Qty</th>
                <th className="p-3 text-center min-w-[110px]">Issued Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {request.items?.map((item) => {
                const stock = stockInfoMap[item.id]
                const availableStock = stock?.available_stock ?? 0
                const isSufficient = availableStock >= item.qty_requested
                const isOutOfStock = availableStock <= 0
                
                const rawUnit =
                  stock?.sku_unit ||
                  stock?.unit ||
                  (item.unit && item.unit !== 'TAB/VIAL' && item.unit !== 'PCS/PKT' ? item.unit : '')

                const displaySku = getSkuUnit(stock?.packaging || rawUnit, rawUnit)

                const formatQtyWithSku = (qty: number, sku: string) => {
                  const lower = sku.toLowerCase()
                  if (
                    lower.includes('bottle') ||
                    lower.includes('tube') ||
                    lower.includes('vial') ||
                    lower.includes('ampoule') ||
                    lower.includes('syringe') ||
                    lower.includes('pack') ||
                    lower.includes('bag') ||
                    lower.includes('box') ||
                    lower.includes('can')
                  ) {
                    return `${qty} x ${sku}`
                  }
                  return `${qty} ${sku}`
                }

                const hasBatches = stock && stock.batches && stock.batches.length > 0

                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Item Code & Description */}
                    <td className="p-3 pl-4 max-w-xs">
                      <p className="font-semibold text-slate-100 leading-snug">{item.item_name}</p>
                      <p className="font-mono text-[11px] text-emerald-400 font-bold mt-0.5">{item.item_code}</p>
                    </td>

                    {/* Type */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.item_type === 'drug'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}
                      >
                        {item.item_type.toUpperCase()}
                      </span>
                    </td>

                    {/* Total Store Stock Available */}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 font-bold text-xs">
                          <span
                            className={
                              isOutOfStock
                                ? 'text-rose-400 font-extrabold'
                                : isSufficient
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }
                          >
                            {availableStock.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            x {displaySku}
                          </span>
                        </div>

                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-2.5 h-2.5" /> Out of Stock
                            </span>
                          ) : isSufficient ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Sufficient
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Batch Number */}
                    <td className="p-3">
                      {hasBatches ? (
                        <div className="space-y-1.5">
                          {stock.batches.map((b, bIdx) => (
                            <div key={bIdx} className="min-h-[28px] flex flex-col justify-center">
                              <span className="font-mono text-emerald-400 font-bold text-xs">
                                {b.batch_number}
                              </span>
                              {b.location && (
                                <span className="text-[10px] text-slate-500 truncate">
                                  Loc: {b.location}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : item.batch_number ? (
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          {item.batch_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">—</span>
                      )}
                    </td>

                    {/* Expiry Date */}
                    <td className="p-3">
                      {hasBatches ? (
                        <div className="space-y-1.5">
                          {stock.batches.map((b, bIdx) => {
                            const expStatus = getExpiryStatusBadge(b.expiry_date)
                            return (
                              <div key={bIdx} className="min-h-[28px] flex items-center gap-1.5">
                                <span className="text-xs text-amber-300 font-medium">
                                  {formatDate(b.expiry_date)}
                                </span>
                                {expStatus}
                              </div>
                            )
                          })}
                        </div>
                      ) : item.expiry_date ? (
                        <span className="text-xs text-amber-300 font-medium">
                          {formatDate(item.expiry_date)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">—</span>
                      )}
                    </td>

                    {/* Batch Quantity */}
                    <td className="p-3 text-center">
                      {hasBatches ? (
                        <div className="space-y-1.5">
                          {stock.batches.map((b, bIdx) => (
                            <div key={bIdx} className="min-h-[28px] flex items-center justify-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 font-semibold text-[11px] font-mono">
                                {formatQtyWithSku(b.quantity, displaySku)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">—</span>
                      )}
                    </td>

                    {/* Requested Qty */}
                    <td className="p-3 text-center font-bold text-slate-200">
                      {formatQtyWithSku(item.qty_requested, displaySku)}
                    </td>

                    {/* Approved Qty */}
                    <td className="p-3 text-center">
                      {request.status === 'pending' && canUserApproveIndent(user, request) ? (
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={Math.min(item.qty_requested, availableStock > 0 ? availableStock : item.qty_requested)}
                            value={approvedQtys[item.id] !== undefined ? approvedQtys[item.id] : item.qty_requested}
                            onChange={(e) =>
                              setApprovedQtys((prev) => ({
                                ...prev,
                                [item.id]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-20 text-center mx-auto bg-slate-950 border-slate-800 text-xs py-1 font-bold text-emerald-400"
                          />
                          <span className="text-[10px] text-slate-400 font-medium">
                            x {displaySku}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-400">
                          {formatQtyWithSku(item.qty_approved ?? item.qty_requested, displaySku)}
                        </span>
                      )}
                    </td>

                    {/* Issued Qty */}
                    <td className="p-3 text-center font-bold text-teal-300">
                      {item.qty_issued !== undefined ? formatQtyWithSku(item.qty_issued, displaySku) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Store Approval Bar */}
        {request.status === 'pending' && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            {canUserApproveIndent(user, request) ? (
              !showRejectInput ? (
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
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20"
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
              )
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold text-amber-200">Menunggu Kelulusan Dari Unit Penerima</p>
                  <p className="text-amber-300/80 text-[11px] mt-0.5">
                    Hanya staf yang bertugas di <strong>{request.fulfilling_department?.department_name || 'Pharmacy logistic'}</strong> atau Pentadbir Sistem (Admin) dibenarkan untuk meluluskan atau menolak permohonan indent ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Government Print Document Modal */}
      <IndentIssuePrintView
        requestId={id || null}
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
      />
    </div>
  )
}

export default IndentRequestDetailPage
