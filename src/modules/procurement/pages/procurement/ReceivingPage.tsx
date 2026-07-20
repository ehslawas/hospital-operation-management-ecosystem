// @ts-nocheck
import { 
  IconAlertCircle, 
  IconPackage, 
  IconSearch, 
  IconFilter, 
  IconChevronLeft, 
  IconChevronRight,
  IconClock,
  IconCheckCircle,
  IconClipboardList,
  IconFileText,
  IconShieldCheck,
  IconUpload
} from '@/components/ui/Icons'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select } from '@/components/ui'
import { getPurchaseOrders, getReceivingCounts } from '@/services/pharmacy/procurementService'
import type { PurchaseOrderWithRelations, POStatus } from '@/types/pharmacy'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import GoodsReceivingForm from './GoodsReceivingForm'
import ExcelUploadModal from './ExcelUploadModal'
import { cn } from '@/lib/utils'
import { ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '@/services/supabase'
import { createSupplierAssessment, updateLPOPaymentStatus } from '@/services/pharmacy/lpoService'
import { getGoodsReceiptHistory } from '@/services/pharmacy/receivingService'

const ReceivingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [orders, setOrders] = useState<PurchaseOrderWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState({ fullyReceived: 0, partialReceived: 0, totalReceipts: 0, assessedLpos: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'partial_received' | 'completed' | 'all'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 15

  // Form State
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const handleBulkProceedToPayment = async () => {
    if (!hospitalId) return

    const confirmProceed = window.confirm(
      "Adakah anda pasti untuk memproses bayaran bagi semua LPO yang telah selesai Penilaian Prestasi?\n\nStatus pembayaran akan dikemaskini kepada 'Sent for Payment'."
    )
    if (!confirmProceed) return

    setIsProcessingPayment(true)
    let processedCount = 0
    let skippedCount = 0
    let failedCount = 0

    try {
      // Fetch all POs for this hospital with LPO assessments
      const { data: poList, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select(`
          id,
          status,
          lpo:pharmacy_lpo(
            id,
            lpo_number,
            payment_status,
            assessments:pharmacy_supplier_assessments(id)
          )
        `)
        .eq('hospital_id', hospitalId)
        .in('status', ['partial_received', 'completed'])

      if (poError) throw poError

      if (!poList || poList.length === 0) {
        alert("Tiada LPO ditemui.")
        setIsProcessingPayment(false)
        return
      }

      for (const po of poList) {
        if (!po.lpo || po.lpo.length === 0) {
          continue
        }

        for (const lpo of po.lpo) {
          const hasAssessments = lpo.assessments && lpo.assessments.length > 0
          const isEligiblePayment = !lpo.payment_status || lpo.payment_status === 'pending'

          if (hasAssessments && isEligiblePayment) {
            const res = await updateLPOPaymentStatus(lpo.id, 'sent_for_payment')
            if (res.error) {
              failedCount++
            } else {
              processedCount++
            }
          } else {
            skippedCount++
          }
        }
      }

      alert(`Proses selesai!\n- Bayaran diproses: ${processedCount} LPO\n- Gagal: ${failedCount}\n- Dilangkau/Sudah diproses: ${skippedCount}`)
      await loadOrders()
    } catch (err: any) {
      console.error(err)
      alert("Ralat berlaku ketika memproses bayaran: " + (err.message || String(err)))
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleAutoFillAssessments = async () => {
    if (!hospitalId) return
    
    const confirmProceed = window.confirm(
      "Adakah anda pasti untuk mengisi secara automatik Penilaian Prestasi Pembekal bagi semua pesanan yang bertanda 'Belum'?\n\nPenilaian akan dikira berdasarkan tarikh jangkaan penghantaran dan tarikh penerimaan sebenar."
    )
    if (!confirmProceed) return

    setIsAutoFilling(true)
    let processedCount = 0
    let skippedCount = 0
    let failedCount = 0

    try {
      // Fetch all POs for this hospital in 'partial_received' or 'completed' status
      const { data: poList, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select(`
          id,
          po_number,
          expected_delivery_date,
          actual_delivery_date,
          lpo:pharmacy_lpo(id, lpo_number, expected_delivery_date, tracking:pharmacy_order_tracking(expected_delivery_date))
        `)
        .eq('hospital_id', hospitalId)
        .in('status', ['partial_received', 'completed'])

      if (poError) throw poError

      if (!poList || poList.length === 0) {
        alert("Tiada pesanan untuk dinilai.")
        setIsAutoFilling(false)
        return
      }

      for (const po of poList) {
        const lpo = po.lpo?.[0]
        const lpoId = lpo?.id
        if (!lpoId) {
          skippedCount++
          continue
        }

        // Fetch GR history for this PO
        const historyRes = await getGoodsReceiptHistory(po.id)
        if (historyRes.error || !historyRes.data || historyRes.data.length === 0) {
          skippedCount++
          continue
        }

        const history = historyRes.data

        // Fetch existing assessments for this LPO
        const { data: existingAssessments, error: assessError } = await supabase
          .from('pharmacy_supplier_assessments')
          .select('*')
          .eq('lpo_id', lpoId)

        if (assessError) {
          failedCount++
          continue
        }

        // Determine unassessed Goods Receipts
        const unassessedGrs = history.filter(
          (gr) => !existingAssessments?.some((a) => a.goods_receipt_id === gr.id)
        )

        if (unassessedGrs.length === 0) {
          continue
        }

        // Get expected delivery date for calculation
        let expectedDateStr = null
        if (lpo.expected_delivery_date) {
          expectedDateStr = lpo.expected_delivery_date
        } else if (Array.isArray(lpo.tracking) && lpo.tracking.length > 0) {
          const track = lpo.tracking.find((t: any) => t.expected_delivery_date)
          if (track) {
            expectedDateStr = track.expected_delivery_date
          }
        }
        if (!expectedDateStr && po.expected_delivery_date) {
          expectedDateStr = po.expected_delivery_date
        }

        // For each unassessed GR, calculate ratings and create assessment
        for (const gr of unassessedGrs) {
          const actualDateStr = gr.receipt_date || po.actual_delivery_date
          
          let deliveryStars = 5 // Default if not enough date info to determine delay
          
          if (expectedDateStr && actualDateStr) {
            const expected = new Date(expectedDateStr)
            const actual = new Date(actualDateStr)
            
            // Clear times for date-only comparison
            const expectedDateOnly = new Date(expected.getFullYear(), expected.getMonth(), expected.getDate())
            const actualDateOnly = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate())
            
            const diffTime = actualDateOnly.getTime() - expectedDateOnly.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            if (diffDays <= 0) {
              deliveryStars = 5
            } else if (diffDays <= 7) {
              deliveryStars = 4
            } else {
              deliveryStars = 3
            }
          }

          const quality = 5
          const support = 5
          const totalScore = quality + support + deliveryStars
          const percentage = Math.round((totalScore / 15) * 100)

          let performanceLevel = 'Tidak Memuaskan'
          if (percentage >= 80) {
            performanceLevel = 'Sangat Memuaskan'
          } else if (percentage >= 60) {
            performanceLevel = 'Memuaskan'
          }

          const response = await createSupplierAssessment({
            lpo_id: lpoId,
            goods_receipt_id: gr.id,
            ratings: {
              quality,
              support,
              delivery: deliveryStars
            },
            total_score: totalScore,
            percentage,
            performance_level: performanceLevel,
            comments: 'Penilaian auto-generated berdasarkan tempoh penghantaran.',
            assessed_by: user?.id
          })

          if (response.error) {
            failedCount++
          } else {
            processedCount++
          }
        }
      }

      alert(`Proses selesai!\n- Berjaya dinilai: ${processedCount} resit\n- Gagal: ${failedCount}\n- Tiada tindakan diperlukan / dilangkau: ${skippedCount}`)
      await loadOrders()
    } catch (err: any) {
      console.error(err)
      alert("Ralat berlaku ketika memproses penilaian: " + (err.message || String(err)))
    } finally {
      setIsAutoFilling(false)
    }
  }

  // Load orders pending receiving
  const loadOrders = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const validStatuses: POStatus[] = statusFilter === 'all' 
      ? ['partial_received', 'completed'] 
      : [statusFilter] as POStatus[]

    const res = await getPurchaseOrders(
      hospitalId,
      { 
        search: search || undefined,
        status: validStatuses.join(','),
      },
      page,
      pageSize
    )

    const countRes = await getReceivingCounts(hospitalId)
    let assessedLposCount = 0
    try {
      const { data: poList } = await supabase
        .from('pharmacy_purchase_orders')
        .select(`
          id,
          lpo:pharmacy_lpo(
            id,
            assessments:pharmacy_supplier_assessments(id)
          )
        `)
        .eq('hospital_id', hospitalId)
        .in('status', ['partial_received', 'completed'])

      assessedLposCount = poList?.filter(po => 
        po.lpo?.some((l: any) => l.assessments && l.assessments.length > 0)
      ).length || 0
    } catch (e) {
      console.error(e)
    }

    if (countRes.data) {
      setCounts({
        ...countRes.data,
        assessedLpos: assessedLposCount
      })
    }

    if (res.error) {
      setError(res.error)
      setOrders([])
    } else if (res.data) {
      setOrders(res.data.data)
      setTotalPages(res.data.totalPages)
    }

    setIsLoading(false)
  }, [hospitalId, search, statusFilter, page])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const handleViewDetails = (poId: string) => {
    setSelectedPoId(poId)
    setIsFormOpen(true)
  }

  const renderStatusBadge = (status: POStatus) => {
    const map: Record<POStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      draft: { color: 'secondary', label: 'DRAFT' },
      pending_approval: { color: 'warning', label: 'PENDING' },
      approved: { color: 'info', label: 'APPROVED' },
      sent: { color: 'info', label: 'AWAITING DELIVERY' },
      partial_received: { color: 'warning', label: 'PARTIAL' },
      completed: { color: 'success', label: 'COMPLETED' },
      cancelled: { color: 'error', label: 'CANCELLED' },
    }
    const cfg = map[status] || { color: 'secondary', label: status.toUpperCase() }
    return (
      <Badge variant={cfg.color} className="font-black text-[9px] tracking-widest px-3 py-1 border shadow-sm">
        {cfg.label}
      </Badge>
    )
  }

  const renderPaymentStatusBadge = (order: any) => {
    if (!order.lpo || order.lpo.length === 0) {
      return (
        <Badge variant="secondary" className="font-black text-[9px] tracking-widest px-3 py-1 border shadow-sm">
          UNPAID
        </Badge>
      )
    }

    const statuses = order.lpo.map((l: any) => l.payment_status || 'pending')

    if (statuses.includes('paid')) {
      const allPaid = statuses.every((s: string) => s === 'paid')
      return (
        <Badge variant={allPaid ? 'success' : 'warning'} className="font-black text-[9px] tracking-widest px-3 py-1 border shadow-sm">
          {allPaid ? 'FULLY PAID' : 'PARTIALLY PAID'}
        </Badge>
      )
    }

    if (statuses.includes('sent_for_payment')) {
      return (
        <Badge variant="info" className="font-black text-[9px] tracking-widest px-3 py-1 border shadow-sm">
          PROCESSING
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="font-black text-[9px] tracking-widest px-3 py-1 border shadow-sm">
        UNPAID
      </Badge>
    )
  }


  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' }
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getLatestReceipt = (order: any) => {
    const allReceipts: { date: string; doNumber: string; createdAt: string }[] = []
    if (order.goods_receipts) {
      order.goods_receipts.forEach((gr: any) => {
        allReceipts.push({
          date: gr.receipt_date,
          doNumber: gr.delivery_note_number,
          createdAt: gr.created_at
        })
      })
    }
    if (order.lpo) {
      order.lpo.forEach((l: any) => {
        if (l.receiving) {
          l.receiving.forEach((rec: any) => {
            allReceipts.push({
              date: rec.receiving_date,
              doNumber: rec.do_number,
              createdAt: rec.created_at
            })
          })
        }
      })
    }
    if (allReceipts.length === 0) return null
    return allReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }

  const getAllDoNumbers = (order: any) => {
    const doNumbers = new Set<string>()
    if (order.goods_receipts) {
      order.goods_receipts.forEach((gr: any) => {
        if (gr.delivery_note_number) {
          doNumbers.add(gr.delivery_note_number.trim())
        }
      })
    }
    if (order.lpo) {
      order.lpo.forEach((l: any) => {
        if (l.receiving) {
          l.receiving.forEach((rec: any) => {
            if (rec.do_number) {
              doNumbers.add(rec.do_number.trim())
            }
          })
        }
      })
    }
    return Array.from(doNumbers)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Enhanced Breadcrumb navigation with mini icons */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="text-slate-400">Financial</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Procurement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold tracking-wide">Goods Receiving</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <IconPackage className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                Goods Receiving
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Audit-Ready Inventory Intake Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoFillAssessments}
              disabled={isAutoFilling}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
              {isAutoFilling ? 'Memproses...' : 'Auto-Fill Penilaian'}
            </button>
            <button
              onClick={handleBulkProceedToPayment}
              disabled={isProcessingPayment}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
            >
              <IconCheckCircle className="w-4 h-4 text-emerald-250 animate-pulse" />
              {isProcessingPayment ? 'Memproses...' : 'Proses Bayaran (Bulk)'}
            </button>
            <button
              onClick={() => setIsExcelUploadOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0"
            >
              <IconUpload className="w-4 h-4" />
              Upload Excel
            </button>
          </div>
        </div>

        {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Total Receipts */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconClipboardList className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Registry</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{counts.totalReceipts}</h3>
                  <p className="text-[11px] font-semibold text-slate-400">Total intake records</p>
                </div>
              </div>
            </div>

            {/* Fully Received */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fully Fulfilled</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{counts.fullyReceived}</h3>
                  <p className="text-[11px] font-semibold text-emerald-600">Audit verified intake</p>
                </div>
              </div>
            </div>

            {/* Assessed LPOs (Penilaian Prestasi) */}
            <div className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <IconCheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Penilaian Prestasi</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{counts.assessedLpos || 0}</h3>
                  <p className="text-[11px] font-semibold text-indigo-600">LPO selesai dinilai</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main Registry Content */}
      <div className="space-y-6 relative z-20">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 shadow-xl overflow-hidden">
          {/* Action Bar */}
          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6">
            <div className="flex flex-col xl:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconSearch className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Registry by PO, DO or Supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              
              <div className="flex items-center gap-4 w-full xl:w-auto">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full xl:w-auto border border-slate-200">
                  {(['all', 'partial_received', 'completed'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        statusFilter === s
                          ? 'bg-white text-slate-900 shadow-md font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {s === 'all' ? 'FULL REGISTRY' : s.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Registry Table */}
          <div className="relative">
            {isLoading ? (
              <div className="py-40 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                  <IconPackage className="absolute inset-0 m-auto w-6 h-6 text-slate-900 animate-pulse" />
                </div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Decrypting Official Records...</p>
              </div>
            ) : error ? (
              <div className="py-32 flex flex-col items-center text-center px-8">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                  <IconAlertCircle className="w-12 h-12 text-rose-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Registry Access Failure</h3>
                <p className="text-slate-500 mt-2 max-w-sm font-bold">{error}</p>
                <button onClick={() => void loadOrders()} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Re-Authenticate Registry</button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
                <Table className="w-full border-collapse table-fixed">
                  <Table.Head className="bg-slate-50/80">
                    <Table.Row>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 pl-6 border-r border-slate-100 w-[180px]">Receive Date</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100 w-[150px] text-center">DO Identifier</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100 w-[200px]">Reference Chain</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100 text-center w-[110px]">Vote Code</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100 w-[130px] text-center">Department</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100">Supplier Entity</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100 text-center w-[140px]">Payment Status</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 border-r border-slate-100 text-center w-[150px]">Penilaian Prestasi</Table.Cell>
                      <Table.Cell as="th" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-5 text-center pr-6 w-[130px]">Status</Table.Cell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {orders.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={9} className="text-center py-40 bg-slate-50/50">
                          <div className="flex flex-col items-center opacity-30">
                            <IconClipboardList className="w-20 h-20 text-slate-300 mb-4" />
                            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">No registry entries found</p>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      orders.map((order) => {
                        const latestReceipt = getLatestReceipt(order)
                        const doNumbers = getAllDoNumbers(order)
                        const lpoNumbers = order.lpo?.map(l => l.lpo_number).filter(Boolean)
                        
                        return (
                          <Table.Row
                            key={order.id}
                            onClick={() => handleViewDetails(order.id)}
                            className="group transition-all hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <Table.Cell className="py-8 pl-6 border-r border-slate-50 w-[180px]">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                  <span className="text-sm font-black text-slate-900 tracking-tight">
                                    {formatDateTime(latestReceipt?.date || order.actual_delivery_date).date}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 pl-5">
                                  <IconClock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {formatDateTime(latestReceipt?.date || order.actual_delivery_date).time}
                                  </span>
                                </div>
                              </div>
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50 text-center w-[150px]">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                {doNumbers.length > 0 ? (
                                  doNumbers.map((doNum, idx) => (
                                    <div
                                      key={idx}
                                      className="inline-block px-4 py-2 bg-slate-100 border border-slate-200 rounded text-[11px] font-black text-slate-900 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 uppercase tracking-wider"
                                    >
                                      {doNum}
                                    </div>
                                  ))
                                ) : (
                                  <div className="inline-block px-4 py-2 bg-slate-100 border border-slate-200 rounded text-[11px] font-black text-slate-900 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 uppercase tracking-wider">
                                    {latestReceipt ? 'NOT RECORDED' : 'PENDING DELIVERY'}
                                  </div>
                                )}
                              </div>
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50 w-[200px]">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-8">PO</span>
                                  <span className="font-mono text-xs font-black text-slate-900 bg-white border-b-2 border-slate-900 px-2 py-0.5">
                                    {order.po_number}
                                  </span>
                                </div>
                                {lpoNumbers && lpoNumbers.length > 0 && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-8">LPO</span>
                                    <div className="flex flex-wrap gap-1">
                                      {lpoNumbers.slice(0, 2).map((num, i) => (
                                        <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                          {num}
                                        </span>
                                      ))}
                                      {lpoNumbers.length > 2 && (
                                        <span className="text-[9px] font-black text-slate-400">+{lpoNumbers.length - 2} MORE</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50 text-center w-[110px]">
                              <span className="font-mono text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                                {order.vote_code || '—'}
                              </span>
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50 text-center w-[130px]">
                              <span className="text-xs font-bold text-slate-750 uppercase tracking-wider">
                                {order.department || '—'}
                              </span>
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <IconFileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-black text-slate-900 tracking-tight leading-tight mb-1 uppercase group-hover:text-blue-600 transition-colors truncate" title={order.supplier?.company_name}>
                                    {order.supplier?.company_name || '—'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      VENDOR ID: {order.supplier?.supplier_code || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50 text-center w-[140px]">
                              {renderPaymentStatusBadge(order)}
                            </Table.Cell>

                            <Table.Cell className="py-8 border-r border-slate-50 text-center w-[150px]">
                              {(() => {
                                const hasAssessments = order.lpo?.some((l: any) => l.assessments && l.assessments.length > 0)
                                return hasAssessments ? (
                                  <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                    Selesai
                                  </span>
                                ) : (
                                  <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                    Belum
                                  </span>
                                )
                              })()}
                            </Table.Cell>

                            <Table.Cell className="py-8 text-center pr-6 w-[130px]">
                              {renderStatusBadge(order.status)}
                            </Table.Cell>
                          </Table.Row>
                        )
                      })
                    )}
                  </Table.Body>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Audit Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl mt-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-slate-900 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Page <span className="text-slate-900">{page}</span> / <span className="text-slate-900">{totalPages}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-900 hover:text-slate-900 disabled:opacity-20 transition-all"
              >
                <IconChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-20 transition-all shadow-lg shadow-slate-900/10"
              >
                Next
                <IconChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {selectedPoId && (
        <GoodsReceivingForm
          poId={selectedPoId}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            void loadOrders()
          }}
        />
      )}

      {isExcelUploadOpen && (
        <ExcelUploadModal
          isOpen={isExcelUploadOpen}
          onClose={() => setIsExcelUploadOpen(false)}
          onSuccess={() => {
            void loadOrders()
          }}
        />
      )}
    </div>
  )
}

export default ReceivingPage

