import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Spinner } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown,
  Search,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Truck,
  PackageCheck,
  CreditCard,
  FileWarning,
  ShieldAlert,
  FileSignature,
  Star,
  Calendar,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line
} from 'recharts'
import { generateProcurementReport, ProcurementReportData } from '@/services/pharmacy/procurementReportService'
import { generateProcurementReportPdf } from '@/services/pharmacy/procurementReportPdfService'
import { generateETAReportPdf, generateLateReportPdf } from '@/services/pharmacy/orderTrackingReportPdfService'

// ─── Color Palette ───────────────────────────────────────────────────────────
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed']
const STATUS_COLORS: Record<string, string> = {
  approved: '#10b981', completed: '#059669', pending: '#f59e0b', cancelled: '#ef4444',
  verified: '#6366f1', sent: '#3b82f6', active: '#10b981', expired: '#ef4444',
  issued: '#8b5cf6', partial: '#f59e0b', overdue: '#ef4444', delivered: '#10b981',
  paid: '#10b981', sent_for_payment: '#f59e0b', 'partially_delivered': '#f59e0b',
  draft: '#94a3b8', PartialReceived: '#f59e0b'
}
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6']

// ─── Tab Definitions ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'purchase_orders', label: 'Purchase Orders', icon: FileSpreadsheet, color: 'indigo' },
  { id: 'lpo', label: 'LPO', icon: FileText, color: 'violet' },
  { id: 'order_tracking', label: 'Order Tracking', icon: Truck, color: 'blue' },
  { id: 'received_items', label: 'Received Items', icon: PackageCheck, color: 'emerald' },
  { id: 'payment', label: 'Payment', icon: CreditCard, color: 'teal' },
  { id: 'credit_notes', label: 'Credit Notes', icon: FileWarning, color: 'amber' },
  { id: 'penalties', label: 'Penalties', icon: ShieldAlert, color: 'rose' },
  { id: 'lou', label: 'LOU', icon: FileSignature, color: 'purple' },
  { id: 'supplier_performance', label: 'Supplier Performance', icon: Star, color: 'sky' }
]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md text-slate-800 px-4 py-3 rounded-xl shadow-2xl border border-slate-200/80">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs font-bold flex items-center gap-2 mt-1">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500 font-semibold">{entry.name}:</span>
          <span className="text-slate-800 font-extrabold">{typeof entry.value === 'number' && entry.value > 1000 ? formatCurrency(entry.value).replace('MYR', 'RM') : entry.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplay(eased * value)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])
  return <span>{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}{suffix}</span>
}

// ─── Donut Chart Component ───────────────────────────────────────────────────
function MiniDonut({ data, colors, size = 160 }: { data: { name: string, value: number }[], colors?: string[], size?: number }) {
  const cols = colors || PIE_COLORS
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.32}
            outerRadius={size * 0.45}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationBegin={200}
            animationDuration={1200}
          >
            {data.map((_, i) => <Cell key={i} fill={cols[i % cols.length]} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800">{total}</span>
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Total</span>
      </div>
    </div>
  )
}

