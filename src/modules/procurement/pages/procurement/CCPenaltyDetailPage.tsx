// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { updatePenaltyDetails, approvePenalty } from '@/services/pharmacy/penaltyService'
import { ChevronRight, Sparkles, ArrowLeft, Printer, Save, CheckCircle2, XCircle, FileText, Building2, Calendar, Package, AlertTriangle, Shield, Plus, Trash2, Lock, HelpCircle, Unlock } from 'lucide-react'
import { Spinner, SlideOver } from '@/components/ui'
import { PdfPreviewModal, PDFViewer } from '@/components/shared'
import { PurchaseOrderDetailView } from './PurchaseOrderDetailView'

interface Props {
  penalty: any
  onRefresh: () => void
}

export function CCPenaltyDetailPage({ penalty, onRefresh }: Props) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toast = useToastStore()
  const [saving, setSaving] = useState(false)
  const [isUnlockedForEditing, setIsUnlockedForEditing] = useState(false)
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
  const [editReason, setEditReason] = useState('')
  const [penaltyPaid, setPenaltyPaid] = useState<boolean>(penalty.penalty_paid || false)
  const isReadOnly = penalty.status === 'approved' && !isUnlockedForEditing
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLpoDrawerOpen, setIsLpoDrawerOpen] = useState(false)
  const [isPoDrawerOpen, setIsPoDrawerOpen] = useState(false)

  // Extract all items on this PO
  const poItems = useMemo(() => {
    if (penalty.purchase_order?.items && penalty.purchase_order.items.length > 0) {
      return penalty.purchase_order.items
    }
    const fallbackItemCode = penalty.item_code || penalty.order_tracking?.item_code || ''
    const fallbackItemName = penalty.item_name || penalty.order_tracking?.item_name || ''
    const fallbackUnitPrice = Number(penalty.unit_price || 0)
    const fallbackQuantity = Number(penalty.quantity || 0)
    return [{
      item_code: fallbackItemCode,
      item_name: fallbackItemName,
      unit_price: fallbackUnitPrice,
      quantity_ordered: fallbackQuantity,
      total_price: fallbackUnitPrice * fallbackQuantity
    }]
  }, [penalty])

  // Find matching PO item for legacy backward-compatibility fallbacks
  const matchingPoItem = useMemo(() => {
    const code = penalty.item_code || penalty.order_tracking?.item_code
    const name = penalty.item_name || penalty.order_tracking?.item_name
    return poItems.find((i: any) => 
      (code && i.item_code === code) || (name && i.item_name === name)
    ) || poItems[0]
  }, [poItems, penalty])

  const [totalOrderValue, setTotalOrderValue] = useState(() => {
    if (penalty.total_order_value) return Number(penalty.total_order_value)
    if (penalty.purchase_order?.total_amount) return Number(penalty.purchase_order.total_amount)
    const itemsSum = poItems.reduce((sum: number, item: any) => sum + Number(item.total_price || 0), 0)
    if (itemsSum > 0) return itemsSum
    return 0
  })
  const [kkmContract, setKkmContract] = useState(penalty.kkm_contract_number || penalty.order_tracking?.kkm_contract_number || '')
  const [paymentKaedah, setPaymentKaedah] = useState<number>(penalty.payment_kaedah || 1)
  const [selectedPenaltyType, setSelectedPenaltyType] = useState<string>(penalty.selected_penalty_type || 'minimum')

  // Dynamic signature states
  const [preparedById, setPreparedById] = useState(penalty.prepared_by_user_id || '')
  const [verifiedById, setVerifiedById] = useState(penalty.verified_by_user_id || '')
  const [approvedById, setApprovedById] = useState(penalty.approved_by || '')
  const [systemUsers, setSystemUsers] = useState<any[]>([])

  useEffect(() => {
    async function loadUsers() {
      try {
        const { getUsers } = await import('@/services/userService')
        const res = await getUsers({ pageSize: 150 })
        if (res.data) {
          setSystemUsers(res.data)
        }
      } catch (err) {
        console.error('Failed to load system users:', err)
      }
    }
    loadUsers()
  }, [])

  const selectedPreparedUser = useMemo(() => {
    return systemUsers.find(u => u.id === preparedById) || penalty.prepared_by
  }, [systemUsers, preparedById, penalty.prepared_by])

  const selectedVerifiedUser = useMemo(() => {
    return systemUsers.find(u => u.id === verifiedById) || penalty.verified_by
  }, [systemUsers, verifiedById, penalty.verified_by])

  const selectedApprovedUser = useMemo(() => {
    return systemUsers.find(u => u.id === approvedById) || penalty.approved_by_user
  }, [systemUsers, approvedById, penalty.approved_by_user])

  // Partial deliveries list state
  const [partialDeliveries, setPartialDeliveries] = useState<any[]>(() => {
    if (penalty.partial_deliveries && Array.isArray(penalty.partial_deliveries) && penalty.partial_deliveries.length > 0) {
      const firstItemCode = poItems[0]?.item_code || ''
      return penalty.partial_deliveries.map((del: any) => ({
        ...del,
        item_code: del.item_code || firstItemCode
      }))
    }
    const firstItemCode = poItems[0]?.item_code || ''
    const qty = penalty.quantity || matchingPoItem?.quantity_ordered || 0
    // Fallback/Legacy record handling
    return [
      {
        id: 'legacy-1',
        item_code: firstItemCode,
        delivery_number: '1st Delivery',
        date: penalty.actual_delivery_date || '',
        quantity: qty,
        days_late: penalty.days_delayed || 0,
        is_late: (penalty.days_delayed || 0) > 0,
      }
    ]
  })

  // Supplier info
  const supplier = penalty.supplier
  const lpo = penalty.lpo
  const po = penalty.purchase_order
  const tracking = penalty.order_tracking

  // Fetch GR history to initialize partial deliveries automatically if not set in DB
  useEffect(() => {
    if (penalty.po_id && (!penalty.partial_deliveries || penalty.partial_deliveries.length === 0)) {
      initializePartialDeliveries()
    }
  }, [penalty.po_id])

  const initializePartialDeliveries = async () => {
    try {
      const { getGoodsReceiptHistory } = await import('@/services/pharmacy/receivingService')
      const res = await getGoodsReceiptHistory(penalty.po_id)
      if (res.data && res.data.length > 0) {
        const grs = res.data
        const matches: any[] = []
        
        // Loop over each item on the PO
        poItems.forEach((poItem: any) => {
          let deliveryCount = 0
          
          // Sort goods receipts by receipt date ascending so that we index deliveries chronologically
          const sortedGrs = [...grs].sort((a: any, b: any) => new Date(a.receipt_date).getTime() - new Date(b.receipt_date).getTime())
          
          sortedGrs.forEach((gr: any) => {
            const itemMatch = gr.items?.find(
              (i: any) => i.po_item?.item_code === poItem.item_code || i.item_code === poItem.item_code
            )
            if (!itemMatch || !itemMatch.quantity_received) return

            // Calculate delay
            const expectedDate = penalty.expected_delivery_date || po?.expected_delivery_date || ''
            if (!expectedDate) return
            
            const expected = new Date(expectedDate)
            const actual = new Date(gr.receipt_date)
            expected.setHours(0, 0, 0, 0)
            actual.setHours(0, 0, 0, 0)

            const diffTime = actual.getTime() - expected.getTime()
            const diffDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0

            deliveryCount++
            matches.push({
              id: `${gr.id || 'gr'}-${poItem.item_code}-${deliveryCount}`,
              item_code: poItem.item_code,
              delivery_number: `${deliveryCount}${getOrdinalSuffix(deliveryCount)} Delivery`,
              date: gr.receipt_date,
              quantity: itemMatch.quantity_received || 0,
              days_late: diffDays,
              is_late: diffDays > 0,
            })
          })
        })

        if (matches.length > 0) {
          setPartialDeliveries(matches)
        }
      }
    } catch (err) {
      console.error('Failed to auto-initialize partial deliveries:', err)
    }
  }

  const getOrdinalSuffix = (i: number) => {
    const j = i % 10, k = i % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  // Delivery handlers
  const updateDelivery = (id: string, field: string, value: any) => {
    setPartialDeliveries(prev => prev.map(del => {
      if (del.id !== id) return del
      const updated = { ...del, [field]: value }
      if (field === 'days_late') {
        updated.is_late = value > 0
      }
      return updated
    }))
  }

  const addDeliveryRowForItem = (itemCode: string) => {
    const itemDels = partialDeliveries.filter(del => del.item_code === itemCode)
    const nextIdx = itemDels.length + 1
    setPartialDeliveries(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        item_code: itemCode,
        delivery_number: `${nextIdx}${getOrdinalSuffix(nextIdx)} Delivery`,
        date: new Date().toISOString().split('T')[0],
        quantity: 0,
        days_late: 0,
        is_late: false
      }
    ])
  }

  const removeDeliveryRow = (id: string) => {
    setPartialDeliveries(prev => prev.filter(del => del.id !== id))
  }

  // CC Penalty Calculation
  const calculation = useMemo(() => {
    let totalCalculated = 0
    let totalLateQty = 0
    let maxDaysLate = 0

    partialDeliveries.forEach(del => {
      const matchingItem = poItems.find((i: any) => i.item_code === del.item_code)
      const price = Number(matchingItem?.unit_price || penalty.unit_price || 0)
      
      if (del.days_late > 0) {
        const itemCalc = price * del.quantity * (del.days_late / 30) * 0.10
        totalCalculated += itemCalc
        totalLateQty += del.quantity
        if (del.days_late > maxDaysLate) {
          maxDaysLate = del.days_late
        }
      }
    })

    const min = Number(penalty.minimum_penalty_amount || 200)
    const final = selectedPenaltyType === 'minimum' ? Math.max(totalCalculated, min) : totalCalculated
    const balanceAfterPenalty = totalOrderValue - final
    const cdc = balanceAfterPenalty * 0.004
    const totalDeductions = final + cdc
    const netPayable = balanceAfterPenalty - cdc

    return {
      calculated: totalCalculated,
      minimum: min,
      final,
      cdc,
      totalDeductions,
      netPayable,
      totalLateQty,
      maxDaysLate
    }
  }, [poItems, partialDeliveries, totalOrderValue, selectedPenaltyType, penalty.minimum_penalty_amount, penalty.unit_price, paymentKaedah])

  const formatDate = (d?: string) => {
    if (!d) return 'â€”'
    return new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleTogglePaid = async () => {
    setSaving(true)
    try {
      const nextPaidState = !penaltyPaid
      const res = await updatePenaltyDetails(penalty.id, {
        penalty_paid: nextPaidState
      })
      if (res.error) throw new Error(res.error)
      setPenaltyPaid(nextPaidState)
      toast.success(
        nextPaidState ? 'Penalty Paid' : 'Penalty Unpaid',
        `Successfully marked penalty as ${nextPaidState ? 'Paid' : 'Unpaid'}.`
      )
      if (onRefresh) onRefresh()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to update payment status.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const finalNotes = editReason
        ? (penalty.notes ? penalty.notes + '\n' : '') + `[Edit Request - Reason: ${editReason}] by user ${user?.email || ''} at ${new Date().toLocaleString()}`
        : penalty.notes;

      const firstItem = poItems[0] || {}
      const res = await updatePenaltyDetails(penalty.id, {
        item_name: firstItem.item_name || '',
        item_code: firstItem.item_code || '',
        quantity: calculation.totalLateQty,
        unit_price: Number(firstItem.unit_price || 0),
        days_delayed: calculation.maxDaysLate,
        total_order_value: totalOrderValue,
        kkm_contract_number: kkmContract,
        payment_kaedah: paymentKaedah,
        selected_penalty_type: selectedPenaltyType,
        calculated_penalty_amount: calculation.calculated,
        penalty_amount: calculation.final,
        partial_deliveries: partialDeliveries,
        penalty_paid: penaltyPaid,
        notes: finalNotes,
        
        // Dynamic Signature Blocks
        prepared_by_user_id: preparedById || null,
        prepared_by_name: preparedById ? (selectedPreparedUser?.full_name || 'AMRI AMIT') : null,
        prepared_by_designation: preparedById ? (selectedPreparedUser?.jawatan || 'PENOLONG PEGAWAI FARMASI U5') : null,
        prepared_at: preparedById ? (penalty.prepared_at || new Date().toISOString()) : null,

        verified_by_user_id: verifiedById || null,
        verified_by_name: verifiedById ? (selectedVerifiedUser?.full_name || 'KAMRIAH BT HAJI MAIL') : null,
        verified_by_designation: verifiedById ? (selectedVerifiedUser?.jawatan || 'PENOLONG PEGAWAI FARMASI U7 TBK 2') : null,
        verified_at: verifiedById ? (penalty.verified_at || new Date().toISOString()) : null,

        approved_by: approvedById || null,
        approved_by_name: approvedById ? (selectedApprovedUser?.full_name || 'TAN YUAN ZHANG') : null,
        approved_by_designation: approvedById ? (selectedApprovedUser?.jawatan || 'PEGAWAI FARMASI UF 12') : null,
        approved_at: approvedById ? (penalty.approved_at || new Date().toISOString()) : null
      })
      if (res.error) throw new Error(res.error)
      toast.success('Saved', 'Penalty details updated successfully.')
      setIsUnlockedForEditing(false)
      setEditReason('')
      onRefresh()
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await handleSave()
      const res = await approvePenalty(penalty.id, user.id)
      if (res.error) throw new Error(res.error)
      toast.success('Approved', 'Penalty has been approved.')
      onRefresh()
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to approve.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = async () => {
    try {
      const firstItem = poItems[0] || {}
      const { generateCCPenaltyPdf } = await import('@/services/pharmacy/ccPenaltyPdfService')
      const doc = await generateCCPenaltyPdf({
        ...penalty,
        purchase_order: {
          ...penalty.purchase_order,
          items: poItems
        },
        item_name: firstItem.item_name || '',
        item_code: firstItem.item_code || '',
        quantity: calculation.totalLateQty,
        unit_price: Number(firstItem.unit_price || 0),
        days_delayed: calculation.maxDaysLate,
        total_order_value: totalOrderValue,
        kkm_contract_number: kkmContract,
        payment_kaedah: paymentKaedah,
        selected_penalty_type: selectedPenaltyType,
        calculated_penalty_amount: calculation.calculated,
        penalty_amount: calculation.final,
        minimum_penalty_amount: calculation.minimum,
        partial_deliveries: partialDeliveries,
        
        // Pass dynamic signatures for pdf printing
        prepared_by_user_id: preparedById || null,
        prepared_by_name: preparedById ? (selectedPreparedUser?.full_name || 'AMRI AMIT') : '',
        prepared_by_designation: preparedById ? (selectedPreparedUser?.jawatan || 'PENOLONG PEGAWAI FARMASI U5') : '',
        prepared_at: preparedById ? (penalty.prepared_at || new Date().toISOString()) : null,

        verified_by_user_id: verifiedById || null,
        verified_by_name: verifiedById ? (selectedVerifiedUser?.full_name || 'KAMRIAH BT HAJI MAIL') : '',
        verified_by_designation: verifiedById ? (selectedVerifiedUser?.jawatan || 'PENOLONG PEGAWAI FARMASI U7 TBK 2') : '',
        verified_at: verifiedById ? (penalty.verified_at || new Date().toISOString()) : null,

        approved_by: approvedById || null,
        approved_by_name: approvedById ? (selectedApprovedUser?.full_name || 'TAN YUAN ZHANG') : '',
        approved_by_designation: approvedById ? (selectedApprovedUser?.jawatan || 'PEGAWAI FARMASI UF 12') : '',
        approved_at: approvedById ? (penalty.approved_at || new Date().toISOString()) : null
      })
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setIsPreviewOpen(true)
      toast.success('Preview Ready', 'Document preview generated.')
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to generate PDF.')
    }
  }
  const statusColors: Record<string, string> = {
    pending: 'bg-slate-50 text-slate-500 border-slate-200',      // Draft
    enforced: 'bg-amber-50 text-amber-700 border-amber-200',    // Pending
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200', // Approved
    waived: 'bg-rose-50 text-rose-700 border-rose-200'            // Rejected
  }

  const mapStatusLabel = (status: string) => {
    const norm = status?.toLowerCase() || ''
    if (norm === 'pending') return 'Draft'
    if (norm === 'enforced') return 'Pending'
    if (norm === 'approved') return 'Approved'
    if (norm === 'waived') return 'Rejected'
    return status
  }

  return (
    <div className="min-h-screen bg-slate-100/70 relative font-sans selection:bg-slate-900 selection:text-white">
      {/* Ambient decorative blur background elements */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.02] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-sky-500/[0.03] to-emerald-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
          <span>Procurement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={() => navigate(-1)} className="hover:text-slate-600 transition-colors">Penalty Registry</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-black">CC Penalty Detail</span>
        </nav>

        {/* Global Action Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-md shadow-slate-100/80">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-11 h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all shadow-sm group">
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  CC Penalty Assessment Worksheet
                </h1>
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${statusColors[penalty.status] || statusColors.pending}`}>
                  {mapStatusLabel(penalty.status)}
                </span>
              </div>
              <p className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                KKM Contract & LPO Penalty Worksheet â€¢ <span className="text-indigo-600 font-black">CC PENALTY (080702)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={handlePrint} className="flex items-center justify-center gap-2 flex-1 md:flex-initial px-4 py-2.5 text-xs font-black bg-white text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all shadow-sm">
              <Printer className="w-3.5 h-3.5" /> Print Document
            </button>
            <button 
              onClick={handleTogglePaid} 
              disabled={saving}
              className={`flex items-center justify-center gap-2 flex-1 md:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all shadow-md disabled:opacity-50 ${
                penaltyPaid 
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/10' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10'
              }`}
            >
              {penaltyPaid ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {penaltyPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>
            {isReadOnly ? (
              <button onClick={() => setIsUnlockModalOpen(true)} className="flex items-center justify-center gap-2 flex-1 md:flex-initial px-4 py-2.5 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 transition-all">
                <Unlock className="w-3.5 h-3.5" /> Unlock to Edit
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 flex-1 md:flex-initial px-4 py-2.5 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50">
                  {saving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5" />} Save Changes
                </button>
                {penalty.status !== 'approved' && (
                  <button onClick={handleApprove} disabled={saving} className="flex items-center justify-center gap-2 flex-1 md:flex-initial px-4 py-2.5 text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: occupies 2 spans on large screens, holds info and configurations */}
          <div className="lg:col-span-2 space-y-8">
            {/* SECTION 1: CONTRACT & ORDER CONTEXT */}
            <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-600 shadow-md shadow-slate-100 overflow-hidden space-y-6 p-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-xs text-blue-600 shadow-sm">
                  01
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">MAKLUMAT KONTRAK & PESANAN (CONTRACT & LPO CONTEXT)</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supplier agreement credentials and purchase orders</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-sm">
                {/* Supplier Meta */}
                <div className="lg:col-span-2 space-y-4 bg-slate-50/80 p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">SUPPLIER COMPANY NAME</span>
                    <p className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-500" />
                      {supplier?.company_name || 'â€”'}
                    </p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-250">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">REGISTERED SUPPLIER ADDRESS</span>
                    <p className="font-bold text-slate-600 text-xs leading-relaxed">{supplier?.address || 'â€”'}</p>
                  </div>
                </div>

                {/* Contract & LPO details */}
                <div className="space-y-3 bg-slate-50/80 p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">KKM CONTRACT NUMBER</label>
                    <input 
                      value={kkmContract} 
                      onChange={e => setKkmContract(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Contract No."
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-250 rounded-lg focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">LPO NUMBER REFERENCE</span>
                    {lpo?.document_url ? (
                      <button
                        onClick={() => setIsLpoDrawerOpen(true)}
                        className="font-black text-indigo-600 text-sm tracking-wide hover:underline hover:text-indigo-850 transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                        title="Click to preview LPO document"
                      >
                        <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
                        {lpo.lpo_number}
                      </button>
                    ) : (
                      <p className="font-black text-indigo-600 text-sm tracking-wide">{lpo?.lpo_number || 'â€”'}</p>
                    )}
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">SYSTEM PO ID</span>
                    {po?.id || penalty.po_id ? (
                      <button
                        onClick={() => setIsPoDrawerOpen(true)}
                        className="font-bold text-slate-800 hover:text-indigo-750 hover:underline transition-colors inline-flex items-center gap-1.5 text-xs text-left cursor-pointer focus:outline-none"
                        title="Click to view Purchase Order details"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {po?.po_number || 'View PO Details'}
                      </button>
                    ) : (
                      <p className="font-bold text-slate-800 text-xs">{po?.po_number || 'â€”'}</p>
                    )}
                  </div>
                  <div className="space-y-1 pt-1.5 border-t border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">DO NUMBER REFERENCE</span>
                    <p className="font-bold text-slate-800 text-xs">
                      {penalty.goods_receipt?.delivery_note_number || penalty.receiving?.do_number || penalty.do_number || 'â€”'}
                    </p>
                  </div>
                </div>

                {/* Delivery Timelines */}
                <div className="space-y-3 bg-slate-50/80 p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">LPO ISSUED DATE</span>
                      <p className="font-black text-slate-900 text-xs">{formatDate(lpo?.document_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2.5 border-t border-slate-250">
                    <Calendar className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">EXPECTED LPO DEADLINE</span>
                      <p className="font-black text-amber-700 text-xs">{formatDate(tracking?.expected_delivery_date || penalty.expected_delivery_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2.5 border-t border-slate-250">
                    <Calendar className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">ACTUAL ARRIVAL DATE</span>
                      <p className="font-black text-red-700 text-xs">{formatDate(tracking?.actual_delivery_date || penalty.actual_delivery_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: ITEMS & DELIVERIES WORKSHEET */}
            <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 shadow-md shadow-slate-100 overflow-hidden p-6 space-y-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center font-black text-xs text-amber-600 shadow-sm">
                    02
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">MAKLUMAT ITEM & JADUAL PENGHANTARAN (ITEMS & DELIVERIES WORKSHEET)</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Baseline catalog constants and partial delivery logs for each LPO item</p>
                  </div>
                </div>
              </div>

              {/* Loop over each PO item */}
              <div className="space-y-8">
                {poItems.map((item: any, itemIdx: number) => {
                  const itemDeliveries = partialDeliveries.filter(del => del.item_code === item.item_code)
                  const itemPrice = Number(item.unit_price || 0)
                  const itemQtyOrdered = Number(item.quantity_ordered || 0)
                  const itemTotalValue = Number(item.total_price || itemPrice * itemQtyOrdered)
                  
                  const itemCalculatedPenalty = itemDeliveries.reduce((sum, del) => {
                    if (del.days_late > 0) {
                      return sum + (itemPrice * del.quantity * (del.days_late / 30) * 0.10)
                    }
                    return sum
                  }, 0)

                  const itemMaxDaysLate = itemDeliveries.reduce((max, del) => Math.max(max, del.days_late || 0), 0)
                  const itemTotalQtyReceived = itemDeliveries.reduce((sum, del) => sum + Number(del.quantity || 0), 0)

                  return (
                    <div key={item.item_code || itemIdx} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all duration-300">
                      {/* Card Title & Catalog Constants Banner */}
                      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-slate-200 pb-4">
                        <div className="space-y-1 max-w-xl">
                          <span className="inline-flex px-2 py-0.5 text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-150 rounded tracking-wider">ITEM {itemIdx + 1}</span>
                          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">{item.item_name || 'â€”'}</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">KKM Code: <span className="font-mono text-slate-800">{item.item_code || 'â€”'}</span></p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full lg:w-auto">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">UNIT PRICE</span>
                            <span className="font-mono font-black text-slate-900">RM {itemPrice.toFixed(2)}</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">QTY ORDERED</span>
                            <span className="font-bold text-slate-850">{itemQtyOrdered.toLocaleString()}</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">TOTAL VALUE</span>
                            <span className="font-mono font-black text-slate-900">RM {itemTotalValue.toFixed(2)}</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                          <button
                            type="button"
                            onClick={() => !isReadOnly && addDeliveryRowForItem(item.item_code)}
                            disabled={isReadOnly}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-black rounded-lg transition-all ml-auto shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" /> Add Batch
                          </button>
                        </div>
                      </div>

                      {/* Interactive Deliveries Table for this item */}
                      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-[9px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50/80">
                              <th className="p-3 text-left">Delivery Batch No.</th>
                              <th className="p-3 text-left w-36">Date Received</th>
                              <th className="p-3 text-right w-24">Qty Received</th>
                              <th className="p-3 text-right w-24">Days Delayed</th>
                              <th className="p-3 text-center w-28">Delay Status</th>
                              <th className="p-3 text-right w-44">Calculated Row Penalty</th>
                              <th className="p-3 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {itemDeliveries.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold text-xs bg-slate-50/20">
                                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  No delivery batches registered. Click "Add Batch" to log a delivery.
                                </td>
                              </tr>
                            ) : (
                              itemDeliveries.map((del) => {
                                const calculatedRowAmt = del.days_late > 0 
                                  ? itemPrice * del.quantity * (del.days_late / 30) * 0.10 
                                  : 0;

                                return (
                                  <tr 
                                    key={del.id} 
                                    className={`hover:bg-slate-50/30 transition-colors ${
                                      del.days_late > 0 ? 'bg-red-50/[0.02] border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'
                                    }`}
                                  >
                                    <td className="p-3 font-bold text-slate-900">
                                      <input
                                        value={del.delivery_number}
                                        onChange={e => updateDelivery(del.id, 'delivery_number', e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="date"
                                        value={del.date}
                                        onChange={e => updateDelivery(del.id, 'date', e.target.value)}
                                        disabled={isReadOnly}
                                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer hover:bg-slate-100/50 transition-colors w-full disabled:opacity-75 disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={del.quantity}
                                        onChange={e => updateDelivery(del.id, 'quantity', Number(e.target.value))}
                                        disabled={isReadOnly}
                                        className="w-20 px-2 py-1 text-xs font-mono font-black text-right bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={del.days_late}
                                        onChange={e => updateDelivery(del.id, 'days_late', Number(e.target.value))}
                                        disabled={isReadOnly}
                                        className="w-20 px-2 py-1 text-xs font-mono font-black text-right bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-3 text-center">
                                      {del.days_late > 0 ? (
                                        <span className="inline-flex px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">
                                          Late Delivery
                                        </span>
                                      ) : (
                                        <span className="inline-flex px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          On Time
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      {del.days_late > 0 ? (
                                        <div className="space-y-0.5">
                                          <span className="font-extrabold text-red-600 text-xs tabular-nums block">
                                            RM {calculatedRowAmt.toFixed(2)}
                                          </span>
                                          <span className="text-[7.5px] text-slate-400 font-mono font-semibold block leading-none">
                                            {itemPrice.toFixed(2)} Ã— {del.quantity} Ã— ({del.days_late}/30) Ã— 10%
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                                          â€”
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => !isReadOnly && removeDeliveryRow(del.id)}
                                        disabled={isReadOnly}
                                        className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 hover:scale-[1.05] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          {itemDeliveries.length > 0 && (
                            <tfoot>
                              <tr className="border-t border-slate-200 bg-slate-50/50 font-black text-xs text-slate-800">
                                <td colSpan={2} className="p-3 text-left text-slate-400 uppercase tracking-widest text-[8px]">
                                  SUBTOTAL ({item.item_code})
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900 text-xs">
                                  {itemTotalQtyReceived} Qty
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900 text-xs">
                                  {itemMaxDaysLate} Days
                                </td>
                                <td className="p-3 text-center text-slate-400">
                                  â€”
                                </td>
                                <td className="p-3 text-right font-mono font-black text-red-650 text-xs tabular-nums">
                                  RM {itemCalculatedPenalty.toFixed(2)}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Aggregated Total Panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-md shadow-slate-900/10">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">SUM TOTAL FOR ALL RECEIVED BATCHES</span>
                  <h4 className="font-extrabold text-sm tracking-tight text-slate-100 uppercase">Aggregated CC Penalty Assessment</h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-400">
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">TOTAL RECEIVED QTY</span>
                    <span className="font-mono font-black text-slate-100 text-base">{partialDeliveries.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} Qty</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">MAX DAYS DELAYED</span>
                    <span className="font-mono font-black text-slate-100 text-base">{calculation.maxDaysLate} Days</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">AGGREGATED CALCULATED PENALTY</span>
                    <span className="font-mono font-black text-red-400 text-lg">RM {calculation.calculated.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3A: PENALTY ENGINE CONFIGURATION */}
            <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-violet-600 shadow-md shadow-slate-100 p-6 space-y-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center font-black text-xs text-violet-600 shadow-sm">
                  03A
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">PENALTY ENGINE CONFIGURATION</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure enforcement thresholds and delay calculations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Penalty settings type */}
                <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PENALTY ENFORCEMENT METHOD</label>
                  <select
                    value={selectedPenaltyType}
                    onChange={e => setSelectedPenaltyType(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full mt-1 px-3 py-2 text-xs font-black bg-white border border-slate-250 rounded-lg focus:border-indigo-500 outline-none transition-all cursor-pointer text-slate-800 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="minimum">Flat Minimum (RM 200.00)</option>
                    <option value="calculated">Calculated Late Penalty</option>
                  </select>
                </div>

                {/* Delay Card */}
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-red-100/70 border border-red-200 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-red-700 tabular-nums">{calculation.maxDaysLate} Days Late</p>
                    <p className="text-[8px] font-black text-red-500 uppercase tracking-wider">MAX CONSOLE DEVIATION RECORDED</p>
                  </div>
                </div>
              </div>

              {/* Formula documentation details */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl text-[10px] text-indigo-950 font-medium space-y-2 shadow-sm">
                <div className="flex justify-between items-center font-black">
                  <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-indigo-650" /> KKM CC PENALTY MATHEMATICS (PEKELILING KONTRAK)</span>
                  <span className="text-[8px] font-mono bg-indigo-100 px-2 py-0.5 text-indigo-700 rounded-full">Formula L1.9</span>
                </div>
                <p className="leading-relaxed">
                  KKM Contract Circular penalty enforces a charge for late deliveries of partial batches:
                  <span className="block mt-1 font-extrabold text-indigo-800 font-mono">Row Charge = (Unit Price Ã— Quantity Ã— Days Late Ã· 30) Ã— 10%</span>
                  If the accumulated calculation sum is below <span className="font-extrabold">RM 200.00</span>, the administrative portal enforces a flat minimum penalty of <span className="font-extrabold text-amber-700 bg-amber-50 px-1 rounded">RM 200.00</span> to ensure compliance overhead is met.
                </p>
                <div className="pt-2 border-t border-indigo-200/80 flex justify-between items-center text-[9px] font-black text-indigo-700">
                  <span>TOTAL ACCUMULATED PENALTY CALCULATIONS:</span>
                  <span className="font-mono text-xs text-indigo-950">RM {calculation.calculated.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: DIGITAL SIGNATURES & VERIFICATION FLOW */}
            <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-md shadow-slate-100 overflow-hidden p-6 space-y-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center font-black text-xs text-violet-600 shadow-sm">
                  04
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">PERAKUAN & KELULUSAN DIGITAL (DIGITAL SIGNATURES & OFFICERS)</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Administrative verification chain and digital signing credentials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    id: preparedById,
                    setId: setPreparedById,
                    label: '1. DISEDIAKAN OLEH (PREPARED BY)',
                    name: selectedPreparedUser?.full_name || penalty.prepared_by_name || 'AMRI AMIT',
                    role: selectedPreparedUser?.jawatan || penalty.prepared_by_designation || 'PENOLONG PEGAWAI FARMASI U5',
                    date: preparedById ? (penalty.prepared_at || new Date().toISOString()) : penalty.prepared_at
                  },
                  {
                    id: verifiedById,
                    setId: setVerifiedById,
                    label: '2. DISEMAK OLEH (VERIFIED BY)',
                    name: selectedVerifiedUser?.full_name || penalty.verified_by_name || 'KAMRIAH BT HAJI MAIL',
                    role: selectedVerifiedUser?.jawatan || penalty.verified_by_designation || 'PENOLONG PEGAWAI FARMASI U7 TBK 2',
                    date: verifiedById ? (penalty.verified_at || new Date().toISOString()) : penalty.verified_at
                  },
                  {
                    id: approvedById,
                    setId: setApprovedById,
                    label: '3. DISAHKAN OLEH (APPROVED BY)',
                    name: selectedApprovedUser?.full_name || 'TAN YUAN ZHANG',
                    role: selectedApprovedUser?.jawatan || 'PEGAWAI FARMASI UF 12',
                    date: approvedById ? (penalty.approved_at || new Date().toISOString()) : penalty.approved_at
                  },
                ].map((sig, i) => (
                  <div 
                    key={i} 
                    className={`border-2 rounded-xl p-5 text-center space-y-4 flex flex-col justify-between min-h-[270px] transition-all duration-300 ${
                      sig.id 
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-sm shadow-emerald-100 border-t-4 border-t-emerald-500' 
                        : 'bg-slate-50 border-slate-200 shadow-inner border-t-4 border-t-amber-500'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sig.label}</span>
                        {sig.id ? (
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 rounded border border-emerald-200">SIGNED</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 rounded">PENDING</span>
                        )}
                      </div>
                      
                      {sig.id ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-emerald-100/60 border border-emerald-250 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 text-sm tracking-tight">{sig.name}</p>
                            {sig.role && <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">{sig.role}</p>}
                            {sig.date && <p className="text-[9px] text-slate-400 font-mono mt-1">{formatDate(sig.date)} â€¢ {new Date(sig.date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <div className="w-12 h-12 bg-slate-200 border border-slate-300 rounded-full flex items-center justify-center mx-auto text-slate-400 font-bold text-lg shadow-sm">
                            â€”
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Awaiting dynamic sign-off</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200 space-y-1.5 text-left">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">SELECT AUTHORIZED OFFICER</label>
                      <select
                        value={sig.id}
                        onChange={e => sig.setId(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 text-xs font-extrabold bg-white border border-slate-250 rounded-xl focus:border-indigo-500 outline-none transition-all cursor-pointer text-slate-800 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Choose Signatory --</option>
                        {systemUsers.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.jawatan || 'Pegawai'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: occupies 1 span on large screens, holds financial statement and remains sticky as you edit */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-8">
            {/* SECTION 3B: FINANCIAL LEDGER STATEMENT */}
            <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-md shadow-slate-100 p-6 space-y-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-black text-xs text-emerald-600 shadow-sm">
                  03B
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">FINANCIAL LEDGER STATEMENT</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deductions ledger and net supplier payout calculations</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Total Order Value */}
                <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">TOTAL CONTRACT / ORDER VALUE (RM)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={totalOrderValue} 
                    onChange={e => setTotalOrderValue(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full mt-1 px-3 py-1.5 text-sm font-black text-slate-900 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all text-right font-mono disabled:opacity-75 disabled:cursor-not-allowed" 
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PAYMENT DISBURSEMENT METHOD</label>
                  <select 
                    value={paymentKaedah} 
                    onChange={e => setPaymentKaedah(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all cursor-pointer text-slate-850 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value={1}>Kaedah 1 â€” Potongan Baucer Bayaran (With CDC)</option>
                    <option value={2}>Kaedah 2 â€” Bayaran Cek (Deductions Only)</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PAYMENT STATUS</label>
                  <select 
                    value={penaltyPaid ? 'true' : 'false'} 
                    onChange={e => setPenaltyPaid(e.target.value === 'true')}
                    disabled={isReadOnly}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all cursor-pointer text-slate-850 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="false">Unpaid / Pending</option>
                    <option value="true">Paid / Settled</option>
                  </select>
                </div>
              </div>

              {/* Calculations Breakdown list */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-semibold text-xs text-slate-700 shadow-sm">
                <div className="flex justify-between items-center">
                  <span>Contract LPO Order Value</span>
                  <span className="font-mono text-slate-900">RM {totalOrderValue.toFixed(2)}</span>
                </div>
                {paymentKaedah === 2 && totalOrderValue < calculation.final ? (
                  <>
                    <div className="flex justify-between items-center text-red-650">
                      <span className="flex items-center gap-1 font-bold">Enforced Late Penalty ({selectedPenaltyType === 'minimum' ? 'Flat Minimum' : 'Calculated'})</span>
                      <span className="font-mono font-black text-red-600">RM {calculation.final.toFixed(2)}</span>
                    </div>
                    <div className="pt-2.5 border-t border-dashed border-slate-350 flex justify-between items-center font-black text-slate-950 text-sm">
                      <span>PENALTY PAYABLE (NO DEDUCTION)</span>
                      <span className="font-mono text-red-700 text-base">
                        RM {calculation.final.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-red-650">
                      <span className="flex items-center gap-1 font-bold">Less: Enforced Late Penalty ({selectedPenaltyType === 'minimum' ? 'Flat Minimum' : 'Calculated'})</span>
                      <span className="font-mono font-black text-red-600">- RM {calculation.final.toFixed(2)}</span>
                    </div>
                    {paymentKaedah === 1 && (
                      <div className="flex justify-between items-center text-red-650 pt-1.5 border-t border-slate-200">
                        <span className="flex items-center gap-1 font-bold">Less: CDC Levy (0.4% on Balance after Penalty)</span>
                        <span className="font-mono font-black text-red-600">- RM {calculation.cdc.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2.5 border-t border-dashed border-slate-350 flex justify-between items-center font-black text-slate-950 text-sm">
                      <span>TOTAL ADMINISTRATIVE DEDUCTIONS</span>
                      <span className="font-mono text-red-700 text-base">
                        - RM {paymentKaedah === 1 ? calculation.totalDeductions.toFixed(2) : calculation.final.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Net Payout Glassmorphism Block */}
              {paymentKaedah === 2 && totalOrderValue < calculation.final ? (
                <div className="bg-gradient-to-br from-rose-600 to-red-750 text-white rounded-2xl p-5 text-center space-y-1.5 shadow-md shadow-rose-700/10">
                  <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest block">PENALTY TO BE PAID BY SUPPLIER (BAYARAN CEK)</span>
                  <span className="text-3xl font-black font-mono tracking-tight block animate-pulse">
                    RM {calculation.final.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 text-center space-y-1.5 shadow-md shadow-emerald-700/10">
                  <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest block">NET DISBURSEMENT PAYOUT AMOUNT (NET PAYABLE)</span>
                  <span className="text-3xl font-black font-mono tracking-tight block animate-pulse">
                    RM {paymentKaedah === 1 ? calculation.netPayable.toFixed(2) : (totalOrderValue - calculation.final).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SlideOver
        isOpen={isLpoDrawerOpen}
        onClose={() => setIsLpoDrawerOpen(false)}
        title="LPO DOCUMENT PREVIEW"
        description={`LPO Number Reference: ${lpo?.lpo_number || ''}`}
        size="7xl"
      >
        <div className="h-full flex flex-col p-6 bg-slate-50/50 overflow-hidden">
          {lpo?.document_url ? (
            <PDFViewer url={lpo.document_url} title={`LPO ${lpo.lpo_number}`} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <FileText className="w-12 h-12 text-slate-350" />
              <p className="font-bold text-sm">No LPO Document URL available.</p>
            </div>
          )}
        </div>
      </SlideOver>

      <SlideOver
        isOpen={isPoDrawerOpen}
        onClose={() => setIsPoDrawerOpen(false)}
        title="Purchase Order Details"
        size="5xl"
      >
        {(po?.id || penalty.po_id) && (
          <PurchaseOrderDetailView 
            id={penalty.po_id || po.id} 
            onClose={() => setIsPoDrawerOpen(false)} 
            isSlideOver={true}
            onMutate={onRefresh}
          />
        )}
      </SlideOver>

      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false)
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
          }
        }}
        pdfUrl={previewUrl}
        title="Surat Tuntutan Bayaran Denda"
        fileName={`Penalty_CC_${penalty.id.slice(0, 8).toUpperCase()}.pdf`}
      />
      {/* Unlock to Edit Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsUnlockModalOpen(false)}></div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md relative z-10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-650" />
                Unlock Approved Penalty
              </h3>
              <button 
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <Lock className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!editReason.trim()) {
                  toast.error('Required', 'Please enter a valid reason to unlock this penalty record.');
                  return;
                }
                setIsUnlockedForEditing(true);
                setIsUnlockModalOpen(false);
                toast.success('Record Unlocked', 'You can now make modifications to this approved penalty record.');
              }} 
              className="p-6 space-y-5"
            >
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Reason for Editing <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 font-medium">
                  Since this penalty has already been officially approved, you must provide a valid justification to unlock it for changes. This reason will be logged in the audit notes history.
                </p>
                <textarea
                  required
                  rows={4}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Correcting incorrect quantity received after supplier consultation..."
                  className="w-full px-3 py-2 bg-white border border-slate-355 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-650/10 flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" /> Confirm Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
