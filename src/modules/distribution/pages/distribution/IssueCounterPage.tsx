// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  Package,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Send,
  AlertCircle,
  QrCode,
  Calendar,
  Layers,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Input, Badge } from '@/components/ui'
import {
  getIndentRequests,
  issueIndentRequest,
} from '@/modules/distribution/services/indentService'
import type { IndentRequestWithRelations } from '@/types/pharmacy'

export const IssueCounterPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'
  const { success: showSuccess, error: showError } = useToastStore()

  const [queue, setQueue] = useState<IndentRequestWithRelations[]>([])
  const [selectedRequest, setSelectedRequest] = useState<IndentRequestWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Form state for issuing items
  const [issueForm, setIssueForm] = useState<
    Record<
      string,
      {
        qty_issued: number
        batch_number: string
        expiry_date: string
      }
    >
  >({})

  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadQueue = async () => {
    setIsLoading(true)
    const res = await getIndentRequests(hospitalId, { status: 'approved' })
    if (res.data) {
      setQueue(res.data.data)
      if (res.data.data.length > 0) {
        selectRequestForIssuing(res.data.data[0])
      } else {
        setSelectedRequest(null)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void loadQueue()
  }, [hospitalId])

  const selectRequestForIssuing = (req: IndentRequestWithRelations) => {
    setSelectedRequest(req)
    const initialForm: Record<string, { qty_issued: number; batch_number: string; expiry_date: string }> = {}
    req.items?.forEach((it) => {
      initialForm[it.id] = {
        qty_issued: it.qty_approved ?? it.qty_requested,
        batch_number: it.batch_number || `BN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        expiry_date: it.expiry_date || '2028-06-30',
      }
    })
    setIssueForm(initialForm)
  }

  const handleIssueSubmit = async () => {
    if (!selectedRequest) return
    setIsSubmitting(true)

    const issuedItemsPayload = Object.entries(issueForm).map(([itemId, val]) => ({
      item_id: itemId,
      qty_issued: val.qty_issued,
      batch_number: val.batch_number,
      expiry_date: val.expiry_date,
    }))

    const res = await issueIndentRequest(
      selectedRequest.id,
      user?.id || 'user-pharm-01',
      issuedItemsPayload
    )

    setIsSubmitting(false)

    if (res.error) {
      showError(res.error)
    } else {
      showSuccess(`Indent ${selectedRequest.indent_number} successfully issued to department!`)
      void loadQueue()
    }
  }

  const filteredQueue = queue.filter(
    (q) =>
      q.indent_number.toLowerCase().includes(search.toLowerCase()) ||
      q.requesting_department?.department_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/60 border border-teal-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Store Issue Counter (Kaunter Pengeluaran)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick approved drug & non-drug items, enter batch numbers & expiry dates, and dispatch to departments
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Queue List */}
          <div className="lg:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Approved Queue ({queue.length})
              </h2>
              <span className="text-[11px] text-teal-400 font-semibold">Ready to Issue</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <Input
                placeholder="Filter queue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-200"
              />
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
              {filteredQueue.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No approved indents waiting for issue.
                </div>
              ) : (
                filteredQueue.map((req) => {
                  const isSelected = selectedRequest?.id === req.id
                  return (
                    <div
                      key={req.id}
                      onClick={() => selectRequestForIssuing(req)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/40 shadow-lg shadow-teal-500/5'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {req.indent_number}
                        </span>
                        {req.priority === 'urgent' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold animate-pulse">
                            ⚡ URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-1">
                        {req.requesting_department?.department_name || 'Nephrology Dept'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{req.items?.length || 0} line items</span>
                        <span>{new Date(req.request_date).toLocaleDateString('en-MY')}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Issuing Workstation */}
          <div className="lg:col-span-2 space-y-5">
            {!selectedRequest ? (
              <div className="p-12 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-center text-slate-500">
                Select an approved request from the queue to start issuing items.
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-5 shadow-xl">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold font-mono text-emerald-400">
                        {selectedRequest.indent_number}
                      </h2>
                      <Badge variant="info">Approved</Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-400" />
                      {selectedRequest.requesting_department?.department_name || 'Nephrology Department'}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400">
                    <p>Requester: <span className="text-slate-200 font-medium">{selectedRequest.requester?.full_name || 'Staff Nurse'}</span></p>
                    <p>Required Date: <span className="text-slate-200 font-medium">{selectedRequest.required_date || '—'}</span></p>
                  </div>
                </div>

                {/* Items to Issue Form */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-400" /> Item Picking & Batch Assignment
                  </h3>

                  <div className="space-y-3">
                    {selectedRequest.items?.map((item) => {
                      const currentVal = issueForm[item.id] || {
                        qty_issued: item.qty_approved ?? item.qty_requested,
                        batch_number: '',
                        expiry_date: '',
                      }

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-100">{item.item_name}</p>
                              <p className="text-[10px] font-mono text-emerald-400">
                                Code: {item.item_code} | Type: {item.item_type.toUpperCase()}
                              </p>
                            </div>
                            <div className="text-xs text-slate-400">
                              Approved Qty:{' '}
                              <span className="font-bold text-emerald-400">
                                {item.qty_approved ?? item.qty_requested} {item.unit}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                                Qty Issued ({item.unit})
                              </label>
                              <Input
                                type="number"
                                min={1}
                                max={item.qty_approved ?? item.qty_requested}
                                value={currentVal.qty_issued}
                                onChange={(e) =>
                                  setIssueForm((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      qty_issued: parseInt(e.target.value) || 0,
                                    },
                                  }))
                                }
                                className="bg-slate-900 border-slate-800 text-xs text-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                                Batch Number (No. Batch)
                              </label>
                              <Input
                                type="text"
                                value={currentVal.batch_number}
                                onChange={(e) =>
                                  setIssueForm((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      batch_number: e.target.value,
                                    },
                                  }))
                                }
                                className="bg-slate-900 border-slate-800 text-xs font-mono text-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                                Expiry Date (Tarikh Luput)
                              </label>
                              <Input
                                type="date"
                                value={currentVal.expiry_date}
                                onChange={(e) =>
                                  setIssueForm((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      expiry_date: e.target.value,
                                    },
                                  }))
                                }
                                className="bg-slate-900 border-slate-800 text-xs text-slate-100"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Dispatch Button */}
                <div className="flex items-center justify-end pt-3 border-t border-slate-800/80">
                  <Button
                    onClick={handleIssueSubmit}
                    disabled={isSubmitting}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs px-6 py-2.5 shadow-lg shadow-teal-600/20"
                  >
                    <Send className="w-4 h-4 mr-2" /> Mark as Issued & Dispatch Stock
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default IssueCounterPage
