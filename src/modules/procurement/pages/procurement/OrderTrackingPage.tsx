// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  FileCheck,
  AlertCircle,
  FileText,
  Activity,
  Truck,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  CheckCircle2,
  Download,
  Building2,
  Send,
  CreditCard,
  Trash2,
  Printer,
  Plus,
  XCircle,
  Eye,
  Gavel,
  ShieldAlert,
  Sparkles
} from 'lucide-react'
import { useUser } from '@/stores/authStore'
import { Modal, SlideOver } from '@/components/ui'
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { supabase } from '@/services/supabase'

import type {
  OrderTrackingStats,
  OrderTrackingListItem,
  OrderTrackingDetail,
  DeliveryProgress,
  LPOReminder
} from '@/types/pharmacy'
import {
  getOrderTrackingStats,
  getOrderTrackingList,
  getOrderTrackingDetail,
  sendReminder,
  deleteReminder,
  recalculateOverdueStatus,
  backfillMissingTrackingRecords,
  repairHistoricalLpoDates,
  OrderTrackingFilter
} from '@/services/pharmacy/orderTrackingService'
import { generateGoodsReceiptPdf } from '@/services/pharmacy/grPdfService'
import { deleteGoodsReceipt, getGoodsReceiptDetail } from '@/services/pharmacy/receivingService'
import { rejectPurchaseOrder } from '@/services/pharmacy/procurementService'
import GoodsReceivingForm from './GoodsReceivingForm'