// ─── Progress Ring ───────────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 80, strokeWidth = 6, color = '#6366f1' }: { percentage: number, size?: number, strokeWidth?: number, color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black" style={{ color }}>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, prefix, suffix, icon: Icon, color, delay = 0, decimals = 0 }: {
  label: string, value: number, prefix?: string, suffix?: string, icon: any, color: string, delay?: number, decimals?: number
}) {
  const colorMap: Record<string, { bg: string, border: string, text: string, iconBg: string }> = {
    indigo: { bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50', border: 'border-indigo-200/60', text: 'text-indigo-700', iconBg: 'bg-indigo-600' },
    emerald: { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/60', text: 'text-emerald-700', iconBg: 'bg-emerald-600' },
    rose: { bg: 'bg-gradient-to-br from-rose-50 to-rose-100/50', border: 'border-rose-200/60', text: 'text-rose-700', iconBg: 'bg-rose-600' },
    amber: { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', border: 'border-amber-200/60', text: 'text-amber-700', iconBg: 'bg-amber-600' },
    blue: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', border: 'border-blue-200/60', text: 'text-blue-700', iconBg: 'bg-blue-600' },
    violet: { bg: 'bg-gradient-to-br from-violet-50 to-violet-100/50', border: 'border-violet-200/60', text: 'text-violet-700', iconBg: 'bg-violet-600' },
    teal: { bg: 'bg-gradient-to-br from-teal-50 to-teal-100/50', border: 'border-teal-200/60', text: 'text-teal-700', iconBg: 'bg-teal-600' },
    slate: { bg: 'bg-gradient-to-br from-slate-50 to-slate-100/50', border: 'border-slate-200/60', text: 'text-slate-700', iconBg: 'bg-slate-600' },
  }
  const c = colorMap[color] || colorMap.indigo
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={cn(
        "relative group rounded-2xl p-5 border backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5",
        c.bg, c.border
      )}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 -mr-6 -mt-6 blur-2xl" style={{ background: `linear-gradient(135deg, ${color === 'indigo' ? '#6366f1' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#ef4444' : color === 'amber' ? '#f59e0b' : '#6366f1'}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg", c.iconBg)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className={cn("text-2xl font-black tracking-tight mb-1", c.text)}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em]">{label}</div>
    </motion.div>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, icon: Icon }: { title: string, subtitle?: string, icon?: any }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div>
        <h4 className="text-base font-black text-slate-800 tracking-tight">{title}</h4>
        {subtitle && <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Horizontal Progress Bar ─────────────────────────────────────────────────
function HorizontalBar({ label, value, max, color, delay = 0 }: { label: string, value: number, max: number, color: string, delay?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 capitalize">{label.replace(/_/g, ' ')}</span>
        <span className="text-xs font-black text-slate-800">{value}</span>
      </div>
      <div className="h-2.5 bg-slate-200/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ProcurementReportPage() {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const toast = useToastStore()

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(0)
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [reportData, setReportData] = useState<ProcurementReportData | null>(null)
  const [activeTab, setActiveTab] = useState('purchase_orders')
  const [selectedRadarSupplier, setSelectedRadarSupplier] = useState<string>('')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierLimit, setSupplierLimit] = useState<number>(5)
  const [penaltySearch, setPenaltySearch] = useState('')
  const [penaltyStatusFilter, setPenaltyStatusFilter] = useState('all')
  const [penaltyTypeFilter, setPenaltyTypeFilter] = useState('all')
  const [penaltyPaymentFilter, setPenaltyPaymentFilter] = useState('all')
  
  // ETA & Late Order Tracking States
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({})
  const [orderTrackingSearch, setOrderTrackingSearch] = useState('')
  const [isDownloadingETA, setIsDownloadingETA] = useState(false)
  const [isDownloadingLate, setIsDownloadingLate] = useState(false)

  const toggleSupplierExpanded = (supName: string) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [supName]: !prev[supName]
    }))
  }

  const handleDownloadETA = async () => {
    if (!reportData) return
    setIsDownloadingETA(true)
    try {
      const res = await generateETAReportPdf(reportData)
      if (res.success && res.pdfUrl) {
        const link = document.createElement('a')
        link.href = res.pdfUrl
        link.download = `ETA_Report_${dateFrom}_to_${dateTo}.pdf`
        link.click()
        toast.success('Downloaded', 'ETA Report PDF downloaded successfully.')
      } else {
        throw new Error(res.error || 'Failed to generate ETA PDF')
      }
    } catch (err: any) {
      toast.error('Download Error', err.message || 'Failed to download ETA report')
    } finally {
      setIsDownloadingETA(false)
    }
  }

  const handleDownloadLate = async () => {
    if (!reportData) return
    setIsDownloadingLate(true)
    try {
      const res = await generateLateReportPdf(reportData)
      if (res.success && res.pdfUrl) {
        const link = document.createElement('a')
        link.href = res.pdfUrl
        link.download = `Delivery_Delay_Report_${dateFrom}_to_${dateTo}.pdf`
        link.click()
        toast.success('Downloaded', 'Late Delivery Report PDF downloaded successfully.')
      } else {
        throw new Error(res.error || 'Failed to generate Late PDF')
      }
    } catch (err: any) {
      toast.error('Download Error', err.message || 'Failed to download Late delivery report')
    } finally {
      setIsDownloadingLate(false)
    }
  }

  const handleGenerate = async () => {
    if (!hospitalId || !user) return
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Invalid Date', 'Date From cannot be later than Date To')
      return
    }
    setIsGenerating(true)
    try {
      const hospitalName = user.hospital?.name || 'Hospital Daerah Lawas'
      const { data, error } = await generateProcurementReport(hospitalId, hospitalName, user.full_name || user.email || 'Admin', dateFrom, dateTo)
      if (error) throw new Error(error)
      if (data) setReportData(data)
      toast.success('Report Generated', 'Procurement report data has been compiled successfully.')
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (hospitalId) handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId])

  useEffect(() => {
    if (reportData?.supplierPerformance?.list?.length) {
      setSelectedRadarSupplier(reportData.supplierPerformance.list[0].supplierName)
    }
  }, [reportData])

  const handleDownload = async () => {
    if (!reportData) { toast.error('No Data', 'Please generate the report first'); return }
    setIsDownloading(true)
    try {
      const { success, pdfUrl, error } = await generateProcurementReportPdf(reportData)
      if (!success || !pdfUrl) throw new Error(error || 'Failed to create PDF')
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `Procurement_Report_${dateFrom}_${dateTo}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
      toast.success('PDF Downloaded', 'The procurement report PDF has been downloaded.')
    } catch (err: any) {
      toast.error('Download Failed', err.message || 'Could not download the PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  // ── Derived chart data ──────────────────────────────────────────────────
  const poStatusPieData = useMemo(() => {
    if (!reportData) return []
    return Object.entries(reportData.purchaseOrders.statusBreakdown || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [reportData])

  const poCategoryPieData = useMemo(() => {
    if (!reportData) return []
    return Object.entries(reportData.purchaseOrders.categoryBreakdown || {}).map(([name, value]) => ({ name, value }))
  }, [reportData])

  const monthlyTrendData = useMemo(() => {
    if (!reportData) return []
    return reportData.purchaseOrders.monthlyTrend.map(m => ({
      month: m.month.replace(/^\d{4}-/, ''),
      fullMonth: m.month,
      count: m.count,
      value: m.value
    }))
  }, [reportData])

  const lpoStatusPieData = useMemo(() => {
    if (!reportData) return []
    const s = reportData.lpo.stats
    return [
      { name: 'Verified', value: s.verified },
      { name: 'Sent', value: s.sent },
      { name: 'Pending', value: s.pending }
    ].filter(d => d.value > 0)
  }, [reportData])

  const trackingStatusData = useMemo(() => {
    if (!reportData) return []
    const s = reportData.orderTracking.stats
    return [
      { name: 'Pending', value: s.pending, fill: '#f59e0b' },
      { name: 'Partial', value: s.partial, fill: '#8b5cf6' },
      { name: 'Completed', value: s.completed, fill: '#10b981' },
      { name: 'Overdue', value: s.overdue, fill: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [reportData])

  const supplierChartData = useMemo(() => {
    if (!reportData?.orderTracking?.supplierBreakdown) return []
    
    // Sort suppliers by total LPOs descending and limit to top 8 for clean visual display
    return [...reportData.orderTracking.supplierBreakdown]
      .sort((a, b) => b.totalLPOs - a.totalLPOs)
      .slice(0, 8)
      .map(s => ({
        name: s.supplierName.length > 15 ? s.supplierName.slice(0, 15) + '...' : s.supplierName,
        fullName: s.supplierName,
        'Late (Overdue)': s.lateLPOs,
        'Partially Arrived': s.partiallyArrivedLPOs,
        'Pending': s.pendingLPOs,
        'Fully Arrived': s.fullyArrivedLPOs,
        total: s.totalLPOs
      }))
  }, [reportData])

  const filteredSupplierBreakdown = useMemo(() => {
    if (!reportData?.orderTracking?.supplierBreakdown) return []
    const search = orderTrackingSearch.toLowerCase().trim()
    if (!search) return reportData.orderTracking.supplierBreakdown
    
    return reportData.orderTracking.supplierBreakdown.filter(s => 
      s.supplierName.toLowerCase().includes(search) ||
      s.lpoDetails.some(d => d.lpoNumber.toLowerCase().includes(search) || d.poNumber.toLowerCase().includes(search))
    )
  }, [reportData, orderTrackingSearch])

  const receivedMonthlyData = useMemo(() => {
    if (!reportData) return []
    return reportData.receivedItems.monthlyGRs.map(m => ({
      month: m.month.replace(/^\d{4}-/, ''),
      count: m.count
    }))
  }, [reportData])

  const paymentStatusData = useMemo(() => {
    if (!reportData) return []
    return Object.entries(reportData.payment.statusBreakdown || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [reportData])

  const filteredSuppliers = useMemo(() => {
    if (!reportData?.supplierPerformance?.list) return []
    let list = [...reportData.supplierPerformance.list]
    
    // Search filter
    if (supplierSearch.trim()) {
      const q = supplierSearch.toLowerCase()
      list = list.filter(sup => sup.supplierName.toLowerCase().includes(q))
    }
    return list
  }, [reportData, supplierSearch])

  const comparativeChartData = useMemo(() => {
    let list = [...filteredSuppliers]
    if (supplierLimit > 0) {
      list = list.slice(0, supplierLimit)
    }
    return list.map(sup => ({
      name: sup.supplierName,
      fullName: sup.supplierName,
      Quality: (sup.quality / 5) * 100,
      Delivery: (sup.delivery / 5) * 100,
      Support: (sup.support / 5) * 100
    }))
  }, [filteredSuppliers, supplierLimit])

  const rankingChartData = useMemo(() => {
    let list = [...filteredSuppliers].sort((a, b) => b.score - a.score)
    if (supplierLimit > 0) {
      list = list.slice(0, supplierLimit)
    }
    return list.map(sup => ({
      name: sup.supplierName,
      fullName: sup.supplierName,
      Score: sup.score
    }))
  }, [filteredSuppliers, supplierLimit])

  const supplierRadarData = useMemo(() => {
    if (!reportData || !reportData.supplierPerformance.list || reportData.supplierPerformance.list.length === 0) return []
    const list = reportData.supplierPerformance.list
    const selected = list.find(s => s.supplierName === selectedRadarSupplier) || list[0]
    if (!selected) return []
    return [
      { metric: 'Quality', value: (selected.quality / 5) * 100 },
      { metric: 'Delivery', value: (selected.delivery / 5) * 100 },
      { metric: 'Support', value: (selected.support / 5) * 100 },
      { metric: 'Overall', value: selected.score }
    ]
  }, [reportData, selectedRadarSupplier])

  const louStatusPieData = useMemo(() => {
    if (!reportData) return []
    return Object.entries(reportData.lou.statusBreakdown || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [reportData])

  const penaltyStatusPieData = useMemo(() => {
    if (!reportData) return []
    return Object.entries(reportData.penalties.statusBreakdown || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [reportData])

  const creditNoteReasonData = useMemo(() => {
    if (!reportData) return []
    return Object.entries(reportData.creditNotes.reasonBreakdown || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [reportData])

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white text-slate-800 pb-20">
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-500/[0.03] via-slate-100/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/[0.02] to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-500/[0.02] to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full p-6 lg:p-8 space-y-6 relative z-10">
        {/* ── Breadcrumbs ───────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <Link to={ROUTES.PHARMACY_REPORTS} className="hover:text-indigo-400 transition-colors">Reports</Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-indigo-400 font-extrabold">Procurement Intelligence</span>
        </nav>

        {/* ── Header & Controls ─────────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30"
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
                Procurement Report
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Interactive Analytics Dashboard • Real-time Insights
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/50 w-full xl:w-auto">
            <div className="flex items-center gap-2 px-3 border-r border-white/10">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <input
                type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-lg p-1 outline-none focus:ring-1 focus:ring-indigo-500 w-[120px] [color-scheme:light]"
              />
              <span className="text-slate-600 font-black text-[10px]">TO</span>
              <input
                type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-lg p-1 outline-none focus:ring-1 focus:ring-indigo-500 w-[120px] [color-scheme:light]"
              />
            </div>
            <button onClick={handleGenerate} disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-all duration-200 border border-indigo-200/60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            <button onClick={handleDownload} disabled={isDownloading || !reportData}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-bold text-xs transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              {isDownloading ? <Spinner size="sm" className="text-white" /> : <Download className="w-3.5 h-3.5" />}
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {isGenerating && !reportData && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Activity className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Aggregating Procurement Intelligence...</p>
          </div>
        )}

        {/* ── Empty ──────────────────────────────────────────────────────── */}
        {!isGenerating && !reportData && (
          <div className="bg-white backdrop-blur-xl rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm">
            <div className="w-20 h-20 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <BarChart3 className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-slate-300 mb-2">No Report Data</h3>
            <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto">
              Select a date range and click Generate to view the interactive procurement analytics.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* REPORT CONTENT                                               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {!isGenerating && reportData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="space-y-6">

            {/* ── EXECUTIVE SUMMARY KPI CARDS ──────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <KpiCard label="Total POs" value={reportData.executive.totalPOs} icon={FileSpreadsheet} color="indigo" delay={0} />
              <KpiCard label="Total Value" value={reportData.executive.totalValue} prefix="RM " icon={TrendingUp} color="emerald" delay={0.05} />
              <KpiCard label="Completion" value={reportData.executive.completionRate} suffix="%" icon={CheckCircle2} color="emerald" delay={0.1} decimals={1} />
              <KpiCard label="On-Time" value={reportData.executive.onTimeDeliveryRate} suffix="%" icon={Clock} color="blue" delay={0.15} decimals={1} />
              <KpiCard label="Penalties" value={reportData.executive.totalPenalties} icon={ShieldAlert} color="rose" delay={0.2} />
              <KpiCard label="Credit Notes" value={reportData.executive.totalCreditNotes} icon={FileWarning} color="amber" delay={0.25} />
              <KpiCard label="Supplier Score" value={reportData.executive.avgSupplierScore} suffix="%" icon={Star} color="violet" delay={0.3} decimals={1} />
            </div>

            {/* ── EXECUTIVE MINI CHARTS ROW ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Monthly PO Trend Area Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Monthly PO Trend</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Count & Value over time</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer>
                    <AreaChart data={monthlyTrendData}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Orders" stroke="#6366f1" fill="url(#areaGradient)" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* PO Status Donut */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">PO Status Distribution</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Breakdown by status</p>
                  </div>
                  <PieChartIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-center justify-center gap-4">
                  <MiniDonut data={poStatusPieData} size={150} />
                  <div className="space-y-2 flex-1 min-w-0">
                    {poStatusPieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600 capitalize truncate">{d.name}</span>
                        <span className="font-black text-slate-800 ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Monthly Value Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Monthly PO Value</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Value in RM</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer>
                    <BarChart data={monthlyTrendData} barCategoryGap="20%">
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Value (RM)" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* ── TAB NAVIGATION ────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide bg-slate-50/50 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm p-1.5">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 whitespace-nowrap shrink-0 relative",
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-indigo-200" : "text-slate-600")} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* ── TAB CONTENT ──────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="bg-white backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[520px]"
              >

                {/* ════════ PURCHASE ORDERS ════════ */}
                {activeTab === 'purchase_orders' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Purchase Orders Analytics" subtitle="Comprehensive PO analysis with trends and breakdowns" icon={FileSpreadsheet} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Status Breakdown */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-indigo-400" /> Status Breakdown
                        </h5>
                        {poStatusPieData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-8">No data available</p>
                        ) : (
                          <div className="space-y-3">
                            {poStatusPieData.map((d, i) => (
                              <HorizontalBar key={d.name} label={d.name} value={d.value} max={Math.max(...poStatusPieData.map(x => x.value))} color={PIE_COLORS[i % PIE_COLORS.length]} delay={i * 0.1} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Category Breakdown */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" /> Category Distribution
                        </h5>
                        {poCategoryPieData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-8">No data available</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* Donut Chart with Centered Total */}
                            <div className="md:col-span-5 flex items-center justify-center relative">
                              <div className="h-[200px] w-[200px]">
                                <ResponsiveContainer>
                                  <PieChart>
                                    <Pie data={poCategoryPieData} cx="50%" cy="50%" outerRadius={75} innerRadius={50} paddingAngle={4} dataKey="value" stroke="none" animationDuration={1200}>
                                      {poCategoryPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-white">{poCategoryPieData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Total POs</span>
                              </div>
                            </div>

                            {/* Premium Side Legend with Progress Indicators */}
                            <div className="md:col-span-7 space-y-5 pr-1">
                              {poCategoryPieData.map((item, idx) => {
                                const total = poCategoryPieData.reduce((acc, curr) => acc + curr.value, 0)
                                const percentage = total > 0 ? (item.value / total) * 100 : 0
                                const color = PIE_COLORS[idx % PIE_COLORS.length]
                                return (
                                  <div key={item.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        <span className="text-slate-700 truncate max-w-[150px]">{item.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 font-black text-slate-800">
                                        <span>{item.value}</span>
                                        <span className="text-[10px] text-slate-500 font-semibold">({percentage.toFixed(1)}%)</span>
                                      </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.05 }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Combined Monthly Trend Chart */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                      <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" /> Monthly Trend (Count & Value)
                      </h5>
                      <div className="h-[280px]">
                        <ResponsiveContainer>
                          <ComposedChart data={monthlyTrendData}>
                            <defs>
                              <linearGradient id="composedArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="fullMonth" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                            <Bar yAxisId="left" dataKey="count" name="Order Count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
                            <Line yAxisId="right" type="monotone" dataKey="value" name="Value (RM)" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ LPO ════════ */}
                {activeTab === 'lpo' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Local Purchase Order Analytics" subtitle="LPO verification, document tracking & coverage" icon={FileText} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <KpiCard label="Total LPOs" value={reportData.lpo.stats.total} icon={FileText} color="indigo" delay={0} />
                      <KpiCard label="Verified" value={reportData.lpo.stats.verified} icon={CheckCircle2} color="emerald" delay={0.05} />
                      <KpiCard label="Sent" value={reportData.lpo.stats.sent} icon={ArrowUpRight} color="blue" delay={0.1} />
                      <KpiCard label="Pending" value={reportData.lpo.stats.pending} icon={Clock} color="amber" delay={0.15} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* LPO Status Donut */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center">
                        <h5 className="text-sm font-black text-slate-800 mb-4 self-start flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-violet-400" /> Status Distribution
                        </h5>
                        <MiniDonut data={lpoStatusPieData} colors={['#10b981', '#3b82f6', '#f59e0b']} size={180} />
                        <div className="flex gap-4 mt-4">
                          {lpoStatusPieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'][i] }} />
                              <span className="text-slate-600">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coverage Rate Ring */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center justify-center">
                        <h5 className="text-sm font-black text-slate-800 mb-4 self-start flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" /> LPO Coverage Rate
                        </h5>
                        <ProgressRing percentage={reportData.lpo.coverageRate} size={140} strokeWidth={10} color="#8b5cf6" />
                        <p className="text-xs text-slate-500 mt-3 text-center">Percentage of POs covered by LPOs</p>
                      </div>

                      {/* Document Status */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-400" /> Document Status
                        </h5>
                        <div className="h-[180px]">
                          <ResponsiveContainer>
                            <BarChart data={[
                              { name: 'With Doc', value: reportData.lpo.documentStatus.withDoc },
                              { name: 'Without Doc', value: reportData.lpo.documentStatus.withoutDoc }
                            ]} barCategoryGap="30%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" name="LPOs" radius={[6, 6, 0, 0]}>
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ ORDER TRACKING ════════ */}
                {activeTab === 'order_tracking' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Order Tracking Dashboard" subtitle="Delivery monitoring, overdue analysis & reminders" icon={Truck} />
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <KpiCard label="Total Tracked" value={reportData.orderTracking.stats.total} icon={Truck} color="indigo" delay={0} />
                      <KpiCard label="Pending" value={reportData.orderTracking.stats.pending} icon={Clock} color="amber" delay={0.05} />
                      <KpiCard label="Partial" value={reportData.orderTracking.stats.partial} icon={Activity} color="violet" delay={0.1} />
                      <KpiCard label="Completed" value={reportData.orderTracking.stats.completed} icon={CheckCircle2} color="emerald" delay={0.15} />
                      <KpiCard label="Overdue" value={reportData.orderTracking.stats.overdue} icon={AlertTriangle} color="rose" delay={0.2} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Tracking Status Donut */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-blue-400" /> Tracking Status Distribution
                        </h5>
                        {trackingStatusData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">No tracking data available</p>
                        ) : (
                          <div className="flex items-center justify-center gap-6">
                            <div className="h-[220px] w-[220px]">
                              <ResponsiveContainer>
                                <PieChart>
                                  <Pie data={trackingStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none" animationDuration={1200}>
                                    {trackingStatusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                              {trackingStatusData.map(d => (
                                <div key={d.name} className="flex items-center gap-2.5 text-xs">
                                  <span className="w-3 h-3 rounded-md" style={{ backgroundColor: d.fill }} />
                                  <span className="text-slate-600 w-20">{d.name}</span>
                                  <span className="font-black text-white text-sm">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Overdue Analysis */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                        <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400" /> Overdue Analysis
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-rose-500/10 rounded-xl p-5 border border-rose-500/20">
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-2">Avg Days Overdue</span>
                            <div className="text-3xl font-black text-rose-400">
                              <AnimatedNumber value={reportData.orderTracking.overdueAnalysis.avgDays} decimals={1} />
                            </div>
                            <span className="text-xs text-rose-400/60 font-bold">days</span>
                          </div>
                          <div className="bg-orange-500/10 rounded-xl p-5 border border-orange-500/20">
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Max Days Overdue</span>
                            <div className="text-3xl font-black text-orange-400">
                              <AnimatedNumber value={reportData.orderTracking.overdueAnalysis.maxDays} />
                            </div>
                            <span className="text-xs text-orange-400/60 font-bold">days</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/20">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Total Reminders</span>
                            <div className="text-3xl font-black text-indigo-400">
                              <AnimatedNumber value={reportData.orderTracking.reminderStats.total} />
                            </div>
                          </div>
                          <div className="bg-violet-500/10 rounded-xl p-5 border border-violet-500/20">
                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-2">Avg Per LPO</span>
                            <div className="text-3xl font-black text-violet-400">
                              <AnimatedNumber value={reportData.orderTracking.reminderStats.avgPerLPO} decimals={1} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ★ PANEL A: ETA & LATE DOCUMENT ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Approaching ETA Card */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menghampiri Tarikh ETA (7 Hari)</h6>
                            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Clock className="w-4 h-4" /></span>
                          </div>
                          <p className="text-3xl font-black text-slate-800 mt-2">
                            {reportData.orderTracking.etaSummary.approachingETA}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Pesanan belian yang dijangka tiba dalam tempoh terdekat.</p>
                        </div>
                        <button
                          onClick={handleDownloadETA}
                          disabled={isDownloadingETA || reportData.orderTracking.etaSummary.approachingETA === 0}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-250 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isDownloadingETA ? (
                            <Spinner className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          Muat Turun Laporan ETA
                        </button>
                      </div>

                      {/* Overdue/Late LPO Card */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Melebihi Tarikh ETA (Lewat / Late)</h6>
                            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><AlertTriangle className="w-4 h-4" /></span>
                          </div>
                          <p className="text-3xl font-black text-rose-600 mt-2">
                            {reportData.orderTracking.etaSummary.pastETA}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Pesanan belian aktif yang telah melepasi tarikh jangkaan serahan.</p>
                        </div>
                        <button
                          onClick={handleDownloadLate}
                          disabled={isDownloadingLate || reportData.orderTracking.etaSummary.pastETA === 0}
                          className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-250 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isDownloadingLate ? (
                            <Spinner className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          Muat Turun Laporan Kelewatan (PDF)
                        </button>
                      </div>

                      {/* No ETA Set Card */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiada Tarikh Jangkaan (No ETA)</h6>
                            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><FileWarning className="w-4 h-4" /></span>
                          </div>
                          <p className="text-3xl font-black text-slate-800 mt-2">
                            {reportData.orderTracking.etaSummary.noETA}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">LPO yang diluluskan tetapi belum dikemas kini tarikh jangkaan tiba.</p>
                        </div>
                        <div className="py-2.5 text-center bg-slate-100 rounded-xl text-slate-500 text-xs font-black">
                          Sila Kemas Kini Tarikh Jangkaan di Menu Tracking
                        </div>
                      </div>
                    </div>

                    {/* ★ PANEL B: SUPPLIER LPO DELIVERY BREAKDOWN CHART */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                      <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" /> Analisis Prestasi Penghantaran LPO Mengikut Pembekal (Top 8)
                      </h5>
                      {supplierChartData.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-12">Tiada data pembekal direkodkan</p>
                      ) : (
                        <div className="h-[280px] w-full">
                          <ResponsiveContainer>
                            <BarChart data={supplierChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                              <YAxis tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Bar dataKey="Fully Arrived" stackId="a" fill="#10b981" />
                              <Bar dataKey="Partially Arrived" stackId="a" fill="#8b5cf6" />
                              <Bar dataKey="Pending" stackId="a" fill="#3b82f6" />
                              <Bar dataKey="Late (Overdue)" stackId="a" fill="#ef4444" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* ★ PANEL C: SUPPLIER BREAKDOWN TABLE WITH EXPANDABLE DRILL-DOWN */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" /> Pecahan Prestasi Setiap Pembekal
                        </h5>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari pembekal atau LPO..."
                            className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-700 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-slate-400"
                            value={orderTrackingSearch}
                            onChange={(e) => setOrderTrackingSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4">Pembekal (Supplier)</th>
                              <th className="py-3 px-2 text-center font-bold">Total LPO</th>
                              <th className="py-3 px-2 text-center text-rose-600 bg-rose-500/5 font-bold">Lewat (Late)</th>
                              <th className="py-3 px-2 text-center text-emerald-600 bg-emerald-500/5 font-bold">Selesai (Full)</th>
                              <th className="py-3 px-2 text-center text-violet-600 font-bold">Separa (Part)</th>
                              <th className="py-3 px-2 text-center text-amber-600 font-bold">Proses (Pend)</th>
                              <th className="py-3 px-2 text-center font-bold">Tepat Masa</th>
                              <th className="py-3 px-4 text-center font-bold">Perincian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-xs bg-white">
                            {filteredSupplierBreakdown.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                                  Tiada rekod pembekal ditemui matching carian anda
                                </td>
                              </tr>
                            ) : (
                              filteredSupplierBreakdown.map((s) => {
                                const isExpanded = !!expandedSuppliers[s.supplierName]
                                return (
                                  <React.Fragment key={s.supplierName}>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-3 px-4 font-bold text-slate-800">{s.supplierName}</td>
                                      <td className="py-3 px-2 text-center font-bold">{s.totalLPOs}</td>
                                      <td className="py-3 px-2 text-center font-black text-rose-600 bg-rose-500/5">{s.lateLPOs}</td>
                                      <td className="py-3 px-2 text-center font-bold text-emerald-600 bg-emerald-500/5">{s.fullyArrivedLPOs}</td>
                                      <td className="py-3 px-2 text-center font-bold text-violet-600">{s.partiallyArrivedLPOs}</td>
                                      <td className="py-3 px-2 text-center font-bold text-amber-500">{s.pendingLPOs}</td>
                                      <td className="py-3 px-2 text-center">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-full font-black text-[10px]",
                                          s.onTimeRate >= 80 ? "bg-emerald-100 text-emerald-800" :
                                          s.onTimeRate >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                        )}>
                                          {s.onTimeRate.toFixed(1)}%
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          onClick={() => toggleSupplierExpanded(s.supplierName)}
                                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-all flex items-center justify-center mx-auto"
                                        >
                                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                      </td>
                                    </tr>

                                    {/* EXPANDED DRILL-DOWN PANEL */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={8} className="bg-slate-50/80 p-4 border-l-4 border-indigo-500">
                                          <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Senarai Terperinci LPO — {s.supplierName}</span>
                                              <span className="text-xs text-slate-600">Purata Kelewatan: <strong className="text-rose-600">{s.avgDaysOverdue.toFixed(1)} hari</strong></span>
                                            </div>
                                            
                                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                              <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                  <tr className="bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                                    <th className="py-2 px-3">LPO Number</th>
                                                    <th className="py-2 px-3">PO Number</th>
                                                    <th className="py-2 px-3">Tarikh Jangkaan (ETA)</th>
                                                    <th className="py-2 px-3 text-center">Status</th>
                                                    <th className="py-2 px-3 text-center">Progress Item</th>
                                                    <th className="py-2 px-3 text-center">Surat Peringatan</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                  {s.lpoDetails.map((detail) => (
                                                    <tr key={detail.lpoNumber} className="hover:bg-slate-50/50">
                                                      <td className="py-2 px-3 font-semibold text-slate-800">{detail.lpoNumber}</td>
                                                      <td className="py-2 px-3 text-slate-600">{detail.poNumber}</td>
                                                      <td className="py-2 px-3 text-slate-600">{detail.expectedDeliveryDate || '—'}</td>
                                                      <td className="py-2 px-3 text-center">
                                                        <span className={cn(
                                                          "px-2 py-0.5 rounded-full font-black text-[9px]",
                                                          detail.status === 'fully_delivered' ? "bg-emerald-100 text-emerald-800" :
                                                          detail.status === 'partially_delivered' ? "bg-violet-100 text-violet-800" :
                                                          detail.status === 'overdue' ? "bg-rose-100 text-rose-800" :
                                                          detail.status === 'cancelled' ? "bg-slate-100 text-slate-800" : "bg-blue-100 text-blue-800"
                                                        )}>
                                                          {detail.status === 'fully_delivered' ? 'Fully Delivered' :
                                                           detail.status === 'partially_delivered' ? 'Partially Delivered' :
                                                           detail.status === 'overdue' ? 'Overdue (Late)' :
                                                           detail.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                                        </span>
                                                      </td>
                                                      <td className="py-2 px-3 text-center font-bold text-slate-700">
                                                        {detail.deliveredItems} / {detail.totalItems}
                                                      </td>
                                                      <td className="py-2 px-3 text-center">
                                                        {detail.reminderCount > 0 ? (
                                                          <span className="font-bold text-rose-650 bg-rose-50 px-1.5 py-0.5 rounded">
                                                            {detail.reminderCount} kali dihantar
                                                          </span>
                                                        ) : (
                                                          <span className="text-slate-400">Tiada</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ RECEIVED ITEMS ════════ */}
                {activeTab === 'received_items' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Received Items Analysis" subtitle="Goods receipt tracking with acceptance metrics" icon={PackageCheck} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <KpiCard label="Total GRs" value={reportData.receivedItems.stats.totalGRs} icon={PackageCheck} color="indigo" delay={0} />
                      <KpiCard label="Total Items" value={reportData.receivedItems.stats.totalItems} icon={BarChart3} color="blue" delay={0.05} />
                      <KpiCard label="Accepted" value={reportData.receivedItems.stats.acceptedItems} icon={CheckCircle2} color="emerald" delay={0.1} />
                      <KpiCard label="Rejected" value={reportData.receivedItems.stats.rejectedItems} icon={XCircle} color="rose" delay={0.15} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Accept/Reject donut */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" /> Acceptance Rate
                        </h5>
                        <div className="flex items-center justify-center gap-6">
                          <ProgressRing
                            percentage={reportData.receivedItems.stats.totalItems > 0
                              ? (reportData.receivedItems.stats.acceptedItems / reportData.receivedItems.stats.totalItems) * 100
                              : 0}
                            size={160} strokeWidth={12} color="#10b981"
                          />
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Accepted</span>
                              <span className="text-xl font-black text-emerald-400">{reportData.receivedItems.stats.acceptedItems.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rejected</span>
                              <span className="text-xl font-black text-rose-400">{reportData.receivedItems.stats.rejectedItems.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Monthly GR trend */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-400" /> Monthly Goods Receipts
                        </h5>
                        <div className="h-[220px]">
                          {receivedMonthlyData.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-16">No monthly data available</p>
                          ) : (
                            <ResponsiveContainer>
                              <BarChart data={receivedMonthlyData} barCategoryGap="25%">
                                <defs>
                                  <linearGradient id="grBarGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="GRs" fill="url(#grBarGrad)" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ PAYMENT ════════ */}
                {activeTab === 'payment' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Payment Intelligence" subtitle="Financial transaction monitoring & vote code analysis" icon={CreditCard} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <KpiCard label="Transactions" value={reportData.payment.stats.totalTransactions} icon={CreditCard} color="indigo" delay={0} />
                      <KpiCard label="Paid" value={reportData.payment.stats.paidValue} prefix="RM " icon={CheckCircle2} color="emerald" delay={0.05} />
                      <KpiCard label="Outstanding" value={reportData.payment.stats.outstandingValue} prefix="RM " icon={Clock} color="amber" delay={0.1} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Payment Status */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-teal-400" /> Payment Status
                        </h5>
                        {paymentStatusData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">No data</p>
                        ) : (
                          <div className="flex items-center justify-center gap-6">
                            <MiniDonut data={paymentStatusData} size={170} colors={['#10b981', '#f59e0b', '#6366f1', '#ef4444']} />
                            <div className="space-y-3 flex-1 min-w-0">
                              {paymentStatusData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-2 text-xs">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'][i % 4] }} />
                                  <span className="text-slate-600 capitalize truncate">{d.name}</span>
                                  <span className="font-black text-slate-800 ml-auto">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vote Code Breakdown */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-indigo-400" /> Vote Code Breakdown
                        </h5>
                        {Object.entries(reportData.payment.voteCodeBreakdown || {}).length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">No data</p>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(reportData.payment.voteCodeBreakdown).map(([vote, count], i) => (
                              <HorizontalBar key={vote} label={vote} value={count as number} max={Math.max(...Object.values(reportData.payment.voteCodeBreakdown) as number[])} color={CHART_COLORS[i % CHART_COLORS.length]} delay={i * 0.1} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Paid vs Outstanding visual */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                      <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Paid vs Outstanding
                      </h5>
                      <div className="h-[200px]">
                        <ResponsiveContainer>
                          <BarChart data={[
                            { name: 'Paid', value: reportData.payment.stats.paidValue },
                            { name: 'Outstanding', value: reportData.payment.stats.outstandingValue }
                          ]} layout="vertical" barCategoryGap="40%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM${(v/1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Amount (RM)" radius={[0, 8, 8, 0]} barSize={30}>
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ CREDIT NOTES ════════ */}
                {activeTab === 'credit_notes' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Credit Notes Analysis" subtitle="Credit note tracking and reason classification" icon={FileWarning} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <KpiCard label="Total CNs" value={reportData.creditNotes.stats.total} icon={FileWarning} color="amber" delay={0} />
                      <KpiCard label="Total Value" value={reportData.creditNotes.stats.value} prefix="RM " icon={TrendingDown} color="rose" delay={0.05} />
                      <KpiCard label="Pending" value={reportData.creditNotes.stats.pending} icon={Clock} color="violet" delay={0.1} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Reason donut */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-amber-400" /> Reason Distribution
                        </h5>
                        {creditNoteReasonData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">No data</p>
                        ) : (
                          <div className="flex items-center justify-center gap-6">
                            <MiniDonut data={creditNoteReasonData} size={180} />
                            <div className="space-y-2 flex-1 min-w-0">
                              {creditNoteReasonData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-2 text-xs">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span className="text-slate-655 capitalize truncate">{d.name}</span>
                                  <span className="font-black text-slate-800 ml-auto">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reason horizontal bars */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-rose-400" /> Reason Breakdown
                        </h5>
                        {creditNoteReasonData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">No data</p>
                        ) : (
                          <div className="space-y-4">
                            {creditNoteReasonData.map((d, i) => (
                              <HorizontalBar key={d.name} label={d.name} value={d.value} max={Math.max(...creditNoteReasonData.map(x => x.value))} color={PIE_COLORS[i % PIE_COLORS.length]} delay={i * 0.1} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ PENALTIES ════════ */}
                {activeTab === 'penalties' && (() => {
                  const rawList = reportData.penalties.list || []
                  
                  // Local metrics calculations
                  const totalCount = rawList.length
                  const totalValue = rawList.reduce((s, p) => s + Number(p.penalty_amount || 0), 0)
                  const approvedValue = rawList.filter(p => p.status === 'approved').reduce((s, p) => s + Number(p.penalty_amount || 0), 0)
                  const pendingValue = rawList.filter(p => p.status === 'enforced' || p.status === 'pending').reduce((s, p) => s + Number(p.penalty_amount || 0), 0)
                  const waivedValue = rawList.filter(p => p.status === 'waived').reduce((s, p) => s + Number(p.penalty_amount || 0), 0)
                  
                  // Paid vs Unpaid metrics
                  const paidCount = rawList.filter(p => p.penalty_paid).length
                  const paidValue = rawList.filter(p => p.penalty_paid).reduce((s, p) => s + Number(p.penalty_amount || 0), 0)
                  const unpaidCount = rawList.filter(p => !p.penalty_paid).length
                  const unpaidValue = rawList.filter(p => !p.penalty_paid).reduce((s, p) => s + Number(p.penalty_amount || 0), 0)

                  // Payment method count metrics (Kaedah 1 = Potongan Baucer, Kaedah 2 = Bayaran Cek)
                  const methodVoucherCount = rawList.filter(p => p.payment_kaedah === 1 || p.payment_kaedah === '1').length
                  const methodChequeCount = rawList.filter(p => p.payment_kaedah === 2 || p.payment_kaedah === '2').length

                  const delayRecords = rawList.filter(p => (p.days_delayed || 0) > 0)
                  const avgDelay = delayRecords.length > 0 
                    ? delayRecords.reduce((s, p) => s + (p.days_delayed || 0), 0) / delayRecords.length 
                    : 0

                  // Calculate Top Penalized Suppliers
                  const supplierFines: Record<string, { name: string, value: number, count: number }> = {}
                  rawList.forEach(p => {
                    const sName = p.supplier?.company_name || p.purchase_order?.manual_supplier_name || 'Direct Procurement'
                    if (!supplierFines[sName]) {
                      supplierFines[sName] = { name: sName, value: 0, count: 0 }
                    }
                    supplierFines[sName].value += Number(p.penalty_amount || 0)
                    supplierFines[sName].count += 1
                  })
                  
                  const topSuppliersData = Object.values(supplierFines)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)

                  // Calculate Monthly Penalty Trend
                  const monthlyFines: Record<string, { month: string, value: number, count: number }> = {}
                  rawList.forEach(p => {
                    const dateStr = p.created_at || p.issue_date || new Date().toISOString()
                    const m = dateStr.substring(0, 7) // YYYY-MM
                    if (!monthlyFines[m]) {
                      monthlyFines[m] = { month: m, value: 0, count: 0 }
                    }
                    monthlyFines[m].value += Number(p.penalty_amount || 0)
                    monthlyFines[m].count += 1
                  })
                  
                  const monthlyTrendChartData = Object.values(monthlyFines)
                    .sort((a, m) => a.month.localeCompare(m.month))

                  // Interactive Filtering for the Ledger
                  const filteredPenalties = rawList.filter(p => {
                    // Search Filter
                    const sQuery = penaltySearch.toLowerCase().trim()
                    const supplierName = (p.supplier?.company_name || p.purchase_order?.manual_supplier_name || '').toLowerCase()
                    const poNumber = (p.purchase_order?.po_number || '').toLowerCase()
                    const itemName = (p.item_name || '').toLowerCase()
                    const matchesSearch = !sQuery || 
                      supplierName.includes(sQuery) || 
                      poNumber.includes(sQuery) || 
                      itemName.includes(sQuery)

                    // Status Filter
                    const matchesStatus = penaltyStatusFilter === 'all' || p.status === penaltyStatusFilter

                    // Type Filter
                    const matchesType = penaltyTypeFilter === 'all' || p.penalty_type === penaltyTypeFilter

                    // Payment Filter
                    const matchesPayment = penaltyPaymentFilter === 'all' || 
                      (penaltyPaymentFilter === 'paid' && p.penalty_paid) || 
                      (penaltyPaymentFilter === 'unpaid' && !p.penalty_paid)

                    return matchesSearch && matchesStatus && matchesType && matchesPayment
                  })

                  // dynamic advisory advice
                  const topOffender = topSuppliersData[0]
                  const hasSignificantPenalties = topOffender && topOffender.value > 1000

                  return (
                    <div className="p-6 sm:p-8 space-y-8">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <SectionHeader title="Penalty Intelligence Hub" subtitle="Advanced dual-type penalty auditing, trends & supplier compliance advisor" icon={ShieldAlert} />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditing Period:</span>
                          <span className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-rose-700 text-xs font-black">
                            {new Date(dateFrom).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' })} - {new Date(dateTo).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* 1. Extended Executive KPIs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        <KpiCard label="Breach Cases" value={totalCount} icon={ShieldAlert} color="rose" delay={0} />
                        <KpiCard label="Accrued Fines" value={totalValue} prefix="RM " icon={TrendingUp} color="rose" delay={0.05} />
                        <KpiCard label="Paid Fines" value={paidValue} prefix="RM " icon={CheckCircle2} color="emerald" delay={0.08} />
                        <KpiCard label="Outstanding Fines" value={unpaidValue} prefix="RM " icon={AlertTriangle} color="amber" delay={0.1} />
                        <KpiCard label="Approved Amount" value={approvedValue} prefix="RM " icon={Shield} color="indigo" delay={0.12} />
                        <KpiCard label="Pending Approval" value={pendingValue} prefix="RM " icon={Clock} color="amber" delay={0.15} />
                        <KpiCard label="Waived Amount" value={waivedValue} prefix="RM " icon={XCircle} color="slate" delay={0.2} />
                        <KpiCard label="Avg Days Delayed" value={avgDelay} suffix=" Days" icon={Clock} color="blue" delay={0.25} decimals={1} />
                      </div>

                      {/* 2. Interactive Compliance Advisor */}
                      {topOffender ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-3xl border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-md",
                            hasSignificantPenalties 
                              ? "bg-rose-50/40 border-rose-200/60 shadow-sm"
                              : "bg-slate-50/40 border-slate-200/60 shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-2xl shrink-0",
                              hasSignificantPenalties ? "bg-rose-100/80 text-rose-600" : "bg-slate-100/80 text-slate-600"
                            )}>
                              <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-800">
                                Supplier Compliance Alert — <span className={hasSignificantPenalties ? "text-rose-600" : "text-slate-700"}>{topOffender.name}</span>
                              </h4>
                              <p className="text-[11px] font-semibold text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                {hasSignificantPenalties 
                                  ? `Critical: ${topOffender.name} has accumulated ${topOffender.count} breaches totaling ${formatCurrency(topOffender.value)}. Contractual performance review is highly advised to mitigate ongoing operational delay risks.`
                                  : `${topOffender.name} is the leading penalized entity with ${topOffender.count} incidents totaling ${formatCurrency(topOffender.value)}. Compliance is currently within tolerable threshold limits.`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex gap-2">
                            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-850 transition-colors shadow-sm">
                              Initiate Audit Review
                            </button>
                          </div>
                        </motion.div>
                      ) : null}

                      {/* 3. Advanced Visualization Section — 2×2 Balanced Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── Card 1: Fine Value by Penalty Type ── */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/[0.03] to-transparent rounded-full pointer-events-none" />
                          <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2.5">
                            <span className="p-1.5 bg-rose-50 rounded-lg border border-rose-100"><BarChart3 className="w-3.5 h-3.5 text-rose-500" /></span>
                            Fine Value By Penalty Type
                          </h5>
                          <div className="h-[240px]">
                            <ResponsiveContainer>
                              <BarChart data={[
                                { name: 'APPL (990102)', value: reportData.penalties.stats.applValue },
                                { name: 'CC (080702)', value: reportData.penalties.stats.ccValue }
                              ]} barCategoryGap="30%">
                                <defs>
                                  <linearGradient id="applBarGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.7} />
                                  </linearGradient>
                                  <linearGradient id="ccBarGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.7} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM ${v.toLocaleString()}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Fine Amount (RM)" radius={[10, 10, 0, 0]} barSize={60}>
                                  <Cell fill="url(#applBarGrad)" />
                                  <Cell fill="url(#ccBarGrad)" />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <span className="w-3 h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-600" />
                              <span className="text-slate-500">APPL — RM {(reportData.penalties.stats.applValue || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <span className="w-3 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                              <span className="text-slate-500">CC — RM {(reportData.penalties.stats.ccValue || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {/* ── Card 2: Top Penalized Suppliers ── */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/[0.03] to-transparent rounded-full pointer-events-none" />
                          <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2.5">
                            <span className="p-1.5 bg-amber-50 rounded-lg border border-amber-100"><TrendingDown className="w-3.5 h-3.5 text-amber-500" /></span>
                            Top Penalized Suppliers
                          </h5>
                          {topSuppliersData.length === 0 ? (
                            <div className="h-[240px] flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-wider">No breaches recorded</div>
                          ) : (
                            <div className="h-[240px]">
                              <ResponsiveContainer>
                                <BarChart data={topSuppliersData} layout="vertical" barCategoryGap="20%">
                                  <defs>
                                    <linearGradient id="supplierBarGrad" x1="0" y1="0" x2="1" y2="0">
                                      <stop offset="0%" stopColor="#be123c" stopOpacity={0.85} />
                                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM ${v.toLocaleString()}`} />
                                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Bar dataKey="value" name="Total Fined (RM)" fill="url(#supplierBarGrad)" radius={[0, 8, 8, 0]} barSize={20} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                          {topSuppliersData.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400">
                                Highest offender: <span className="text-slate-700 font-extrabold">{topSuppliersData[0]?.name}</span> — {topSuppliersData[0]?.count} breaches totaling <span className="text-rose-600 font-extrabold">RM {(topSuppliersData[0]?.value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* ── Card 3: Payment Collection Status ── */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/[0.03] to-transparent rounded-full pointer-events-none" />
                          <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2.5">
                            <span className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100"><PieChartIcon className="w-3.5 h-3.5 text-emerald-500" /></span>
                            Payment Collection Status
                          </h5>
                          <div className="flex items-center justify-center gap-8 h-[200px]">
                            <MiniDonut 
                              data={[
                                { name: 'Paid / Lunas', value: paidCount },
                                { name: 'Unpaid / Belum Lunas', value: unpaidCount }
                              ]} 
                              size={140} 
                              colors={['#10b981', '#ef4444']} 
                            />
                            <div className="space-y-4 flex-1 min-w-0">
                              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/60">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                                    <span className="text-xs font-bold text-slate-700">Telah Dibayar (Paid)</span>
                                  </div>
                                  <span className="text-sm font-black text-emerald-700">{paidCount}</span>
                                </div>
                                <p className="text-[10px] font-semibold text-emerald-600/70 mt-1 pl-5.5">RM {paidValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100/60">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
                                    <span className="text-xs font-bold text-slate-700">Belum Lunas (Unpaid)</span>
                                  </div>
                                  <span className="text-sm font-black text-rose-700">{unpaidCount}</span>
                                </div>
                                <p className="text-[10px] font-semibold text-rose-600/70 mt-1 pl-5.5">RM {unpaidValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>Collection Rate</span>
                              <span className="text-slate-700 font-extrabold">{totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : '0.0'}%</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* ── Card 4: Kaedah Tuntutan Denda ── */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/[0.03] to-transparent rounded-full pointer-events-none" />
                          <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2.5">
                            <span className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100"><CreditCard className="w-3.5 h-3.5 text-indigo-500" /></span>
                            Kaedah Tuntutan Denda
                          </h5>
                          <div className="flex items-center justify-center gap-8 h-[200px]">
                            <MiniDonut 
                              data={[
                                { name: 'Potongan Baucer', value: methodVoucherCount },
                                { name: 'Bayaran Cek', value: methodChequeCount }
                              ]} 
                              size={140} 
                              colors={['#6366f1', '#a78bfa']} 
                            />
                            <div className="space-y-4 flex-1 min-w-0">
                              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/60">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/30" />
                                    <span className="text-xs font-bold text-slate-700">Kaedah 1 — Potongan Baucer</span>
                                  </div>
                                  <span className="text-sm font-black text-indigo-700">{methodVoucherCount} Kes</span>
                                </div>
                                <p className="text-[10px] font-semibold text-indigo-500/70 mt-1 pl-5.5">Potongan daripada baucer bayaran pembekal</p>
                              </div>
                              <div className="p-3.5 bg-violet-50/60 rounded-xl border border-violet-100/60">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-violet-400 shadow-sm shadow-violet-400/30" />
                                    <span className="text-xs font-bold text-slate-700">Kaedah 2 — Bayaran Cek</span>
                                  </div>
                                  <span className="text-sm font-black text-violet-700">{methodChequeCount} Kes</span>
                                </div>
                                <p className="text-[10px] font-semibold text-violet-500/70 mt-1 pl-5.5">Bayaran cek daripada syarikat pembekal</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>Total Tuntutan Direkodkan</span>
                              <span className="text-slate-700 font-extrabold">{methodVoucherCount + methodChequeCount} Kes</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })()}

                {/* ════════ LOU ════════ */}
                {activeTab === 'lou' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Letter of Undertaking" subtitle="LOU issuance, status monitoring & value analysis" icon={FileSignature} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <KpiCard label="Total LOUs" value={reportData.lou.stats.total} icon={FileSignature} color="violet" delay={0} />
                      <KpiCard label="Active" value={reportData.lou.stats.active} icon={CheckCircle2} color="emerald" delay={0.05} />
                      <KpiCard label="Expired" value={reportData.lou.stats.expired} icon={XCircle} color="rose" delay={0.1} />
                      <KpiCard label="Total Value" value={reportData.lou.stats.value} prefix="RM " icon={TrendingUp} color="indigo" delay={0.15} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* LOU Status Donut */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-purple-400" /> Status Distribution
                        </h5>
                        {louStatusPieData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">No data</p>
                        ) : (
                          <div className="flex items-center justify-center gap-6">
                            <MiniDonut data={louStatusPieData} size={180} colors={['#10b981', '#8b5cf6', '#ef4444', '#f59e0b']} />
                            <div className="space-y-3 flex-1 min-w-0">
                              {louStatusPieData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-2 text-xs">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ['#10b981', '#8b5cf6', '#ef4444', '#f59e0b'][i % 4] }} />
                                  <span className="text-slate-600 capitalize truncate">{d.name}</span>
                                  <span className="font-black text-slate-800 ml-auto">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Active vs Expired */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-indigo-400" /> Active vs Expired
                        </h5>
                        <div className="h-[220px]">
                          <ResponsiveContainer>
                            <BarChart data={[
                              { name: 'Active', value: reportData.lou.stats.active },
                              { name: 'Expired', value: reportData.lou.stats.expired }
                            ]} barCategoryGap="35%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" name="LOUs" radius={[8, 8, 0, 0]} barSize={50}>
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ SUPPLIER PERFORMANCE ════════ */}
                {activeTab === 'supplier_performance' && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <SectionHeader title="Supplier Performance Intelligence" subtitle="Multi-dimensional evaluation with radar analysis" icon={Star} />
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <KpiCard label="Evaluations" value={reportData.supplierPerformance.stats.totalEvaluations} icon={Star} color="violet" delay={0} />
                      <KpiCard label="Avg Score" value={reportData.supplierPerformance.stats.avgScore} suffix="%" icon={TrendingUp} color="indigo" delay={0.05} decimals={1} />
                      <KpiCard label="Quality" value={reportData.supplierPerformance.stats.avgQuality} suffix="/5" icon={Shield} color="emerald" delay={0.1} decimals={1} />
                      <KpiCard label="Delivery" value={reportData.supplierPerformance.stats.avgDelivery} suffix="/5" icon={Truck} color="blue" delay={0.15} decimals={1} />
                      <KpiCard label="Support" value={reportData.supplierPerformance.stats.avgSupport} suffix="/5" icon={Zap} color="amber" delay={0.2} decimals={1} />
                    </div>

                    {/* Sleek Search & Limit Scale Filters Toolbar */}
                    <div className="bg-slate-50/60 rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="relative w-full sm:w-80">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <Eye className="w-4 h-4 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          placeholder="Search evaluated suppliers..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 shadow-sm"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Display Limit:</span>
                        <div className="flex bg-slate-200/50 rounded-xl p-0.5 border border-slate-200/40 shadow-inner">
                          {['5', '10', '25', 'All'].map((val) => {
                            const num = val === 'All' ? 0 : parseInt(val)
                            const active = supplierLimit === num
                            return (
                              <button
                                key={val}
                                onClick={() => setSupplierLimit(num)}
                                className={cn(
                                  "text-[10px] font-black px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider",
                                  active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                )}
                              >
                                {val}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Performance Rankings */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <h5 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" /> Performance Rankings
                        </h5>
                        <div className="h-[300px]">
                          <ResponsiveContainer>
                            <BarChart data={rankingChartData} layout="vertical" barCategoryGap="25%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis type="number" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="Score" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={25}>
                                {rankingChartData.map((_, index) => {
                                  const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd']
                                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                })}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Radar Chart */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-5">
                          <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-400" /> Performance Radar
                          </h5>
                          {reportData.supplierPerformance.list?.length > 0 && (
                            <select
                              value={selectedRadarSupplier}
                              onChange={(e) => setSelectedRadarSupplier(e.target.value)}
                              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                            >
                              {reportData.supplierPerformance.list.map((sup: any) => (
                                <option key={sup.supplierName} value={sup.supplierName}>
                                  {sup.supplierName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="h-[300px]">
                          <ResponsiveContainer>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={supplierRadarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} tickCount={5} />
                              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} animationDuration={1200} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>


                    </div>

                    {/* Premium Assessed Supplier Profile Grid */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" /> Active Supplier Evaluations Registry
                          </h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real Assessed Supplier Lifecycle Metrics</p>
                        </div>
                      </div>

                      {(!filteredSuppliers || filteredSuppliers.length === 0) ? (
                        <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Matching Suppliers Found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredSuppliers.map((sup: any, idx: number) => {
                            const avgScore = sup.score
                            let color = '#10b981' // emerald
                            let levelBg = 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            if (avgScore === 0 || sup.level === 'Belum Dinilai') {
                              color = '#94a3b8' // slate
                              levelBg = 'bg-slate-100 text-slate-600 border-slate-200'
                            } else if (avgScore < 60) {
                              color = '#ef4444' // rose
                              levelBg = 'bg-rose-50 text-rose-700 border-rose-100'
                            } else if (avgScore < 80) {
                              color = '#f59e0b' // amber
                              levelBg = 'bg-amber-50 text-amber-700 border-amber-100'
                            }

                            return (
                              <div key={idx} className="bg-slate-50/40 rounded-3xl border border-slate-200/60 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/[0.02] to-transparent rounded-full pointer-events-none" />
                                
                                {/* Top Info */}
                                <div className="flex justify-between items-start mb-6">
                                  <div>
                                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-2", levelBg)}>
                                      {sup.level}
                                    </span>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                                      {sup.supplierName}
                                    </h4>
                                  </div>
                                  <ProgressRing percentage={avgScore} size={75} strokeWidth={6} color={color} />
                                </div>

                                {/* Summary Description */}
                                <p className="text-xs text-slate-500 font-semibold mb-6 italic border-l-2 border-slate-200 pl-3">
                                  "{sup.analysis}"
                                </p>

                                {/* Micro KPIs */}
                                <div className="grid grid-cols-2 min-[540px]:grid-cols-3 min-[850px]:grid-cols-5 gap-2 pt-5 border-t border-slate-100">
                                  {/* LPOs */}
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">LPOs Issued</span>
                                    <div className="flex items-center gap-1.5">
                                      <FileSignature className="w-4 h-4 text-indigo-500 shrink-0" />
                                      <span className="text-sm font-black text-slate-800">{sup.lpoCount} LPOs</span>
                                    </div>
                                  </div>

                                  {/* DOs */}
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total DOs</span>
                                    <div className="flex items-center gap-1.5">
                                      <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                      <span className="text-xs font-black text-slate-800">{sup.doCount || 0} DOs</span>
                                    </div>
                                  </div>

                                  {/* Cost */}
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Cost</span>
                                    <div className="flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span className="text-xs font-black text-slate-800 truncate">
                                        {formatCurrency(sup.cost).replace('MYR', 'RM')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Late Deliveries */}
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Late LPOs</span>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span className="text-xs font-black text-slate-800">{sup.lateCount || 0} LPOs</span>
                                    </div>
                                  </div>

                                  {/* Penalties */}
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Penalties</span>
                                    <div className="flex items-center gap-1.5">
                                      <FileWarning className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      <span className="text-xs font-black text-slate-800">{sup.penaltyCount || 0} Cases</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Multi-dimensional Ratings Visualizer */}
                                <div className="mt-5 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm space-y-3">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Operational Evaluation Scorecard</span>
                                  
                                  {/* Quality */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-slate-500">Quality Index</span>
                                      <span className="text-slate-800">{sup.quality}/5</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(sup.quality/5)*100}%` }} />
                                    </div>
                                  </div>

                                  {/* Delivery */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-slate-500">Delivery Accuracy</span>
                                      <span className="text-slate-800">{sup.delivery}/5</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(sup.delivery/5)*100}%` }} />
                                    </div>
                                  </div>

                                  {/* Support */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-slate-500">Support Response</span>
                                      <span className="text-slate-800">{sup.support}/5</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(sup.support/5)*100}%` }} />
                                    </div>
                                  </div>
                                </div>

                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

          </motion.div>
        )}
      </div>
    </div>
  )
}
