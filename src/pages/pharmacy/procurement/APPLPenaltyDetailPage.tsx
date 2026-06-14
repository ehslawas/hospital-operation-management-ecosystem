import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { updatePenaltyDetails, approvePenalty, getPerformanceStandards, PerformanceStandard } from '@/services/pharmacy/penaltyService'
import { formatCurrency } from '@/lib/utils'
import { ChevronRight, Sparkles, ArrowLeft, Printer, Save, CheckCircle2, XCircle, FileText, Building2, Calendar, Package, AlertTriangle, Shield, CheckSquare, Square, Lock, Unlock, Plus, Trash2 } from 'lucide-react'
import { Spinner, SlideOver } from '@/components/ui'
import { PdfPreviewModal, PDFViewer } from '@/components/shared'
import { PurchaseOrderDetailView } from './PurchaseOrderDetailView'

interface Props {
  penalty: any
  onRefresh: () => void
}

export function APPLPenaltyDetailPage({ penalty, onRefresh }: Props) {
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
  const [standards, setStandards] = useState<PerformanceStandard[]>([])
  const [loadingStandards, setLoadingStandards] = useState(true)

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

  // Find matching PO item to auto-populate unit price, quantity, total value if not stored in penalty record
  const matchingPoItem = useMemo(() => {
    const code = penalty.item_code || penalty.order_tracking?.item_code
    const name = penalty.item_name || penalty.order_tracking?.item_name
    return penalty.purchase_order?.items?.find((i: any) => 
      (code && i.item_code === code) || (name && i.item_name === name)
    )
  }, [penalty])

  // Initialize items from the purchase order, parsing from penalty.notes if stored there as JSON, or fallback
  const [lpoItems, setLpoItems] = useState<any[]>(() => {
    let parsedItemsData: any[] = []
    if (penalty.notes) {
      try {
        const jsonMatch = penalty.notes.match(/__LPO_ITEMS_DATA__:(.*)__END_LPO_ITEMS_DATA__/);
        if (jsonMatch && jsonMatch[1]) {
          parsedItemsData = JSON.parse(jsonMatch[1])
        }
      } catch (e) {
        console.error('Failed to parse LPO items data from notes:', e)
      }
    }

    return penalty.purchase_order?.items?.map((item: any) => {
      const storedItem = parsedItemsData.find((i: any) => i.item_code === item.item_code)
      
      const initialDeliveries = storedItem?.deliveries || [
        {
          id: Math.random().toString(36).substring(2, 9),
          delivery_number: '1st Delivery',
          quantity_late: storedItem ? storedItem.quantity_late : (item.quantity_ordered || 0),
          days_delayed: storedItem ? storedItem.days_delayed : (penalty.days_delayed || 0),
          is_penalty_applicable: storedItem ? storedItem.is_penalty_applicable : true
        }
      ]

      return {
        ...item,
        deliveries: initialDeliveries
      }
    }) || []
  })

  const totalQtyLate = useMemo(() => {
    return lpoItems.reduce((sum, item) => {
      const itemSum = item.deliveries?.reduce((s: number, d: any) => d.is_penalty_applicable ? s + Number(d.quantity_late || 0) : s, 0) || 0
      return sum + itemSum
    }, 0)
  }, [lpoItems])

  const totalFailedValue = useMemo(() => {
    return lpoItems.reduce((sum, item) => {
      const itemSum = item.deliveries?.reduce((s: number, d: any) => d.is_penalty_applicable ? s + (Number(item.unit_price || 0) * Number(d.quantity_late || 0)) : s, 0) || 0
      return sum + itemSum
    }, 0)
  }, [lpoItems])

  const maxDaysDelayed = useMemo(() => {
    return lpoItems.reduce((max, item) => {
      const itemMax = item.deliveries?.reduce((m: number, d: any) => d.is_penalty_applicable ? Math.max(m, Number(d.days_delayed || 0)) : m, 0) || 0
      return Math.max(max, itemMax)
    }, 0)
  }, [lpoItems])

  const addDeliveryRowForItem = (itemCode: string) => {
    setLpoItems(prev => prev.map(item => {
      if (item.item_code !== itemCode) return item
      const nextIdx = (item.deliveries?.length || 0) + 1
      const getOrdinalSuffix = (i: number) => {
        const j = i % 10, k = i % 100
        if (j === 1 && k !== 11) return 'st'
        if (j === 2 && k !== 12) return 'nd'
        if (j === 3 && k !== 13) return 'rd'
        return 'th'
      }
      return {
        ...item,
        deliveries: [
          ...(item.deliveries || []),
          {
            id: Math.random().toString(36).substring(2, 9),
            delivery_number: `${nextIdx}${getOrdinalSuffix(nextIdx)} Delivery`,
            quantity_late: 0,
            days_delayed: 0,
            is_penalty_applicable: true
          }
        ]
      }
    }))
  }

  const removeDeliveryRow = (itemCode: string, deliveryId: string) => {
    setLpoItems(prev => prev.map(item => {
      if (item.item_code !== itemCode) return item
      return {
        ...item,
        deliveries: (item.deliveries || []).filter((d: any) => d.id !== deliveryId)
      }
    }))
  }

  const updateDeliveryField = (itemCode: string, deliveryId: string, field: string, value: any) => {
    setLpoItems(prev => prev.map(item => {
      if (item.item_code !== itemCode) return item
      return {
        ...item,
        deliveries: (item.deliveries || []).map((d: any) => d.id === deliveryId ? { ...d, [field]: value } : d)
      }
    }))
  }

  // Editable fields
  const [itemName, setItemName] = useState(penalty.item_name || penalty.order_tracking?.item_name || '')
  const [itemCode, setItemCode] = useState(penalty.item_code || penalty.order_tracking?.item_code || '')
  const [quantity, setQuantity] = useState(() => {
    if (penalty.quantity) return Number(penalty.quantity)
    if (matchingPoItem?.quantity_ordered) return Number(matchingPoItem.quantity_ordered)
    return 0
  })
  const [unitPrice, setUnitPrice] = useState(() => {
    if (penalty.unit_price) return Number(penalty.unit_price)
    if (matchingPoItem?.unit_price) return Number(matchingPoItem.unit_price)
    return 0
  })
  const [daysDelayed, setDaysDelayed] = useState(penalty.days_delayed || 0)
  const [totalOrderValue, setTotalOrderValue] = useState(() => {
    if (penalty.total_order_value) return Number(penalty.total_order_value)
    if (penalty.purchase_order?.total_amount) return Number(penalty.purchase_order.total_amount)
    if (penalty.purchase_order?.items && penalty.purchase_order.items.length > 0) {
      const sum = penalty.purchase_order.items.reduce((s: number, i: any) => s + Number(i.total_price || 0), 0)
      if (sum > 0) return sum
    }
    if (matchingPoItem?.total_price) return Number(matchingPoItem.total_price)
    return 0
  })
  const [failedProductValue, setFailedProductValue] = useState(() => {
    if (penalty.failed_product_value) return Number(penalty.failed_product_value)
    if (matchingPoItem?.total_price) return Number(matchingPoItem.total_price)
    if (matchingPoItem && matchingPoItem.unit_price && matchingPoItem.quantity_ordered) {
      return Number(matchingPoItem.unit_price) * Number(matchingPoItem.quantity_ordered)
    }
    return 0
  })
  const [doNumber, setDoNumber] = useState(penalty.receiving?.do_number || '')
  const [invoiceNumber, setInvoiceNumber] = useState(penalty.payment_reference || '')
  const [paymentKaedah, setPaymentKaedah] = useState<number>(penalty.payment_kaedah || 1)

  useEffect(() => {
    setDaysDelayed(maxDaysDelayed)
  }, [maxDaysDelayed])

  useEffect(() => {
    setFailedProductValue(totalFailedValue)
  }, [totalFailedValue])

  useEffect(() => {
    setQuantity(totalQtyLate)
  }, [totalQtyLate])
  
  // Performance Standards Selected
  const [selectedStandards, setSelectedStandards] = useState<string[]>(
    penalty.performance_standards_violated || []
  )

  const supplier = penalty.supplier
  const lpo = penalty.lpo
  const po = penalty.purchase_order
  const tracking = penalty.order_tracking

  useEffect(() => {
    loadStandards()
  }, [])

  const loadStandards = async () => {
    setLoadingStandards(true)
    try {
      const res = await getPerformanceStandards()
      if (res.data) {
        setStandards(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStandards(false)
    }
  }

  // Calculate APPL penalties based on selected standards
  const calculation = useMemo(() => {
    let total = 0
    const details = selectedStandards.map(code => {
      const std = standards.find(s => s.code === code)
      if (!std) return { code, amount: 0 }
      
      let amount = 0
      if (std.penalty_type === 'percentage' && std.penalty_rate) {
        amount = lpoItems.reduce((sum, item) => {
          const itemDeliveriesSum = (item.deliveries || []).reduce((delSum: number, del: any) => {
            if (!del.is_penalty_applicable) return delSum
            const delFailedValue = Number(item.unit_price || 0) * Number(del.quantity_late || 0)
            return delSum + (Number(std.penalty_rate) * delFailedValue * Number(del.days_delayed || 0))
          }, 0)
          return sum + itemDeliveriesSum
        }, 0)
      } else if (std.penalty_type === 'fixed' && std.fixed_amount) {
        amount = Number(std.fixed_amount)
      } else if (std.penalty_type === 'per_incident' && std.fixed_amount) {
        amount = Number(std.fixed_amount) // assume 1 incident by default
      } else if (std.penalty_type === 'per_day' && std.fixed_amount) {
        amount = Number(std.fixed_amount) * maxDaysDelayed
      } else if (std.fixed_amount) {
        amount = Number(std.fixed_amount)
      }
      
      total += amount
      return { code, title: std.description_bm, amount }
    })

    return { total, details }
  }, [selectedStandards, standards, lpoItems, maxDaysDelayed])

  const toggleStandard = (code: string) => {
    if (selectedStandards.includes(code)) {
      setSelectedStandards(selectedStandards.filter(c => c !== code))
    } else {
      setSelectedStandards([...selectedStandards, code])
    }
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
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
      const serializedData = `__LPO_ITEMS_DATA__:${JSON.stringify(lpoItems.map(i => ({
        item_code: i.item_code,
        deliveries: i.deliveries
      })))}__END_LPO_ITEMS_DATA__`

      const cleanNotes = editReason
        ? (penalty.notes ? penalty.notes.replace(/__LPO_ITEMS_DATA__:.*__END_LPO_ITEMS_DATA__/, '').trim() + '\n' : '') + `[Edit Request - Reason: ${editReason}] by user ${user?.email || ''} at ${new Date().toLocaleString()}`
        : (penalty.notes ? penalty.notes.replace(/__LPO_ITEMS_DATA__:.*__END_LPO_ITEMS_DATA__/, '').trim() : '');

      const finalNotes = (cleanNotes + '\n' + serializedData).trim()

      const res = await updatePenaltyDetails(penalty.id, {
        item_name: itemName,
        item_code: itemCode,
        quantity: totalQtyLate,
        unit_price: unitPrice,
        days_delayed: maxDaysDelayed,
        total_order_value: totalOrderValue,
        failed_product_value: totalFailedValue,
        payment_kaedah: paymentKaedah,
        performance_standards_violated: selectedStandards,
        penalty_amount: calculation.total,
        payment_reference: invoiceNumber,
        do_number: doNumber,
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
      toast.success('Saved', 'APPL Penalty details updated successfully.')
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
      const { generateAPPLPenaltyPdf } = await import('@/services/pharmacy/applPenaltyPdfService')
      const doc = await generateAPPLPenaltyPdf({
        ...penalty,
        item_name: itemName,
        item_code: itemCode,
        quantity,
        unit_price: unitPrice,
        days_delayed: daysDelayed,
        total_order_value: totalOrderValue,
        failed_product_value: failedProductValue,
        payment_kaedah: paymentKaedah,
        performance_standards_violated: selectedStandards,
        penalty_amount: calculation.total,
        payment_reference: invoiceNumber,
        do_number: doNumber,
        
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
      }, standards)
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setIsPreviewOpen(true)
      toast.success('Preview Ready', 'Checklist preview generated.')
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
    <div className="min-h-screen bg-[#f8fafc] relative font-sans selection:bg-slate-900 selection:text-white">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.01] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/[0.02] to-fuchsia-500/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Procurement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={() => navigate(-1)} className="hover:text-slate-600 transition-colors">Penalty Registry</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold">APPL Penalty Detail</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  LAMPIRAN 9 — Borang Tuntutan Penalti
                </h1>
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${statusColors[penalty.status] || statusColors.pending}`}>
                  {mapStatusLabel(penalty.status)}
                </span>
              </div>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                LPO: {lpo?.lpo_number || '—'} • <span className="text-indigo-600 font-black">APPL PENALTY (990102)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all shadow-sm">
              <Printer className="w-3.5 h-3.5" /> Print Checklist
            </button>
            <button 
              onClick={handleTogglePaid} 
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 ${
                penaltyPaid 
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/10' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10'
              }`}
            >
              {penaltyPaid ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {penaltyPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>
            {isReadOnly ? (
              <button onClick={() => setIsUnlockModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 transition-all">
                <Unlock className="w-3.5 h-3.5" /> Unlock to Edit
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50">
                  {saving ? <Spinner size="xs" /> : <Save className="w-3.5 h-3.5" />} Save Changes
                </button>
                {penalty.status !== 'approved' && (
                  <button onClick={handleApprove} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Sign
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Info & Checklist */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Info Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Delivery & Product Info</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Supplier Company</label>
                  <p className="font-bold text-slate-900 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    {supplier?.company_name || '—'}
                  </p>
                </div>
                <div className="sm:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">LPO Items & Delivery Batches ({lpoItems.length})</label>
                  <div className="space-y-6">
                    {lpoItems.map((item: any, idx: number) => {
                      const itemPrice = Number(item.unit_price || 0)
                      const itemQtyOrdered = Number(item.quantity_ordered || 0)
                      
                      const itemTotalQtyReceived = item.deliveries?.reduce((s: number, d: any) => d.is_penalty_applicable ? s + Number(d.quantity_late || 0) : s, 0) || 0

                      return (
                        <div key={item.item_code || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all duration-300">
                          {/* Item header */}
                          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-slate-200 pb-4">
                            <div className="space-y-1">
                              <span className="inline-flex px-2 py-0.5 text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-150 rounded tracking-wider">ITEM {idx + 1}</span>
                              <h3 className="font-extrabold text-slate-900 text-xs tracking-tight leading-snug">{item.item_name}</h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">KKM Code: <span className="font-mono text-slate-800">{item.item_code}</span></p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-650 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                              <div>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">UNIT PRICE</span>
                                <span className="font-mono text-slate-900">RM {itemPrice.toFixed(2)}</span>
                              </div>
                              <div className="w-px h-6 bg-slate-200" />
                              <div>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">QTY ORDERED</span>
                                <span className="text-slate-900">{itemQtyOrdered}</span>
                              </div>
                              <div className="w-px h-6 bg-slate-200" />
                              <button
                                type="button"
                                onClick={() => !isReadOnly && addDeliveryRowForItem(item.item_code)}
                                disabled={isReadOnly}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[9px] font-black rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Batch
                              </button>
                            </div>
                          </div>

                          {/* Deliveries table */}
                          <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50/80">
                                  <th className="p-2 text-center w-12">Late?</th>
                                  <th className="p-2 text-left">Delivery Batch No.</th>
                                  <th className="p-2 text-right w-24">Qty Late</th>
                                  <th className="p-2 text-right w-20">Days Late</th>
                                  <th className="p-2 text-right w-36">Failed Value</th>
                                  <th className="p-2 text-center w-12"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-bold">
                                {(item.deliveries || []).length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-4 text-center text-slate-400 italic">No batches registered. Click "Add Batch" to log a delivery.</td>
                                  </tr>
                                ) : (
                                  item.deliveries.map((del: any) => {
                                    const delFailedValue = itemPrice * Number(del.quantity_late || 0)
                                    return (
                                      <tr key={del.id} className={`hover:bg-slate-50/50 transition-colors ${del.is_penalty_applicable ? 'bg-red-50/[0.01]' : 'opacity-70 bg-slate-50/30'}`}>
                                        <td className="p-2 text-center">
                                          <input
                                            type="checkbox"
                                            checked={del.is_penalty_applicable}
                                            disabled={isReadOnly}
                                            onChange={e => updateDeliveryField(item.item_code, del.id, 'is_penalty_applicable', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                          />
                                        </td>
                                        <td className="p-2">
                                          <input
                                            value={del.delivery_number}
                                            onChange={e => updateDeliveryField(item.item_code, del.id, 'delivery_number', e.target.value)}
                                            disabled={isReadOnly || !del.is_penalty_applicable}
                                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                          />
                                        </td>
                                        <td className="p-2 text-right">
                                          <input
                                            type="number"
                                            min="0"
                                            max={itemQtyOrdered}
                                            value={del.quantity_late}
                                            onChange={e => updateDeliveryField(item.item_code, del.id, 'quantity_late', Math.max(0, Number(e.target.value)))}
                                            disabled={isReadOnly || !del.is_penalty_applicable}
                                            className="w-16 px-1.5 py-1 text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-50 font-mono"
                                          />
                                        </td>
                                        <td className="p-2 text-right">
                                          <input
                                            type="number"
                                            min="0"
                                            value={del.days_delayed}
                                            onChange={e => updateDeliveryField(item.item_code, del.id, 'days_delayed', Math.max(0, Number(e.target.value)))}
                                            disabled={isReadOnly || !del.is_penalty_applicable}
                                            className="w-12 px-1.5 py-1 text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-50 font-mono"
                                          />
                                        </td>
                                        <td className="p-2 text-right font-mono text-red-650 tabular-nums">
                                          {del.is_penalty_applicable ? `RM ${delFailedValue.toFixed(2)}` : '—'}
                                        </td>
                                        <td className="p-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => !isReadOnly && removeDeliveryRow(item.item_code, del.id)}
                                            disabled={isReadOnly}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">LPO Number</label>
                  {lpo?.document_url ? (
                    <button
                      onClick={() => setIsLpoDrawerOpen(true)}
                      className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 text-indigo-650 hover:text-indigo-850 hover:underline transition-colors rounded-lg inline-flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
                      title="Click to preview LPO document"
                    >
                      <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
                      {lpo.lpo_number}
                    </button>
                  ) : (
                    <p className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 text-indigo-600 rounded-lg">{lpo?.lpo_number || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System PO ID</label>
                  {po?.id || penalty.po_id ? (
                    <button
                      onClick={() => setIsPoDrawerOpen(true)}
                      className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 text-slate-800 hover:text-indigo-750 hover:underline transition-colors rounded-lg inline-flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
                      title="Click to view Purchase Order details"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      {po?.po_number || 'View PO Details'}
                    </button>
                  ) : (
                    <p className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-lg">{po?.po_number || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DO Number</label>
                  <input value={doNumber} onChange={e => setDoNumber(e.target.value)} disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Invoice Number</label>
                  <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Quantity Received</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Unit Price (RM)</label>
                  <input type="number" step="0.01" value={unitPrice} readOnly={true}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-100 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed text-right" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Payment Status</label>
                  <select
                    disabled={isReadOnly}
                    value={penaltyPaid ? 'true' : 'false'}
                    onChange={e => setPenaltyPaid(e.target.value === 'true')}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="false">Unpaid / Pending</option>
                    <option value="true">Paid / Settled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Performance Standards Checklist Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">02. APPL Performance Standards Violation Checklist</h3>
              </div>
              <div className="p-6">
                {loadingStandards ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="text-indigo-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {standards.map(std => {
                      const isSelected = selectedStandards.includes(std.code)
                      const calculatedDetail = calculation.details.find(d => d.code === std.code)
                      let previewAmount = calculatedDetail ? calculatedDetail.amount : 0
                      if (!isSelected && previewAmount === 0) {
                        // Estimate preview if not currently selected
                        if (std.penalty_type === 'percentage' && std.penalty_rate) {
                          previewAmount = lpoItems.reduce((sum, item) => {
                            const itemDeliveriesSum = (item.deliveries || []).reduce((delSum: number, del: any) => {
                              if (!del.is_penalty_applicable) return delSum
                              const delFailedValue = Number(item.unit_price || 0) * Number(del.quantity_late || 0)
                              return delSum + (Number(std.penalty_rate) * delFailedValue * Number(del.days_delayed || 0))
                            }, 0)
                            return sum + itemDeliveriesSum
                          }, 0)
                        } else if (std.penalty_type === 'fixed' && std.fixed_amount) {
                          previewAmount = Number(std.fixed_amount)
                        } else if (std.penalty_type === 'per_incident' && std.fixed_amount) {
                          previewAmount = Number(std.fixed_amount)
                        } else if (std.penalty_type === 'per_day' && std.fixed_amount) {
                          previewAmount = Number(std.fixed_amount) * maxDaysDelayed
                        } else if (std.fixed_amount) {
                          previewAmount = Number(std.fixed_amount)
                        }
                      }

                      return (
                        <div key={std.id} onClick={() => !isReadOnly && toggleStandard(std.code)}
                          className={`p-4 rounded-xl border transition-all select-none ${
                            isReadOnly ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            isSelected 
                              ? 'bg-indigo-50/60 border-indigo-200 shadow-sm' 
                              : 'bg-white hover:bg-slate-50/80 border-slate-100'
                          }`}>
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-black text-xs uppercase tracking-wider text-slate-800">
                                {std.code} — {std.penalty_formula}
                              </span>
                              {previewAmount > 0 && (
                                <span className={`text-xs font-black tabular-nums ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                                  RM {previewAmount.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              {std.description_bm}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column — Finance & Digital Signatures */}
          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Financial Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-indigo-900 to-slate-950 text-white">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> APPL Calculations
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {/* LPO Value */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total LPO Value (RM)</label>
                  <input type="number" step="0.01" value={totalOrderValue} onChange={e => setTotalOrderValue(Number(e.target.value))} disabled={isReadOnly}
                    className="w-full px-3 py-2.5 text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-right tabular-nums disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                {/* Failed Product Value */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Failed Product Value (RM)</label>
                  <input type="number" step="0.01" value={failedProductValue} onChange={e => setFailedProductValue(Number(e.target.value))} disabled={isReadOnly}
                    className="w-full px-3 py-2.5 text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-right tabular-nums disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                {/* Days Delayed */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Days Delayed</label>
                  <input type="number" value={daysDelayed} onChange={e => setDaysDelayed(Number(e.target.value))} disabled={isReadOnly}
                    className="w-full px-3 py-2.5 text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-center tabular-nums disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tuntutan Kaedah</label>
                  <select value={paymentKaedah} onChange={e => setPaymentKaedah(Number(e.target.value))} disabled={isReadOnly}
                    className="w-full px-3 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed">
                    <option value={1}>Kaedah 1 — Potongan Baucer Bayaran</option>
                    <option value={2}>Kaedah 2 — Bayaran Cek</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selected Violations</span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {calculation.details.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-55 border border-slate-100 rounded-lg p-2">
                        <span>{d.code}</span>
                        <span className="font-bold text-red-600 tabular-nums">RM {d.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {calculation.details.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-2">No violations selected</p>
                    )}
                  </div>
                </div>

                {/* Total Penalty */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-xl p-4 text-center space-y-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Total APPL Penalty</span>
                  <span className="text-3xl font-black text-indigo-955 block tabular-nums">
                    RM {calculation.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* DIGITAL SIGNATURES & VERIFICATION FLOW */}
            <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-md shadow-slate-100 overflow-hidden p-6 space-y-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center font-black text-xs text-violet-600 shadow-sm">
                  03
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider text-left">PERAKUAN & KELULUSAN DIGITAL</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">Administrative verification chain</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
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
                    className={`border-2 rounded-xl p-5 text-center space-y-4 flex flex-col justify-between min-h-[250px] transition-all duration-350 ${
                      sig.id 
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-sm shadow-emerald-100 border-t-4 border-t-emerald-500' 
                        : 'bg-slate-50 border-slate-200 shadow-inner border-t-4 border-t-amber-500'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sig.label}</span>
                        {sig.id ? (
                           <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 rounded border border-emerald-200">SIGNED</span>
                        ) : (
                           <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 rounded">PENDING</span>
                        )}
                      </div>
                      
                      {sig.id ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-emerald-100/60 border border-emerald-250 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 animate-pulse" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 text-sm tracking-tight">{sig.name}</p>
                            {sig.role && <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">{sig.role}</p>}
                            {sig.date && <p className="text-[9px] text-slate-400 font-mono mt-1">{formatDate(sig.date)} • {new Date(sig.date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <div className="w-12 h-12 bg-slate-200 border border-slate-300 rounded-full flex items-center justify-center mx-auto text-slate-400 font-bold text-lg shadow-sm">
                            —
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
        title="Checklist Tuntutan Penalti APPL"
        fileName={`Borang_LAMPIRAN_9_${penalty.id.slice(0, 8).toUpperCase()}.pdf`}
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
                  className="w-full px-3 py-2 bg-white border border-slate-350 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