export default function OrderTrackingPage() {
  const user = useUser()
  const hospitalId = user?.hospital_id || '85bb6adc-b868-428b-83f4-e5af2f5cf904' // Default for dev

  // Data states
  const [stats, setStats] = useState<OrderTrackingStats | null>(null)
  const [items, setItems] = useState<OrderTrackingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeliveryProgress | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Slide-over & Modal states
  const [selectedLpoId, setSelectedLpoId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<OrderTrackingDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [reminderType, setReminderType] = useState<'eta' | 'late'>('eta')
  const [sendingReminder, setSendingReminder] = useState(false)
  const [isReceivingOpen, setIsReceivingOpen] = useState(false)
  const [selectedGRId, setSelectedGRId] = useState<string | null>(null)
  const [grDetail, setGrDetail] = useState<any | null>(null)
  const [loadingGR, setLoadingGR] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchGRDetail = async (grId: string) => {
    setLoadingGR(true)
    const { data, error } = await getGoodsReceiptDetail(grId)
    if (data) setGrDetail(data)
    setLoadingGR(false)
  }

  // Load data
  useEffect(() => {
    const load = async () => {
      // On first mount or hospital change, recalculate
      if (hospitalId && page === 1 && statusFilter === 'all' && categoryFilter === 'all' && !searchTerm) {
        await recalculateOverdueStatus(hospitalId)
      }
      fetchData()
    }
    load()
  }, [hospitalId, page, statusFilter, categoryFilter])

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    
    try {
      // Get stats
      const statsRes = await getOrderTrackingStats(hospitalId)
      if (statsRes.data) setStats(statsRes.data)

      // Get list
      const filter: OrderTrackingFilter = {
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      }

      const listRes = await getOrderTrackingList(hospitalId, filter, page, pageSize)
      if (listRes.data) {
        setItems(listRes.data.data)
        setTotalItems(listRes.data.total)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle Search 
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchData()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSync = async () => {
    if (!hospitalId) return
    setSyncing(true)
    setSyncProgress('Starting sync...')
    try {
      // 1. Recalculate existing overdue statuses and days
      await recalculateOverdueStatus(hospitalId, (msg) => {
        setSyncProgress(msg)
      })
      
      // 2. Backfill any missing tracking records
      setSyncProgress('Analyzing LPOs...')
      const res = await backfillMissingTrackingRecords(hospitalId, (msg) => {
        setSyncProgress(msg)
      })
      if (res.data) {
        // Only show alert if there was something to create, otherwise just refresh silently or with a small toast
        if (res.data.created > 0) {
          alert(`Successfully processed ${res.data.processed} LPOs. Created missing tracking for ${res.data.created} LPOs.`)
        }
        fetchData()
      } else {
        alert('Sync failed: ' + res.error)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during sync.')
    } finally {
      setSyncing(false)
      setSyncProgress(null)
    }
  }

  const handleAutoRepair = async () => {
    if (!hospitalId || !user?.id) return
    if (!window.confirm("Auto-Repair will scan all uploaded PDF LPO files that have missing ETAs, extract their correct 'Pada atau sebelum' deadlines, and update the tracking ledger & supplier penalties. Proceed?")) return
    
    setSyncing(true)
    setSyncProgress('Scanning LPO PDFs...')
    try {
      const res = await repairHistoricalLpoDates(hospitalId, user.id, (msg) => {
        setSyncProgress(msg)
      })
      
      if (res.data) {
        alert(`Auto-repair complete!\nScanned: ${res.data.scanned} LPOs\nSuccessfully repaired: ${res.data.repaired} LPO dates & overdue items.`);
        fetchData()
      } else {
        alert('Auto-repair failed: ' + res.error)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during auto-repair.')
    } finally {
      setSyncing(false)
      setSyncProgress(null)
    }
  }

  const handleViewDetail = async (lpoId: string) => {
    setSelectedLpoId(lpoId)
    setIsDetailOpen(true)
    
    setLoading(true)
    const { data } = await getOrderTrackingDetail(lpoId)
    if (data) setDetailData(data)
    setLoading(false)
  }

  const handleDeleteGR = async (grId: string) => {
    if (!selectedLpoId || !window.confirm('Are you sure you want to delete this goods receipt? This will revert received quantities and associated penalties/credit notes.')) return
    
    setDeletingId(grId)
    try {
      const res = await deleteGoodsReceipt(grId, detailData?.po_id || selectedLpoId)
      if (res.error) {
        alert('Error deleting receipt: ' + res.error)
      } else {
        // Refresh data
        if (selectedGRId === grId) setSelectedGRId(null)
        const detailRes = await getOrderTrackingDetail(selectedLpoId)
        if (detailRes.data) setDetailData(detailRes.data)
        fetchData() // Refresh main list stats
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle Reminder Modal
  const openReminderModal = (lpoId: string, type: 'eta' | 'late') => {
    if (lpoId !== selectedLpoId) {
      // If opening from list view, need to fetch details first
      handleViewDetail(lpoId).then(() => {
        setReminderType(type)
        setIsReminderOpen(true)
      })
    } else {
      setReminderType(type)
      setIsReminderOpen(true)
    }
  }

  // Handle Send Reminder
  const handleSendReminder = async () => {
    if (!detailData || !user?.id) return

    setSendingReminder(true)
    try {
      const nextReminderNumber = (detailData.reminder_count || 0) + 1
      
      const res = await sendReminder(
        detailData.lpo_id,
        user.id,
        {
          lpoNumber: detailData.lpo_number,
          poNumber: detailData.po_number,
          supplierName: detailData.supplier_name,
          supplierEmail: detailData.supplier_email || '',
          orderDate: detailData.lpo_date,
          supplierAddress: detailData.supplier_address,
          items: detailData.items,
          poItems: detailData.po_items,
          hospitalName: detailData.hospital_name,
          hospitalAddress: detailData.hospital_address,
          hospitalPhone: detailData.hospital_phone
        },
        reminderType,
        nextReminderNumber,
        user.full_name,
        user.jawatan
      )

      if (res.data) {
        // Refresh details
        const detailRes = await getOrderTrackingDetail(detailData.lpo_id)
        if (detailRes.data) setDetailData(detailRes.data)
        
        // Close modal and refresh list
        setIsReminderOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
    } finally {
      setSendingReminder(false)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!reminderId) return

    if (!confirm('Are you sure you want to delete this reminder record? This will also remove the PDF file.')) {
      return
    }

    // Check if reminder exists
    const reminder = detailData?.reminders.find(r => r.id === reminderId)
    if (!reminder) {
      console.error('Reminder not found in local state')
      return
    }

    if (reminder?.pdf_url && reminder.pdf_url.includes('/storage/v1/object/public/lpo-documents/')) {
      // Extract the relative path within the bucket
      // Example URL: .../storage/v1/object/public/lpo-documents/reminders/lpo_id/file.pdf
      const urlParts = reminder.pdf_url.split('/lpo-documents/')
      if (urlParts.length > 1) {
        const fullPath = urlParts[1]
        console.log('Deleting PDF from storage:', fullPath)
        await supabase.storage.from('lpo-documents').remove([fullPath])
      }
    }

    setDeletingId(reminderId)
    
    try {
      console.log('Sending delete request to service...')
      const res = await deleteReminder(reminderId)
      if (res.data) {
        // Optimistic update to UI immediately
        if (detailData) {
          setDetailData({
            ...detailData,
            reminders: detailData.reminders.filter(r => r.id !== reminderId),
            reminder_count: Math.max(0, (detailData.reminder_count || 0) - 1)
          })
        }
        
        // Refresh detail data from server to be sure
        const updatedDetail = await getOrderTrackingDetail(detailData!.lpo_id)
        if (updatedDetail.data) setDetailData(updatedDetail.data)
        
        // Also refresh the main list to update counts
        fetchData()
      } else {
        console.error('Failed to delete reminder:', res.error)
        // Fallback alert just in case
        alert('Failed to delete reminder: ' + res.error)
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle Cancel LPO
  const handleCancelLPO = async () => {
    if (!detailData || !user?.id || !cancellationReason.trim()) return

    setCancelling(true)
    try {
      const res = await rejectPurchaseOrder(detailData.po_id, user.id, cancellationReason)
      if (res.data) {
        setIsCancelModalOpen(false)
        setCancellationReason('')
        
        // Refresh details if still open
        if (selectedLpoId) {
          const detailRes = await getOrderTrackingDetail(selectedLpoId)
          if (detailRes.data) setDetailData(detailRes.data)
        }
        
        // Refresh main list and stats
        fetchData()
      } else {
        alert('Failed to cancel LPO: ' + res.error)
      }
    } catch (error) {
      console.error('Error cancelling LPO:', error)
      alert('An error occurred while cancelling the LPO.')
    } finally {
      setCancelling(false)
    }
  }

  // Render Status Badge
  const renderStatusBadge = (status: DeliveryProgress) => {
    switch (status) {
      case 'fully_delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fully Delivered
          </span>
        )
      case 'partially_delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-200">
            <Truck className="w-3.5 h-3.5" />
            Partially Delivered
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-700 border border-gray-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        )
    }
  }


  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans overflow-x-hidden">
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
          <span className="text-slate-800 font-extrabold tracking-wide">Order Tracking</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                Order Tracking
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Monitor procurement cycles, supplier ETAs, and delivery performance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setRefreshing(true); fetchData(); }}
              className={`p-2 h-10 w-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="h-10 px-5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-950 hover:to-black text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:shadow-lg disabled:opacity-50"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{syncing ? syncProgress || 'Syncing...' : 'Sync Tracking'}</span>
            </button>

            <button
              onClick={handleAutoRepair}
              disabled={syncing}
              className="h-10 px-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:shadow-lg disabled:opacity-50"
              title="Automatically scan historic PDF LPOs and repair deadlines"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{syncing ? syncProgress || 'Repairing...' : 'Auto-Repair Deadlines'}</span>
            </button>
          </div>
        </div>

      {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total LPO</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats?.total_tracked || 0}</h3>
              </div>
            </div>
          </motion.div>

         {/* Active LPO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active LPO</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {(stats?.pending_count || 0) + (stats?.overdue_count || 0) + (stats?.partially_delivered_count || 0)}
                </h3>
              </div>
            </div>
          </motion.div>

         {/* Pending Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Del.</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {(stats?.pending_count || 0) + (stats?.partially_delivered_count || 0)}
                </h3>
              </div>
            </div>
          </motion.div>

         {/* Late Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Late Delivery</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats?.overdue_count || 0}</h3>
              </div>
            </div>
          </motion.div>

         {/* Complete LPO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complete LPO</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats?.fully_delivered_count || 0}</h3>
              </div>
            </div>
          </motion.div>

         {/* Cancelled LPO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cancelled LPO</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats?.cancelled_count || 0}</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Filters */}
        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PO, LPO, supplier or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DeliveryProgress | 'all')}
                className="flex-1 sm:flex-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_delivered">Partially Delivered</option>
                <option value="overdue">Overdue</option>
                <option value="fully_delivered">Fully Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 sm:flex-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="APPL">APPL (Pharmaniaga)</option>
                <option value="CC">CC (Central/Local)</option>
                <option value="drug">Drug</option>
                <option value="non_drug">Non-Drug</option>
                <option value="vaccine">Vaccine</option>
                <option value="reagent">Reagent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table - Desktop View, Mobile Cards */}
        <div className="hidden lg:block overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supplier</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vote Code</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery Progress</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Est. Delivery</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overdue</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p>Loading tracking data...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-900">No tracking records found</p>
                    <p className="text-gray-500">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr 
                    key={item.lpo_id} 
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleViewDetail(item.lpo_id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{item.po_number}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {item.document_url ? (
                            <a 
                              href={item.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 hover:underline text-[10px] font-bold flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-3 h-3" />
                              {item.lpo_number}
                            </a>
                          ) : (
                            <span className="text-gray-500 text-[10px] font-medium">{item.lpo_number}</span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.supplier_name}</span>
                        {item.kkm_contract_number && (
                          <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {item.kkm_contract_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{item.vote_code || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[150px]">
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                          <span className="text-gray-700">{item.delivered_items} of {item.total_items} items</span>
                          <span className="text-gray-500">{Math.round((item.delivered_items / Math.max(item.total_items, 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.delivered_items === item.total_items ? 'bg-emerald-500' :
                              item.delivered_items > 0 ? 'bg-amber-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${(item.delivered_items / Math.max(item.total_items, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{formatDate(item.latest_eta)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.delivery_progress === 'overdue' ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-red-600">
                            {item.max_days_overdue} days
                          </span>
                          <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Overdue</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-end gap-2 text-right">
                        {renderStatusBadge(item.delivery_progress)}
                        {item.reminder_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            <Bell className="w-3 h-3" />
                            {item.reminder_count} Reminders
                          </span>
                        )}
                        {(item as any).has_penalties && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            PENALTY ISSUED
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing tracker...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active orders tracked</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.lpo_id}
                onClick={() => handleViewDetail(item.lpo_id)}
                className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all space-y-5"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PO & LPO Reference</span>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">
                      {item.po_number}
                    </h4>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase">{item.lpo_number}</p>
                  </div>
                  {renderStatusBadge(item.delivery_progress)}
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</span>
                    <p className="text-sm font-bold text-gray-900 leading-tight truncate">{item.supplier_name}</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vote Code</span>
                    <p className="text-sm font-bold text-gray-700 leading-tight">{item.vote_code || '-'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gray-100 text-gray-600 uppercase">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
                      <p className="text-sm font-black text-gray-900">{item.delivered_items} / {item.total_items} <span className="text-[10px] font-bold text-gray-400">Items</span></p>
                    </div>
                    <span className="text-sm font-black text-gray-900">{Math.round((item.delivered_items / Math.max(item.total_items, 1)) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.delivered_items === item.total_items ? 'bg-emerald-500' :
                        item.delivered_items > 0 ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${(item.delivered_items / Math.max(item.total_items, 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Est. Delivery</span>
                      <span className="text-xs font-bold text-gray-900">{formatDate(item.latest_eta)}</span>
                    </div>
                  </div>
                  {item.delivery_progress === 'overdue' && (
                    <div className="text-right">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block leading-none">Delay</span>
                      <span className="text-xs font-black text-red-600">{item.max_days_overdue} Days Late</span>
                    </div>
                  )}
                  {item.reminder_count > 0 && item.delivery_progress !== 'overdue' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                      <Bell className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase">{item.reminder_count}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Advanced Premium Pagination Controls */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center sm:text-left">
            Showing <span className="text-slate-900 font-extrabold">{totalItems > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="text-slate-900 font-extrabold">{Math.min(page * pageSize, totalItems)}</span> of <span className="text-slate-900 font-extrabold">{totalItems}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 px-4 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1 active:scale-95 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= totalItems}
              className="h-10 px-4 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1 active:scale-95 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SlideOver for LPO Tracking Detail */}
      <SlideOver
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setIsReceivingOpen(false)
          setSelectedGRId(null)
        }}
        title={isReceivingOpen ? "Record Goods Receipt & Tracking Detail" : selectedGRId ? "Goods Receipt Summary & Tracking Detail" : "Tracking Detail"}
        description={detailData ? `${detailData.po_number} • ${detailData.lpo_number}` : 'Loading...'}
        size={isReceivingOpen || !!selectedGRId ? 'full' : '5xl'}
      >
        <div className={cn(
          "h-full flex flex-col md:flex-row",
          (isReceivingOpen || !!selectedGRId) ? "divide-x divide-gray-200" : ""
        )}>
          {/* Column 1: Tracking Detail */}
          <div className={cn(
            "p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto",
            isReceivingOpen ? "" : ""
          )}>
            {!detailData ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Header Info - More Compact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Department</p>
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{detailData.department || '-'}</p>
                  </div>
                  <div className="bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Order Date</p>
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{formatDate(detailData.order_date)}</p>
                  </div>
                </div>

                {/* Procurement Metadata Grid - Tighter spacing */}
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        Procurement Details
                      </h3>
                      <div className="flex items-center gap-2">
                        {detailData.document_url && (
                          <a
                            href={detailData.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          >
                            <FileText className="w-3.5 h-3.5" /> View LPO
                          </a>
                        )}
                        {!isReceivingOpen && (
                          <button
                            onClick={() => openReminderModal(detailData.lpo_id, detailData.delivery_progress === 'overdue' ? 'late' : 'eta')}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                              detailData.delivery_progress === 'overdue' 
                                ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" 
                                : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                            )}
                          >
                            {detailData.delivery_progress === 'overdue' ? (
                              <><AlertTriangle className="w-3.5 h-3.5" /> Send Late Notice</>
                            ) : (
                              <><Mail className="w-3.5 h-3.5" /> Ask for ETA</>
                            )}
                          </button>
                        )}
                        {!isReceivingOpen && detailData.delivery_progress !== 'cancelled' && (
                          <button
                            onClick={() => setIsCancelModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm bg-white text-rose-600 border-rose-100 hover:bg-rose-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel LPO
                          </button>
                        )}
                      </div>
                    </div>
                  <div className={cn(
                    "grid gap-x-8 gap-y-4",
                    isReceivingOpen ? "grid-cols-2" : "grid-cols-4"
                  )}>
                    <div className={isReceivingOpen ? "col-span-2" : "col-span-1"}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Supplier</p>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{detailData.supplier_name}</p>
                      <p className="text-[11px] text-indigo-600 mt-0.5">{detailData.supplier_email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vote Code</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{detailData.vote_code}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{detailData.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contract No.</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{detailData.kkm_contract_number || 'No Contract'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Disediakan Oleh</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{detailData.created_by_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Disahkan Oleh</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{detailData.approved_by_name || '-'}</p>
                      {detailData.approved_at && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(detailData.approved_at)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unified Items & Tracking Table - Premium Redesign */}
                <div className="bg-white border border-gray-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">
                          Order Items & Tracking
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {detailData.po_items?.length || 0} items in this LPO
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-gray-100 bg-white">
                          <th className={cn("py-5 w-16 text-center", isReceivingOpen ? "px-4" : "px-8")}>#</th>
                          <th className={cn("py-5", isReceivingOpen ? "px-2 min-w-[200px]" : "px-4 min-w-[300px]")}>Item Information</th>
                          <th className={cn("py-5 text-center", isReceivingOpen ? "px-2" : "px-4")}>Qty</th>
                          <th className={cn("py-5 text-right", isReceivingOpen ? "px-2" : "px-4")}>Pricing</th>
                          <th className={cn("py-5 text-center", isReceivingOpen ? "px-2" : "px-4")}>ETA</th>
                          <th className={cn("py-5 text-right", isReceivingOpen ? "px-4" : "px-8")}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {detailData.po_items?.map((item, idx) => {
                          const trackingItem = detailData.items.find(ti => ti.item_id === item.item_id);
                          return (
                            <tr key={item.id || idx} className="group hover:bg-gray-50/50 transition-all duration-300">
                              <td className={cn("py-6 text-center align-top", isReceivingOpen ? "px-4" : "px-8")}>
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-gray-400 font-bold text-[11px] group-hover:bg-white group-hover:shadow-sm transition-all">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className={cn("py-6 align-top", isReceivingOpen ? "px-2" : "px-4")}>
                                <div className="font-black text-gray-900 text-sm leading-tight mb-2 tracking-tight">
                                  {item.item_name || item.packaging_description || item.item_id}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider">
                                    {item.item_code}
                                  </span>
                                  {detailData.penalties?.find(p => 
                                    (p.gr_id && detailData.goods_receipts?.some(gr => gr.id === p.gr_id)) ||
                                    (p.receiving_id && detailData.goods_receipts?.some(gr => gr.id === p.receiving_id)) ||
                                    (p.item_code && p.item_code === item.item_code) || 
                                    (p.item_name && item.item_name && p.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim())
                                  ) && (
                                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <ShieldAlert className="w-2.5 h-2.5" />
                                      Penalty
                                    </span>
                                  )}
                                  {item.packaging_description && (
                                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                                      {item.packaging_description}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={cn("py-6 text-center align-top", isReceivingOpen ? "px-2" : "px-4")}>
                                <div className="text-sm font-black text-gray-900">{item.quantity_ordered}</div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Units</p>
                              </td>
                              <td className={cn("py-6 text-right align-top", isReceivingOpen ? "px-2" : "px-4")}>
                                <div className="text-sm font-black text-gray-900">{formatCurrency(item.total_price)}</div>
                                <div className="text-[10px] text-gray-400 font-medium mt-1">
                                  {formatCurrency(item.unit_price)} / unit
                                </div>
                              </td>
                              <td className={cn("py-6 text-center align-top", isReceivingOpen ? "px-2" : "px-4")}>
                                {trackingItem ? (
                                  <>
                                    <div className={cn("text-sm font-black", trackingItem.is_overdue ? 'text-red-600' : 'text-gray-900')}>
                                      {formatDate(trackingItem.expected_delivery_date)}
                                    </div>
                                    {trackingItem.status === 'delivered' && trackingItem.actual_delivery_date ? (
                                      <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter mt-1">
                                        Received: {formatDate(trackingItem.actual_delivery_date)}
                                      </p>
                                    ) : (
                                      <p className={cn(
                                        "text-[9px] font-bold uppercase tracking-widest mt-1",
                                        trackingItem.is_overdue ? "text-red-500" : "text-gray-400"
                                      )}>
                                        {trackingItem.is_overdue ? "Overdue" : "Schedule"}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-200">-</span>
                                )}
                              </td>
                              <td className={cn("py-6 text-right align-top", isReceivingOpen ? "px-4" : "px-8")}>
                                {trackingItem ? (
                                  <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                                    trackingItem.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    trackingItem.is_overdue ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 
                                    'bg-sky-50 text-sky-600 border border-sky-100'
                                  )}>
                                    {trackingItem.status === 'delivered' ? (
                                      <><CheckCircle2 className="w-3 h-3" /> Delivered</>
                                    ) : trackingItem.is_overdue ? (
                                      <><AlertTriangle className="w-3 h-3 text-white" /> {trackingItem.days_overdue}d Late</>
                                    ) : (
                                      <><Clock className="w-3 h-3" /> Pending</>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-200">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">LPO Total Commitment</p>
                        <p className="text-xs font-bold opacity-80 mt-0.5">Finalized on {formatDate(detailData.lpo_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Amount Payable</p>
                      <p className="text-3xl font-black tracking-tight">{formatCurrency(detailData.total_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Receiving History */}
                <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-500" />
                      Receiving History ({detailData.goods_receipts?.length || 0})
                    </h3>
                    {detailData.delivery_progress !== 'fully_delivered' && !isReceivingOpen && (
                      <button
                        onClick={() => setIsReceivingOpen(true)}
                        className="text-[10px] font-black uppercase tracking-wider px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Receive Goods
                      </button>
                    )}
                  </div>
                  
                  {(!detailData.goods_receipts || detailData.goods_receipts.length === 0) ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-10 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">No receipts yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Goods receipts will appear here once items are delivered.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-gray-100 text-sm">
                        {detailData.goods_receipts.map((gr, idx) => (
                          <div key={gr.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                            <div 
                              className="flex items-center gap-4 cursor-pointer group/item transition-all"
                              onClick={() => {
                                setSelectedGRId(gr.id);
                                fetchGRDetail(gr.id);
                              }}
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner bg-emerald-50 text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                                #{detailData.goods_receipts!.length - idx}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                                    {gr.gr_number}
                                  </span>
                                  <p className="text-sm font-bold text-gray-900 group-hover/item:text-emerald-600 transition-colors">
                                    {formatDate(gr.receipt_date)}
                                  </p>
                                  {detailData.penalties?.some(p => 
                                    p.gr_id === gr.id || 
                                    (p as any).receiving_id === gr.id || 
                                    (p.lpo_id === detailData.lpo_id)
                                  ) && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest border border-rose-100">
                                      Penalty Alert
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                                  <p className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Inv: {gr.invoice_number || '-'} | DO: {gr.delivery_note_number || '-'}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    By: <span className="font-medium text-gray-700">{gr.received_by_user?.full_name || 'System'}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                gr.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                gr.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "bg-gray-50 text-gray-600 border-gray-200"
                              )}>
                                {gr.status}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateGoodsReceiptPdf(gr as any);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100"
                                title="Print Goods Receipt Note"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGR(gr.id);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
                                title="Delete Goods Receipt"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {/* Reminder History */}
                {!isReceivingOpen && (
                  <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-500" />
                        Reminder Audit ({detailData.reminders.length})
                      </h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => openReminderModal(detailData.lpo_id, 'eta')}
                          className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Ask ETA
                        </button>
                        {detailData.delivery_progress === 'overdue' && (
                          <button
                            onClick={() => openReminderModal(detailData.lpo_id, 'late')}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-200 flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Late Notice
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {detailData.reminders.length === 0 ? (
                      <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-10 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 tracking-tight">No reminders sent yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Supplier communication will be logged here.</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-gray-100 text-sm">
                          {detailData.reminders.map((reminder, idx) => (
                            <div key={reminder.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner",
                                  reminder.reminder_type === 'eta' ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"
                                )}>
                                  #{detailData.reminders.length - idx}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                      reminder.reminder_type === 'eta' ? "bg-indigo-100 text-indigo-700" : "bg-red-100 text-red-700"
                                    )}>
                                      {reminder.reminder_type === 'eta' ? 'ETA REQUEST' : 'LATE NOTICE'}
                                    </span>
                                    <p className="text-sm font-bold text-gray-900">
                                      {formatDateTime(reminder.sent_at)}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                                    <p className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {reminder.recipient_email}
                                    </p>
                                    <p className="flex items-center gap-1">
                                      <Activity className="w-3 h-3" />
                                      By: <span className="font-medium text-gray-700">{reminder.sender?.full_name || (reminder.sent_by ? `User ${reminder.sent_by.slice(0, 8)}` : 'System')}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {reminder.pdf_url && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('Delete icon clicked');
                                      handleDeleteReminder(reminder.id);
                                    }}
                                    disabled={deletingId === reminder.id}
                                    className={cn(
                                      "p-2 rounded-xl transition-all border",
                                      deletingId === reminder.id
                                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                        : "bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-100 shadow-sm"
                                    )}
                                    title="Delete reminder"
                                  >
                                    {deletingId === reminder.id ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>

                                  <button 
                                    onClick={() => {
                                      const url = reminder.pdf_url;
                                      if (url.startsWith('data:')) {
                                        try {
                                          const parts = url.split(',');
                                          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
                                          const bstr = atob(parts[1]);
                                          let n = bstr.length;
                                          const u8arr = new Uint8Array(n);
                                          while (n--) {
                                            u8arr[n] = bstr.charCodeAt(n);
                                          }
                                          const blob = new Blob([u8arr], { type: mime });
                                          const blobUrl = URL.createObjectURL(blob);
                                          window.open(blobUrl, '_blank');
                                        } catch (e) {
                                          console.error('Failed to open PDF data URI:', e);
                                          window.open(url, '_blank');
                                        }
                                      } else {
                                        window.open(url, '_blank');
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    View PDF
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Goods Receiving Form */}
          {isReceivingOpen && detailData && (
            <div className="flex-1 h-full overflow-hidden bg-white">
              <GoodsReceivingForm
                isOpen={true}
                isEmbedded={true}
                onClose={() => setIsReceivingOpen(false)}
                poId={detailData.po_id}
                onSuccess={() => {
                  setIsReceivingOpen(false)
                  // Reload detail data
                  if (selectedLpoId) {
                    void (async () => {
                      const res = await getOrderTrackingDetail(selectedLpoId)
                      if (res.data) setDetailData(res.data)
                    })()
                  }
                  fetchData()
                }}
              />
            </div>
          )}

          {/* Column 3: Goods Receipt Summary */}
          {selectedGRId && (
            <div className="flex-1 h-full overflow-y-auto bg-gray-50/30 p-8">
              {loadingGR ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fetching Receipt Details...</p>
                  </div>
                </div>
              ) : grDetail ? (
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Summary Header */}
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {grDetail.gr_number}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {formatDate(grDetail.receipt_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Receipt Summary</h2>
                          {(() => {
                            const sourcePenalties = (grDetail.penalties && grDetail.penalties.length > 0) ? grDetail.penalties : detailData.penalties;
                            const grPenalties = sourcePenalties?.filter(p => 
                              p.gr_id === grDetail.id || p.receiving_id === grDetail.id || p.lpo_id === grDetail.lpo_id
                            );
                            
                            if (!grPenalties || grPenalties.length === 0) return null;
                            
                            const maxDays = Math.max(...grPenalties.map(p => p.days_delayed || 0));
                            
                            return (
                              <div className="px-3 py-1.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-2 animate-pulse">
                                <Gavel className="w-4 h-4 text-rose-500" />
                                <span className="text-xs font-black text-rose-600 uppercase tracking-widest">
                                  Penalty Alert {maxDays > 0 && `• ${maxDays} ${maxDays === 1 ? 'Day' : 'Days'} Late`}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedGRId(null)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X className="w-6 h-6 text-gray-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-8 border-y border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Details</p>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            Invoice: <span className="text-indigo-600">{grDetail.invoice_number || '-'}</span>
                          </p>
                          <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            Delivery Order No. (DO): <span className="text-indigo-600">{grDetail.delivery_note_number || '-'}</span>
                          </p>
                          <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            Supplier: <span className="text-indigo-600">{grDetail.purchase_order?.supplier?.company_name || grDetail.purchase_order?.manual_supplier_name || '-'}</span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Received By</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 shadow-inner">
                            {grDetail.received_by_user?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{grDetail.received_by_user?.full_name || 'System User'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Pharmacy Personnel</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {grDetail.notes && (
                      <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Internal Notes</p>
                        <p className="text-sm text-amber-900 font-medium">{grDetail.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">Received Items</h3>
                      <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-black text-gray-600">
                        {grDetail.items?.length || 0} POSITIONS
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Information</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Disposition</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {grDetail.items?.map((item: any, i: number) => (
                            <tr key={item.id || i} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-4">
                                <p className="text-sm font-black text-gray-900 mb-1">{item.po_item?.item_name || 'Unknown Item'}</p>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px] font-black uppercase">
                                    {item.po_item?.item_code || '-'}
                                  </span>
                                  {item.batch_number && (
                                    <span className="text-[10px] font-mono text-indigo-600 font-bold">
                                      Batch: {item.batch_number}
                                    </span>
                                  )}
                                  {item.expiry_date && (
                                    <span className="text-[10px] text-rose-500 font-bold">
                                      Exp: {formatDate(item.expiry_date)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <p className="text-sm font-black text-gray-900">{item.quantity_received}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Units</p>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                  item.disposition === 'accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  item.disposition === 'credit_note' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                  "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                  {item.disposition || 'received'}
                                </span>
                                  {(() => {
                                    // Use penalties from grDetail if available, otherwise fallback to detailData
                                    const sourcePenalties = (grDetail.penalties && grDetail.penalties.length > 0) ? grDetail.penalties : detailData.penalties;
                                    const itemPenalty = sourcePenalties?.find(p => 
                                      (p.gr_id === grDetail.id || p.receiving_id === grDetail.id || p.lpo_id === grDetail.lpo_id) && (
                                        (p.item_code && p.item_code === item.po_item?.item_code) ||
                                        (p.item_name?.trim().toLowerCase() === item.po_item?.item_name?.trim().toLowerCase()) ||
                                        (p.item_name?.trim().toLowerCase() === item.po_item?.packaging_description?.trim().toLowerCase())
                                      )
                                    );
                                    if (!itemPenalty) return null;
                                    return (
                                      <div className="mt-1 flex items-center gap-1">
                                        <div className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100 flex items-center gap-1">
                                          <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">
                                            {itemPenalty.penalty_type.replace('_', ' ')}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center px-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                      Generated by AntiGravity AI • {formatDateTime(new Date().toISOString())}
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => generateGoodsReceiptPdf(grDetail)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                        Print Copy
                      </button>
                      <button 
                        onClick={() => setSelectedGRId(null)}
                        className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                      >
                        Done Viewing
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400 font-bold uppercase tracking-[0.2em]">No details available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SlideOver>

      {/* Reminder Generation Modal */}
      <Modal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        title="Send Reminder to Supplier"
        size="lg"
      >
        {detailData ? (
          <div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-medium mb-0.5">PO Number</p>
                  <p className="font-semibold text-gray-900">{detailData.po_number}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-0.5">LPO Number</p>
                  <p className="font-semibold text-gray-900">{detailData.lpo_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 font-medium mb-0.5">Supplier</p>
                  <p className="font-semibold text-gray-900">{detailData.supplier_name}</p>
                  <p className="text-indigo-600">{detailData.supplier_email || 'No email on file'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="text-sm font-bold text-gray-900 uppercase tracking-wider block">
                Reminder Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setReminderType('eta')}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    reminderType === 'eta' 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      reminderType === 'eta' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {reminderType === 'eta' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="font-semibold text-gray-900">Ask for ETA</span>
                  </div>
                  <p className="text-xs text-gray-500 pl-6">Request delivery status update</p>
                </button>

                <button
                  onClick={() => setReminderType('late')}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    reminderType === 'late' 
                      ? 'border-red-500 bg-red-50/50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      reminderType === 'late' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                    }`}>
                      {reminderType === 'late' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="font-semibold text-gray-900">Late Notice</span>
                  </div>
                  <p className="text-xs text-gray-500 pl-6">Formal overdue notification</p>
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  This will generate Reminder #{ (detailData.reminder_count || 0) + 1 }
                </p>
                <p className="text-xs text-indigo-700 mt-1">
                  A PDF letter will be generated and saved to the system. You can download it to email the supplier.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setIsReminderOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={sendingReminder}
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder || !detailData}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
              >
                {sendingReminder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate & Send
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !cancelling && setIsCancelModalOpen(false)}
        title="Cancel LPO"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-900">Are you sure you want to cancel this LPO?</p>
              <p className="text-xs text-rose-700 mt-1">
                This will mark the Purchase Order as <strong>Cancelled</strong> and restore the committed funds to the budget allocation. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g., Supplier unable to fulfill, item discontinued, or price mismatch..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm min-h-[100px] transition-all"
              disabled={cancelling}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              disabled={cancelling}
            >
              Back
            </button>
            <button
              onClick={handleCancelLPO}
              disabled={cancelling || !cancellationReason.trim()}
              className="flex-[2] px-6 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Confirm Cancellation
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
      </div> {/* Closing w-full p-6 lg:p-8 space-y-6 container */}
    </div>
  )
}
