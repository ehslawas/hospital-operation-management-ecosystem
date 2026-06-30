// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Spinner } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import {
  ChevronRight,
  Sparkles,
  FileText,
  FileSpreadsheet,
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
  CheckCircle2,
  AlertTriangle,
  Landmark,
  History,
  Boxes,
  Search,
  SlidersHorizontal,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, LineChart
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { generateCylinderReport, CylinderReportData, WarrantEntry, DeliveryEntry, CylinderDetailEntry } from '../../services/cylinderReportService'

// ─── Color Palette ──────────────────────────────────────────────────────────
const CHART_COLORS = ['#00a68a', '#475569', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#cbd5e1']
const PIE_COLORS = ['#00a68a', '#64748b', '#05bca0', '#475569', '#8b9bb4', '#3b82f6', '#cbd5e1', '#e2e8f0']

const STATUS_COLORS: Record<string, string> = {
  'Full': '#10b981',
  'In Use': '#00a68a',
  'Empty': '#ef4444',
  'Maintenance': '#f59e0b',
}

const getStatusColor = (status: string) => STATUS_COLORS[status] || '#64748b'

// ─── Tab Definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: 'executive', label: 'Executive Summary', icon: Landmark, color: 'teal' },
  { id: 'warrant', label: 'Warrant & Budget', icon: BarChart3, color: 'teal' },
  { id: 'usage', label: 'Usage Analytics', icon: Activity, color: 'teal' },
  { id: 'delivery', label: 'Delivery & Reception', icon: Download, color: 'teal' },
  { id: 'inventory', label: 'Inventory Status', icon: Boxes, color: 'teal' },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp, color: 'teal' },
  { id: 'detailed', label: 'Detailed Data', icon: History, color: 'teal' }
]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  // Filter out duplicate or technical keys
  const filteredPayload = payload.filter((entry: any) => entry.name !== 'issued' && entry.name !== 'received')
  if (!filteredPayload.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md text-slate-800 px-3.5 py-3 rounded-xl shadow-lg border border-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00a68a]" />
      <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">{label}</p>
      <div className="space-y-1.5">
        {filteredPayload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-4 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 font-medium">{entry.name}:</span>
            <span className="text-slate-900 font-mono font-bold ml-auto">
              {typeof entry.value === 'number'
                ? entry.value >= 1000 && !entry.name.includes('Count') && !entry.name.includes('Qty') && !entry.name.includes('Cylinder')
                  ? formatCurrency(entry.value).replace('MYR', 'RM')
                  : entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplay(eased * value)
      if (progress < 1) requestAnimationFrame(animate)
    }
    const req = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(req)
  }, [value])
  return <span>{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}{suffix}</span>
}

// ─── Progress Ring ──────────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 160, strokeWidth = 10, color = '#00a68a' }: { percentage: number, size?: number, strokeWidth?: number, color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: [0.2, 0, 0, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{percentage.toFixed(1)}%</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Utilized</span>
      </div>
    </div>
  )
}

// ─── Sparklines for Cards ──────────────────────────────────────────────────
const SPARKLINE_PATHS: Record<string, { path: string, stroke: string }> = {
  indigo: { path: "M0,25 Q15,10 30,22 T60,8 T90,15 T100,5", stroke: "#00a68a" },
  emerald: { path: "M0,28 Q20,15 40,25 T80,8 T100,2", stroke: "#00a68a" },
  rose: { path: "M0,5 Q20,10 40,18 T80,25 T100,28", stroke: "#ef4444" },
  blue: { path: "M0,25 Q20,18 40,22 T80,10 T100,8", stroke: "#64748b" },
  violet: { path: "M0,28 Q15,22 30,25 T60,12 T90,8 T100,5", stroke: "#00a68a" },
  teal: { path: "M0,22 Q15,8 30,18 T60,5 T90,12 T100,8", stroke: "#00a68a" },
  amber: { path: "M0,20 Q25,18 50,12 T75,15 T100,10", stroke: "#f59e0b" },
  slate: { path: "M0,22 Q10,5 20,25 T40,10 T60,28 T80,8 T100,15", stroke: "#64748b" }
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, prefix, suffix, icon: Icon, color, delay = 0, decimals = 0, trend }: {
  label: string, value: number, prefix?: string, suffix?: string, icon: any, color: string, delay?: number, decimals?: number, trend?: { val: number; isUp: boolean }
}) {
  const spark = SPARKLINE_PATHS[color] || SPARKLINE_PATHS.indigo

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.2, 0, 0, 1] }}
      className="relative group rounded-xl p-4.5 pt-5 border border-slate-200/60 bg-white hover:border-slate-300 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
    >
      {/* Top indicator color line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[3px] transition-all duration-300",
        color === 'teal' && "bg-[#00a68a]",
        color === 'rose' && "bg-rose-500",
        color === 'amber' && "bg-amber-500",
        color === 'slate' && "bg-slate-400"
      )} />
      <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={spark.stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={spark.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={spark.path} fill={`url(#sparkGrad-${color})`} stroke={spark.stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100/60 transition-colors duration-300 group-hover:bg-[#00a68a]/5 group-hover:text-[#00a68a] group-hover:border-[#00a68a]/10">
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
            trend.isUp ? "bg-emerald-50 text-emerald-600 border border-emerald-100/40" : "bg-rose-50 text-rose-600 border border-rose-100/40"
          )}>
            {trend.isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {trend.val}%
          </span>
        )}
      </div>
      <div className="relative z-10">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">{label}</div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, icon: Icon, dark }: { title: string, subtitle?: string, icon?: any, dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {Icon && (
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center border",
          dark 
            ? "bg-slate-800/50 text-[#00a68a] border-slate-700/50" 
            : "bg-slate-50 text-[#00a68a] border-slate-100"
        )}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <h4 className={cn("text-sm font-bold tracking-tight", dark ? "text-slate-100 animate-fade-in" : "text-slate-900")}>{title}</h4>
        {subtitle && <p className={cn("text-[9px] font-bold uppercase tracking-wider mt-0.5", dark ? "text-slate-400" : "text-slate-400")}>{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Horizontal Progress Bar ────────────────────────────────────────────────
function HorizontalBar({ label, value, max, color, suffix = '', delay = 0 }: { label: string, value: number, max: number, color: string, suffix?: string, delay?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 capitalize tracking-tight">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-900 font-mono">{value.toLocaleString()}{suffix}</span>
          <span className="text-[9.5px] text-slate-400 font-semibold font-mono">({pct.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full bg-[#00a68a]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.2, 0, 0, 1] }}
        />
      </div>
    </div>
  )
}

export function CylinderReportPage() {
  const { user } = useAuthStore()
  const toast = useToastStore()

  const [activeTab, setActiveTab] = useState('executive')
  const [dateRangePreset, setDateRangePreset] = useState('6months')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<CylinderReportData | null>(null)
  const [selectedTrendSize, setSelectedTrendSize] = useState('all')
  
  // Custom Dates (if custom range selected)
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0])

  // Compute actual date objects
  const dateRange = useMemo(() => {
    const end = new Date()
    let start = new Date()

    if (dateRangePreset === '1month') {
      start.setMonth(end.getMonth() - 1)
    } else if (dateRangePreset === '3months') {
      start.setMonth(end.getMonth() - 3)
    } else if (dateRangePreset === '12months') {
      start.setMonth(end.getMonth() - 12)
    } else if (dateRangePreset === 'custom') {
      return {
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate)
      }
    } else {
      // 6 months (default)
      start.setMonth(end.getMonth() - 6)
    }
    return { startDate: start, endDate: end }
  }, [dateRangePreset, customStartDate, customEndDate])

  const fySuffix = useMemo(() => {
    return `(FY${String(dateRange.endDate.getFullYear()).slice(-2)})`
  }, [dateRange])

  const cumulativeTrend = useMemo(() => {
    if (!reportData?.warrants?.monthlyTrend) return []
    let cumulativeAllocated = 0
    let cumulativeSpent = 0
    return reportData.warrants.monthlyTrend.map(item => {
      cumulativeAllocated += item.allocated
      cumulativeSpent += item.spent
      return {
        month: item.month,
        "Cumulative Budget": cumulativeAllocated,
        "Cumulative Spent": cumulativeSpent,
      }
    })
  }, [reportData])

  // Detailed Data Tab Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Fetch Report Data
  const fetchReport = async () => {
    setLoading(true)
    try {
      const hospitalId = user?.hospital_id || 'default_hospital_id'
      const response = await generateCylinderReport(hospitalId, dateRange)
      if (response.error) {
        toast.error('Failed to load report', response.error)
      } else {
        setReportData(response.data)
      }
    } catch (e) {
      toast.error('Error generating report', e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [dateRangePreset, customStartDate, customEndDate])

  // Dynamic KPIs for Usage Analytics
  const peakMonthDemandInfo = useMemo(() => {
    if (!reportData?.usage?.monthlyTrend?.length) return { value: 0, month: 'N/A' }
    let maxVal = 0
    let maxMonth = 'N/A'
    reportData.usage.monthlyTrend.forEach(m => {
      const sum = Object.entries(m)
        .filter(([key]) => key !== 'month')
        .reduce((sum, [_, val]) => sum + Number(val || 0), 0)
      if (sum > maxVal) {
        maxVal = sum
        maxMonth = m.month
      }
    })
    return { value: maxVal, month: maxMonth }
  }, [reportData])

  const topUsedSize = useMemo(() => {
    if (!reportData?.usage?.byType?.length) return { type: 'N/A', count: 0, percentage: 0 }
    return reportData.usage.byType[0] as any
  }, [reportData])

  const topDepartmentInfo = useMemo(() => {
    if (!reportData?.usage?.byDepartment?.length) return { department: 'N/A', count: 0 }
    return reportData.usage.byDepartment[0] as any
  }, [reportData])

  const quarterlyStats = useMemo(() => {
    if (!reportData?.usage?.monthlyTrend || !reportData?.usage?.byType) return []
    const statsMap: Record<string, { q1: number; q2: number; q3: number; q4: number; total: number }> = {}
    const types = reportData.usage.byType.map(t => t.type)
    types.forEach(t => {
      statsMap[t] = { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 }
    })
    
    reportData.usage.monthlyTrend.forEach(item => {
      const monthStr = item.month.split(' ')[0]
      types.forEach(t => {
         const val = Number(item[t] || 0)
         statsMap[t].total += val
         if (['Jan', 'Feb', 'Mar'].includes(monthStr)) {
           statsMap[t].q1 += val
         } else if (['Apr', 'May', 'Jun'].includes(monthStr)) {
           statsMap[t].q2 += val
         } else if (['Jul', 'Aug', 'Sep'].includes(monthStr)) {
           statsMap[t].q3 += val
         } else if (['Oct', 'Nov', 'Dec'].includes(monthStr)) {
           statsMap[t].q4 += val
         }
      })
    })
    
    return Object.entries(statsMap).map(([type, stats]) => ({
      type,
      ...stats,
      avg_q1: parseFloat((stats.q1 / 3).toFixed(1)),
      avg_q2: parseFloat((stats.q2 / 3).toFixed(1)),
      avg_q3: parseFloat((stats.q3 / 3).toFixed(1)),
      avg_q4: parseFloat((stats.q4 / 3).toFixed(1)),
    }))
  }, [reportData])

  const quarterlyOverallTrend = useMemo(() => {
    if (!quarterlyStats.length) return []
    let q1Total = 0, q2Total = 0, q3Total = 0, q4Total = 0
    quarterlyStats.forEach((s: any) => {
      q1Total += s.q1
      q2Total += s.q2
      q3Total += s.q3
      q4Total += s.q4
    })
    return [
      { name: 'Q1 (Jan-Mar)', value: q1Total },
      { name: 'Q2 (Apr-Jun)', value: q2Total },
      { name: 'Q3 (Jul-Sep)', value: q3Total },
      { name: 'Q4 (Oct-Dec)', value: q4Total }
    ]
  }, [quarterlyStats])

  const filteredTrendData = useMemo(() => {
    if (!reportData?.usage?.monthlyTrend || !reportData?.usage?.byType || !reportData?.deliveries?.receivedMonthlyTrend) return []
    return reportData.usage.monthlyTrend.map(m => {
      const result: any = { month: m.month }
      const recM = reportData.deliveries.receivedMonthlyTrend.find(r => r.month === m.month) || {}
      if (selectedTrendSize === 'all') {
        result.issued = reportData.usage.byType.reduce((sum, t) => sum + Number(m[t.type] || 0), 0)
        result.received = reportData.usage.byType.reduce((sum, t) => sum + Number(recM[t.type] || 0), 0)
      } else {
        result.issued = Number(m[selectedTrendSize] || 0)
        result.received = Number(recM[selectedTrendSize] || 0)
      }
      return result
    })
  }, [reportData, selectedTrendSize])

  // Filtered detailed inventory items
  const filteredCylinders = useMemo(() => {
    if (!reportData?.detailed) return []
    return reportData.detailed.filter(item => {
      const matchesSearch = item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.location_name && item.location_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (item.department_name && item.department_name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesSize = sizeFilter === 'all' || item.size_code === sizeFilter

      return matchesSearch && matchesStatus && matchesSize
    })
  }, [reportData, searchQuery, statusFilter, sizeFilter])

  // Paginated detailed inventory
  const paginatedCylinders = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredCylinders.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredCylinders, currentPage])

  const totalPages = Math.ceil(filteredCylinders.length / rowsPerPage) || 1

  // Excel Export
  const handleExportExcel = () => {
    if (!reportData) return
    try {
      // 1. Summary
      const summaryRows = [
        ['CYLINDER REPORT SUMMARY'],
        ['Hospital ID', user?.hospital_id || 'N/A'],
        ['Generated Date', new Date().toLocaleString()],
        ['Period', `${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`],
        [],
        ['Metric', 'Value'],
        ['Total Cylinders', reportData.summary.totalCylinders],
        ['Active Cylinders (Full/In Use)', reportData.summary.activeCylinders],
        ['Total Warrant Allocation', reportData.summary.totalWarrantAmount],
        ['Total Expenses Spent', reportData.summary.totalExpenses],
        ['Budget Balance', reportData.summary.currentBalance],
        ['Budget Utilization (%)', reportData.summary.budgetUtilization.toFixed(2)],
        ['Runway (Months Remaining)', reportData.summary.runwayMonths],
        ['Total Deliveries Received', reportData.summary.totalDeliveries],
        ['Avg Monthly Consumption Qty', reportData.summary.avgMonthlyUsage.toFixed(1)]
      ]

      // 2. Inventory Status
      const invRows = [
        ['Cylinder Size/Type', 'Full Count', 'Empty Count', 'In Use Count', 'Maintenance Count'],
        ...reportData.inventory.byType.map(t => [t.type, t.full, t.empty, t.inUse, t.maintenance])
      ]

      // 3. Department Distribution
      const deptRows = [
        ['Department / Ward', 'Cylinders Allocated'],
        ...reportData.inventory.departmentDistribution.map(d => [d.department, d.count])
      ]

      // 4. Warrants
      const warrantRows = [
        ['Warrant Number', 'Vote Code', 'Warrant Date', 'Amount (RM)', 'Category'],
        ...reportData.warrants.list.map(w => [w.warrant_no, w.vote_code, w.warrant_date, w.amount, w.category])
      ]

      // 5. Deliveries
      const deliveryRows = [
        ['Delivery Order No', 'Reception Date', 'Items Count', 'Status', 'Total Value (RM)'],
        ...reportData.deliveries.recentDeliveries.map(d => [d.delivery_order_no, d.reception_date, d.items_count, d.status, d.total_amount])
      ]

      // 6. Detailed Cylinders
      const detailRows = [
        ['Serial Number', 'Size Code', 'Full Description', 'Status', 'Current Location', 'Assigned Ward', 'QR Tagged', 'Last Movement Date'],
        ...reportData.detailed.map(c => [
          c.serial_number,
          c.size_code,
          c.type_name,
          c.status.toUpperCase(),
          c.location_name,
          c.department_name || 'Store',
          c.qr_code ? 'YES' : 'NO',
          c.last_movement_date || 'N/A'
        ])
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Report Summary')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(invRows), 'Inventory Status')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptRows), 'Dept Allocation')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(warrantRows), 'Warrants & Budgets')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deliveryRows), 'Deliveries')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailRows), 'Cylinder Register')

      XLSX.writeFile(wb, `Cylinder_Report_${dateRangePreset}_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel Export Complete', 'Full workbook with detail sheets downloaded.')
    } catch (e) {
      toast.error('Excel Export Failed', e instanceof Error ? e.message : 'Unknown error')
    }
  }

  // PDF Export
  const handleExportPdf = () => {
    if (!reportData) return
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const startX = 14
      let currentY = 15

      // Title
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(30, 41, 59)
      doc.text('HOSPITAL CYLINDER MANAGEMENT SYSTEM', startX, currentY)
      currentY += 6

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Official Cylinder Inventory, Consumption, & Financial Runway Report`, startX, currentY)
      currentY += 8

      // Divider line
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(startX, currentY, 210 - startX, currentY)
      currentY += 8

      // Meta Info Block
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text('REPORT DETAILS', startX, currentY)
      currentY += 5

      doc.setFont('Helvetica', 'normal')
      doc.text(`Hospital ID: ${user?.hospital_id || 'N/A'}`, startX, currentY)
      doc.text(`Generated Date: ${new Date().toLocaleString()}`, 110, currentY)
      currentY += 5
      doc.text(`Period: ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`, startX, currentY)
      doc.text(`Runway Status: ${reportData.summary.runwayMonths} Months Remaining`, 110, currentY)
      currentY += 10

      // Summary Table
      doc.setFont('Helvetica', 'bold')
      doc.text('EXECUTIVE EXECUTIVE METRICS', startX, currentY)
      currentY += 4

      const summaryTableData = [
        ['Total Oxygen Cylinders', String(reportData.summary.totalCylinders), 'Warrant Budget Allocations', `RM ${reportData.summary.totalWarrantAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Active Cylinders (In Use / Full)', String(reportData.summary.activeCylinders), 'Expenditures / Spent to Date', `RM ${reportData.summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Utilization Ratio', `${reportData.inventory.utilizationRate.toFixed(1)}%`, 'Remaining Balance', `RM ${reportData.summary.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Total Deliveries Made', String(reportData.summary.totalDeliveries), 'Budget Utilization (%)', `${reportData.summary.budgetUtilization.toFixed(1)}%`]
      ]

      autoTable(doc, {
        startY: currentY,
        head: [],
        body: summaryTableData,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2, fontStyle: 'normal' },
        columnStyles: {
          0: { fontStyle: 'bold', width: 50 },
          1: { width: 35 },
          2: { fontStyle: 'bold', width: 55 },
          3: { width: 45 }
        }
      })
      currentY = (doc as any).lastAutoTable.finalY + 10

      // Inventory Distribution Table
      doc.setFont('Helvetica', 'bold')
      doc.text('CYLINDER INVENTORY BY STATUS & TYPE', startX, currentY)
      currentY += 4

      const invHeaders = [['Cylinder Size/Type', 'Full Count', 'Empty Count', 'In Use Count', 'Maintenance Count']]
      const invBody = reportData.inventory.byType.map(t => [
        t.type,
        String(t.full),
        String(t.empty),
        String(t.inUse),
        String(t.maintenance)
      ])

      autoTable(doc, {
        startY: currentY,
        head: invHeaders,
        body: invBody,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2.5 }
      })
      currentY = (doc as any).lastAutoTable.finalY + 10

      // Warrants List Table
      doc.setFont('Helvetica', 'bold')
      doc.text('Oxygen Warrants List', startX, currentY)
      currentY += 4

      const wHeaders = [['Warrant No', 'Vote Code', 'Category', 'Warrant Date', 'Amount']]
      const wBody = reportData.warrants.list.map(w => [
        w.warrant_no,
        w.vote_code,
        w.category,
        w.warrant_date,
        `RM ${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ])

      autoTable(doc, {
        startY: currentY,
        head: wHeaders,
        body: wBody,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2.5 }
      })

      // Add a page for detailed inventory register
      doc.addPage()
      currentY = 15

      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('CYLINDER DETAIL REGISTER (ACTIVE)', startX, currentY)
      currentY += 6

      const detailHeaders = [['Serial Number', 'Size Code', 'Status', 'Assigned Location', 'QR Code Tagged']]
      const detailBody = reportData.detailed.slice(0, 35).map(c => [
        c.serial_number,
        c.size_code,
        c.status.toUpperCase(),
        c.location_name || 'Central Store',
        c.qr_code ? 'YES' : 'NO'
      ])

      autoTable(doc, {
        startY: currentY,
        head: detailHeaders,
        body: detailBody,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2 }
      })

      doc.setFont('Helvetica', 'italic')
      doc.setFontSize(8)
      doc.text('* Note: Cylinder Detail Register shows the first 35 records. Full register is available in the Excel export.', startX, (doc as any).lastAutoTable.finalY + 5)

      doc.save(`Cylinder_Report_Doc_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF Export Complete', 'Cylinder report document downloaded.')
    } catch (e) {
      toast.error('PDF Export Failed', e instanceof Error ? e.message : 'Unknown error')
    }
  }

  // Pre-load layout stats
  const activeStats = useMemo(() => {
    if (!reportData) return null
    return reportData.summary
  }, [reportData])

  return (
    <div className="min-h-screen bg-[#fafafa] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pb-12 font-sans antialiased text-slate-800 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#00a68a]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#00a68a]/3 to-transparent blur-3xl pointer-events-none" />
      {/* Top Action Bar */}
      <div className="bg-white border-b border-slate-200/40 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#e6f7f4] text-[#00a68a] text-[9.5px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase">Oxygen Module</span>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reports</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Cylinder Report Dashboard
            <span className="h-1.5 w-1.5 rounded-full bg-[#00a68a] animate-pulse" />
          </h1>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Buttons */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 border border-slate-200/20">
            {[
              { id: '1month', label: '1M' },
              { id: '3months', label: '3M' },
              { id: '6months', label: '6M' },
              { id: '12months', label: '12M' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDateRangePreset(p.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase transition-all duration-150",
                  dateRangePreset === p.id
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/30"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {dateRangePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-[11px] font-semibold text-slate-700 w-28"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-[11px] font-semibold text-slate-700 w-28"
              />
            </div>
          )}

          {/* Reload & Exports */}
          <button
            onClick={fetchReport}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#00a68a] hover:border-slate-300 hover:shadow-sm transition-all duration-150"
            title="Reload Report"
            disabled={loading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#00a68a]")} />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:shadow-sm transition-all duration-150"
            disabled={!reportData || loading}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#00a68a] hover:bg-[#008c75] rounded-lg text-xs font-semibold text-white shadow-sm hover:shadow transition-all duration-150"
            disabled={!reportData || loading}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF Report</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 mt-6">
        {/* Dynamic Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-row items-center gap-1.5 p-1 bg-slate-100/60 border border-slate-200/30 rounded-xl mb-6 relative z-10">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-2 px-3 py-2 text-[10px] lg:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 rounded-lg relative w-full lg:w-auto",
                isActive
                  ? "text-[#00a68a] bg-white shadow-sm border border-slate-200/30"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-[#00a68a]" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

        {/* Main Content Area */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] flex flex-col items-center justify-center bg-white border border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
              >
                <Spinner className="w-8 h-8 text-[#00a68a] mb-3 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Aggregating Cylinder Data...</p>
                <p className="text-[11px] text-slate-400 mt-1">Fetching latest warrants, receptions, inventory and calculating forecasts.</p>
              </motion.div>
            ) : !reportData ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] flex flex-col items-center justify-center bg-white border border-slate-200/60 rounded-xl p-6 text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-3.5 text-slate-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No Report Data Available</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                  We could not fetch or generate report statistics for this timeframe. Ensure that the database is connected.
                </p>
                <button
                  onClick={fetchReport}
                  className="inline-flex items-center justify-center px-4 py-2 bg-[#00a68a] hover:bg-[#008d74] text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98]"
                >
                  Retry Loading
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              >
                {/* ─── TAB 1: EXECUTIVE SUMMARY ───────────────────────────────── */}
                {activeTab === 'executive' && (
                  <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                      <KpiCard label="Total Cylinders" value={reportData.summary.totalCylinders} icon={Boxes} color="teal" delay={0.05} />
                      <KpiCard label="Active Cylinders" value={reportData.summary.activeCylinders} icon={CheckCircle2} color="teal" delay={0.1} />
                      <KpiCard label={"Warrant Amount " + fySuffix} value={reportData.summary.totalWarrantAmount} prefix="RM " icon={Landmark} color="teal" delay={0.15} />
                      <KpiCard label={"Total Expenses " + fySuffix} value={reportData.summary.totalExpenses} prefix="RM " icon={History} color="rose" delay={0.2} />
                      <KpiCard label="Deliveries Made" value={reportData.summary.totalDeliveries} icon={Download} color="slate" delay={0.25} />
                      <KpiCard label="Runway Remaining" value={reportData.summary.runwayMonths} suffix=" Mo" icon={TrendingUp} color="amber" delay={0.3} decimals={1} />
                    </div>

                    {/* Chart & Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Cumulative Warrant Allocations vs Expenses */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden group">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                          <SectionHeader title="Cumulative Warrant Budget vs Spent" subtitle="Financial Flow (FY26)" icon={Landmark} />
                          <span className="text-[10px] font-bold text-[#00a68a] bg-[#e6f7f4] border border-[#00a68a]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                            Budget Burn-up
                          </span>
                        </div>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cumulativeTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.06}/>
                                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.005}/>
                                </linearGradient>
                                <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00a68a" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#00a68a" stopOpacity={0.01}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                              <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} tickFormatter={val => `RM ${val >= 1000 ? (val/1000)+'K' : val}`} />
                              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 1 }} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 9.5, fontWeight: 'semibold', paddingTop: 10 }} />
                              <Area type="stepAfter" name="Cumulative Budget (Allocated)" dataKey="Cumulative Budget" stroke="#64748b" strokeWidth={1.5} fill="url(#budgetGrad)" strokeDasharray="4 4" />
                              <Area type="monotone" name="Cumulative Spent (Expenses)" dataKey="Cumulative Spent" stroke="#00a68a" strokeWidth={2.5} fill="url(#spentGrad)" dot={{ r: 3.5, stroke: '#00a68a', strokeWidth: 1.5, fill: '#fff' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Right: Circular Progress Ring & Quick Stats */}
                      <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-between">
                        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                          <SectionHeader title="Budget Utilization Overview" subtitle="Vote Category Balance" icon={PieChartIcon} />
                          {reportData.summary.currentBalance >= 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#e6f7f4] text-[#00a68a] border border-[#00a68a]/10">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00a68a] animate-pulse" />
                              Within Budget
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200/40 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Budget Exceeded
                            </span>
                          )}
                        </div>
                        
                        <div className="my-6">
                          <ProgressRing percentage={reportData.summary.budgetUtilization} color="#00a68a" size={160} strokeWidth={10} />
                        </div>

                        <div className="w-full bg-slate-50/50 border border-slate-100 rounded-lg p-3 flex justify-between gap-4 font-sans text-xs">
                          <div>
                            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[8px] mb-1">Total Available</span>
                            <span className="font-bold text-slate-800 text-xs font-mono">{formatCurrency(reportData.summary.totalWarrantAmount).replace('MYR', 'RM')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[8px] mb-1">Remaining Balance</span>
                            <span className={cn("font-bold text-xs font-mono", reportData.summary.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {formatCurrency(reportData.summary.currentBalance).replace('MYR', 'RM')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: Top consumption departments & Status Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Side: Status Donut Chart */}
                      <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                        <SectionHeader title="Cylinder Status Distribution" subtitle="Active Inventory Breakdown" icon={Boxes} />
                        <div className="h-[250px] w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip content={<CustomTooltip />} />
                              <Pie
                                data={reportData.inventory.byStatus}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="count"
                                nameKey="status"
                              >
                                {reportData.inventory.byStatus.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Center Absolute Label */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{reportData.summary.totalCylinders}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Tanks</span>
                          </div>
                        </div>

                        {/* Legends */}
                        <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-slate-650">
                          {reportData.inventory.byStatus.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100/80">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(entry.status) }} />
                              <span className="truncate text-slate-600 font-semibold">{entry.status}</span>
                              <span className="font-mono text-slate-800 ml-auto font-bold">{entry.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Top Consuming Departments */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                          <SectionHeader title="Top Consuming Departments & Wards" subtitle="Oxygen Consumption" icon={Activity} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-2">
                          {!reportData.usage.topConsumingDepartments || reportData.usage.topConsumingDepartments.length === 0 ? (
                            <div className="col-span-2 py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                              <Activity className="w-8 h-8 text-slate-350 mb-2 stroke-[1.5] animate-pulse" />
                              <span className="font-semibold text-slate-500">No consumption data logged</span>
                              <span className="text-[10px] text-slate-450 mt-0.5">Use the Oxygen module to log department consumption.</span>
                            </div>
                          ) : (
                            reportData.usage.topConsumingDepartments.slice(0, 6).map((dept, idx) => {
                              const maxVal = reportData.usage.topConsumingDepartments[0]?.usage || 100
                              return (
                                <HorizontalBar
                                  key={idx}
                                  label={dept.department}
                                  value={dept.usage}
                                  max={maxVal}
                                  color="#00a68a"
                                  suffix=" Cyls"
                                  delay={idx * 0.05}
                                />
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: WARRANT & BUDGET ───────────────────────────────── */}
                {activeTab === 'warrant' && (
                  <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard label={"Warrant Allocation " + fySuffix} value={reportData.summary.totalWarrantAmount} prefix="RM " icon={Landmark} color="teal" />
                      <KpiCard label={"Total Spent " + fySuffix} value={reportData.summary.totalExpenses} prefix="RM " icon={History} color="rose" />
                      <KpiCard label="Available Balance" value={reportData.summary.currentBalance} prefix="RM " icon={CheckCircle2} color={reportData.summary.currentBalance >= 0 ? "teal" : "rose"} />
                      <KpiCard label="Budget Utilized" value={reportData.summary.budgetUtilization} suffix="%" icon={Activity} color="amber" decimals={1} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Stacked Bar Chart: warrant spend by vote code */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                        <SectionHeader title="Monthly Allocations vs Expenses Trend" subtitle="Warrants Breakdown" icon={BarChart3} />
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.warrants.monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                              <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} tickFormatter={val => `RM ${val >= 1000 ? (val/1000)+'K' : val}`} />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 9.5, fontWeight: 'semibold', paddingTop: 10 }} />
                              <Bar name="Budget Allocated" dataKey="allocated" fill="#64748b" radius={[4, 4, 0, 0]} barSize={12} />
                              <Bar name="Actual Spent" dataKey="spent" fill="#00a68a" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Vote code distribution */}
                      <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                          <SectionHeader title="Utilization by Vote Code" subtitle="Vote Allotments" icon={PieChartIcon} />
                        </div>
                        <div className="h-[200px] w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip content={<CustomTooltip />} />
                              <Pie
                                data={reportData.warrants.utilizationByVoteCode}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="spent"
                                nameKey="voteCode"
                              >
                                {reportData.warrants.utilizationByVoteCode.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Vote table */}
                        <div className="space-y-2 mt-4 text-[10px] font-bold text-slate-650">
                          {reportData.warrants.utilizationByVoteCode.map((v, idx) => {
                            const util = v.allocated > 0 ? (v.spent / v.allocated) * 100 : 0
                            return (
                              <div key={idx} className="flex flex-col p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                                  <span>Vote {v.voteCode}</span>
                                  <span className="text-[#00a68a] font-mono">{util.toFixed(1)}% Utilized</span>
                                </div>
                                <div className="flex justify-between text-slate-400 font-semibold mt-1 font-mono text-[9px]">
                                  <span>Allocated: RM {v.allocated.toLocaleString()}</span>
                                  <span>Spent: RM {v.spent.toLocaleString()}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Warrants Listing Table */}
                    <div className="bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                      <div className="p-5.5 border-b border-slate-100 flex items-center justify-between">
                        <SectionHeader title="Warrants Registered" subtitle="All Oxygen Funds Received" icon={Landmark} />
                        <span className="text-[10px] bg-[#e6f7f4] text-[#00a68a] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {reportData.warrants.list.length} Warrants Total
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/60 bg-slate-50/60 text-xs font-semibold text-slate-500">
                              <th className="px-6 py-3.5">Warrant Number</th>
                              <th className="px-6 py-3.5">Vote Code</th>
                              <th className="px-6 py-3.5">Category</th>
                              <th className="px-6 py-3.5">Issue Date</th>
                              <th className="px-6 py-3.5 text-right">Amount (RM)</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-normal text-slate-600 divide-y divide-slate-100">
                            {reportData.warrants.list.map(w => (
                              <tr key={w.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">{w.warrant_no}</td>
                                <td className="px-6 py-3.5">
                                  <span className="bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] px-2 py-0.5 rounded font-mono font-medium">{w.vote_code}</span>
                                </td>
                                <td className="px-6 py-3.5 capitalize text-slate-600 font-medium">{w.category.replace('_', ' ')}</td>
                                <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">{new Date(w.warrant_date).toLocaleDateString()}</td>
                                <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums">RM {w.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: USAGE ANALYTICS ─────────────────────────────────── */}
                {activeTab === 'usage' && (
                  <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard 
                        label="Average Monthly Usage" 
                        value={reportData.summary.avgMonthlyUsage} 
                        suffix=" Tanks" 
                        icon={Activity} 
                        color="teal" 
                        decimals={1} 
                        trend={{ val: 4.8, isUp: true }}
                      />
                      <KpiCard 
                        label="Peak Month Demand" 
                        value={peakMonthDemandInfo.value} 
                        suffix=" Tanks" 
                        icon={TrendingUp} 
                        color="teal" 
                        trend={{ val: 12.3, isUp: true }}
                      />
                      <KpiCard 
                        label="Top Used Size" 
                        value={topUsedSize.count} 
                        prefix="" 
                        suffix={` (${topUsedSize.type})`} 
                        icon={Boxes} 
                        color="teal" 
                      />
                      <KpiCard 
                        label="Active Wards" 
                        value={reportData.usage.byDepartment.length} 
                        icon={Landmark} 
                        color="slate" 
                      />
                    </div>

                    {/* Secondary Metrics Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Month</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{peakMonthDemandInfo.month}</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200/60 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Cylinder Share</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{topUsedSize.type} ({topUsedSize.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200/60 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Consuming Ward</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{topDepartmentInfo.department} ({topDepartmentInfo.count} Tanks)</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200/60 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Period Limit</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">Last 6 Months (Live)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Side: Trends & Quarterly Dashboard */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Monthly Composed Trend Chart with Interactive Filters */}
                        <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
                            <SectionHeader title="Monthly Usage Trend" subtitle="Oxygen Consumption Volume" icon={Activity} />
                            
                            {/* Toggle Pill Chips */}
                            <div className="flex flex-wrap gap-1 bg-slate-50 border border-slate-100 p-0.5 rounded-lg shrink-0">
                              <button
                                onClick={() => setSelectedTrendSize('all')}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                                  selectedTrendSize === 'all'
                                    ? 'bg-[#00a68a] text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                All Sizes
                              </button>
                              {reportData.usage.byType.map((typeObj: any) => (
                                <button
                                  key={typeObj.type}
                                  onClick={() => setSelectedTrendSize(typeObj.type)}
                                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                                    selectedTrendSize === typeObj.type
                                      ? 'bg-[#00a68a] text-white shadow-sm'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  {typeObj.type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="h-[280px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={filteredTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 1 }} />
                                 <Legend 
                                   verticalAlign="top" 
                                   height={36} 
                                   iconType="circle" 
                                   wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} 
                                   payload={[
                                     { value: 'Issued to Wards (Tanks)', type: 'circle', id: 'issued', color: '#00a68a' },
                                     { value: 'Received from Supplier (Tanks)', type: 'circle', id: 'received', color: '#3b82f6' }
                                   ]}
                                 />
                                <Bar 
                                  dataKey="issued" 
                                  legendType="none"
                                  fill="#00a68a" 
                                  fillOpacity={0.06} 
                                  stroke="#00a68a"
                                  strokeWidth={1}
                                  strokeOpacity={0.15}
                                  radius={[4, 4, 0, 0]} 
                                  barSize={20} 
                                />
                                <Bar 
                                  dataKey="received" 
                                  legendType="none"
                                  fill="#3b82f6" 
                                  fillOpacity={0.06} 
                                  stroke="#3b82f6"
                                  strokeWidth={1}
                                  strokeOpacity={0.15}
                                  radius={[4, 4, 0, 0]} 
                                  barSize={20} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="issued" 
                                  name="Issued to Wards (Tanks)" 
                                  stroke="#00a68a" 
                                  strokeWidth={2} 
                                  dot={{ r: 3, strokeWidth: 0, fill: "#00a68a" }} 
                                  activeDot={{ r: 5, strokeWidth: 0 }} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="received" 
                                  name="Received from Supplier (Tanks)" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2} 
                                  dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }} 
                                  activeDot={{ r: 5, strokeWidth: 0 }} 
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Quarterly Performance Dashboard */}
                        <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                          <SectionHeader title="Quarterly Usage Performance" subtitle="Refill & Dispatch Summary" icon={BarChart3} />
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="md:col-span-1 border-r border-slate-100 pr-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Overall Quarterly Totals</span>
                              <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={quarterlyOverallTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.02)" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Tanks" fill="#00a68a" radius={[4, 4, 0, 0]} barSize={14} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            
                            <div className="md:col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Quarterly Performance Matrix</span>
                              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                                <table className="w-full text-[11px] text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                      <th className="px-2.5 py-2 font-semibold text-slate-600">Type</th>
                                      <th className="px-2.5 py-2 text-center font-semibold text-slate-600">Q1</th>
                                      <th className="px-2.5 py-2 text-center font-semibold text-slate-600">Q2</th>
                                      <th className="px-2.5 py-2 text-center font-semibold text-slate-600">Q3</th>
                                      <th className="px-2.5 py-2 text-center font-semibold text-slate-600">Q4</th>
                                      <th className="px-2.5 py-2 text-right font-bold text-slate-700">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {(quarterlyStats as any[]).map((q: any) => (
                                      <tr key={q.type} className="hover:bg-slate-50/50">
                                        <td className="px-2.5 py-2 font-medium text-slate-700">{q.type}</td>
                                        <td className="px-2.5 py-2 text-center font-semibold font-mono text-slate-800 tabular-nums">
                                          {q.q1 || 0} <span className="text-[9px] text-slate-400 font-normal block">Avg {q.avg_q1 || 0}</span>
                                        </td>
                                        <td className="px-2.5 py-2 text-center font-semibold font-mono text-slate-800 tabular-nums">
                                          {q.q2 || 0} <span className="text-[9px] text-slate-400 font-normal block">Avg {q.avg_q2 || 0}</span>
                                        </td>
                                        <td className="px-2.5 py-2 text-center font-semibold font-mono text-slate-800 tabular-nums">
                                          {q.q3 || 0} <span className="text-[9px] text-slate-400 font-normal block">Avg {q.avg_q3 || 0}</span>
                                        </td>
                                        <td className="px-2.5 py-2 text-center font-semibold font-mono text-slate-800 tabular-nums">
                                          {q.q4 || 0} <span className="text-[9px] text-slate-400 font-normal block">Avg {q.avg_q4 || 0}</span>
                                        </td>
                                        <td className="px-2.5 py-2 text-right font-black font-mono text-slate-900 tabular-nums">{q.total}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Share Donut & Ward Rankings */}
                      <div className="space-y-6">
                        {/* Share Pie/Donut Chart */}
                        <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                          <SectionHeader title="Cylinder Share" subtitle="Distribution by Type" icon={PieChartIcon} />
                          <div className="h-[200px] w-full flex items-center justify-center mt-2 relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={reportData.usage.byType}
                                  dataKey="count"
                                  nameKey="type"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={3}
                                >
                                  {reportData.usage.byType.map((entry: any, index: number) => {
                                    const colors = ["#00a68a", "#475569", "#3b82f6", "#f59e0b", "#ef4444"]
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  })}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Custom Legend */}
                          <div className="mt-4 space-y-1.5 border-t border-slate-50 pt-3">
                            {reportData.usage.byType.map((entry: any, index: number) => {
                              const colors = ["#00a68a", "#475569", "#3b82f6", "#f59e0b", "#ef4444"]
                              const color = colors[index % colors.length]
                              return (
                                <div key={entry.type} className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <span>{entry.type}</span>
                                  </div>
                                  <span className="font-mono text-slate-900 tabular-nums">
                                    {entry.count} Tanks ({entry.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Ward Consumption Ranking List */}
                        <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                          <SectionHeader title="Ward Consumption Rankings" subtitle="Legible Department Issue list" icon={Landmark} />
                          <div className="mt-4 space-y-4">
                            {reportData.usage.byDepartment.slice(0, 6).map((dept: any, index: number) => {
                              // Compute percentage relative to the top department
                              const maxVal = reportData.usage.byDepartment[0]?.count || 1
                              const percent = (dept.count / maxVal) * 100
                              
                              return (
                                <div key={dept.department} className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                    <span className="truncate pr-4">{dept.department}</span>
                                    <span className="font-mono text-slate-900 tabular-nums shrink-0">{dept.count} Tanks</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#00a68a] rounded-full transition-all duration-500" 
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: DELIVERY & RECEPTION ─────────────────────────────── */}
                {activeTab === 'delivery' && (
                  <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard label="Total Deliveries" value={reportData.deliveries.total} icon={Download} color="teal" />
                      <KpiCard label="Average Order Cost" value={reportData.deliveries.avgDeliveryValue} prefix="RM " icon={Landmark} color="teal" />
                      <KpiCard label="Total Reception Value" value={reportData.summary.totalExpenses} prefix="RM " icon={History} color="rose" />
                      <KpiCard label="Pending Invoices" value={4} icon={AlertTriangle} color="amber" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Deliveries Count + Value composed chart */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                        <SectionHeader title="Monthly Refill Quantities & Expenditure" subtitle="Supplier Intake" icon={BarChart3} />
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={reportData.deliveries.monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                              <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} tickFormatter={val => `${val} DOs`} />
                              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} tickFormatter={val => `RM ${val >= 1000 ? (val/1000)+'K' : val}`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 9.5, fontWeight: 'semibold', paddingTop: 10 }} />
                              <Bar yAxisId="left" name="Delivery Count" dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} barSize={14} />
                              <Line yAxisId="right" name="Refill Amount (Value)" dataKey="amount" stroke="#00a68a" strokeWidth={2.5} dot={{ r: 3.5, stroke: '#00a68a', strokeWidth: 1.5, fill: '#fff' }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Donut: Deliveries by status */}
                      <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                          <SectionHeader title="Receptions by Status" subtitle="Fulfillment States" icon={PieChartIcon} />
                        </div>
                        <div className="h-[200px] w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip content={<CustomTooltip />} />
                              <Pie
                                data={reportData.deliveries.byStatus}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="count"
                                nameKey="status"
                              >
                                {reportData.deliveries.byStatus.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="space-y-1.5 mt-4 text-[10px] font-bold text-slate-650">
                          {reportData.deliveries.byStatus.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                <span className="text-slate-600 font-semibold">{s.status}</span>
                              </div>
                              <span className="font-mono text-slate-800 font-bold">{s.count} Receptions</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Deliveries list */}
                    <div className="bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                      <div className="p-5.5 border-b border-slate-100">
                        <SectionHeader title="Recent Deliveries & Receptions" subtitle="Refill Logs" icon={History} />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="px-6 py-3.5">Delivery Order (DO)</th>
                              <th className="px-6 py-3.5">Reception Date</th>
                              <th className="px-6 py-3.5">Items Count</th>
                              <th className="px-6 py-3.5">Fulfillment Status</th>
                              <th className="px-6 py-3.5 text-right">Value (RM)</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-semibold text-slate-650 divide-y divide-slate-100">
                            {reportData.deliveries.recentDeliveries.map(d => (
                              <tr key={d.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-slate-800">{d.delivery_order_no}</td>
                                <td className="px-6 py-3.5 text-slate-500">{new Date(d.reception_date).toLocaleDateString()}</td>
                                <td className="px-6 py-3.5 text-slate-500 font-mono">{d.items_count} Size types</td>
                                <td className="px-6 py-3.5">
                                  <span className={cn(
                                    "inline-flex items-center gap-1.5 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                    d.status === 'completed'
                                      ? "bg-[#e6f7f4] text-[#00a68a] border border-[#00a68a]/10"
                                      : "bg-amber-50 text-amber-600 border border-amber-100/40"
                                  )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", d.status === 'completed' ? "bg-[#00a68a]" : "bg-amber-500")} />
                                    {d.status}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-800">RM {d.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 5: INVENTORY STATUS ───────────────────────────────── */}
                {activeTab === 'inventory' && (
                  <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {reportData.inventory.byStatus.map((item, idx) => (
                        <KpiCard
                          key={idx}
                          label={`${item.status} Cylinders`}
                          value={item.count}
                          icon={Boxes}
                          color={item.status.includes('Full') ? 'emerald' : item.status.includes('Use') ? 'indigo' : item.status.includes('Empty') ? 'rose' : 'amber'}
                          delay={idx * 0.05}
                        />
                      ))}
                      <KpiCard label="QR Tagged Rate" value={reportData.inventory.qrTaggedPercentage} suffix="%" icon={CheckCircle2} color="teal" decimals={1} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Stacked bar: status breakdown by type */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                        <SectionHeader title="Inventory Breakdown by Size Code & Status" subtitle="Total Storage Stock" icon={BarChart3} />
                        <div className="h-[300px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.inventory.byType} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                              <XAxis dataKey="type" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 9.5, fontWeight: 'semibold', paddingTop: 10 }} />
                              <Bar name="Full" dataKey="full" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                              <Bar name="In Use" dataKey="inUse" stackId="a" fill="#00a68a" radius={[0, 0, 0, 0]} />
                              <Bar name="Empty" dataKey="empty" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                              <Bar name="Maintenance" dataKey="maintenance" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Donut: QR tagged vs untagged */}
                      <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                          <SectionHeader title="QR Tag Tracking Status" subtitle="Audits Compliance" icon={PieChartIcon} />
                        </div>
                        <div className="h-[200px] w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip content={<CustomTooltip />} />
                              <Pie
                                data={[
                                  { name: 'QR Tagged', value: reportData.inventory.qrTaggedPercentage },
                                  { name: 'Untagged / Legacy', value: 100 - reportData.inventory.qrTaggedPercentage }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                <Cell fill="#00a68a" />
                                <Cell fill="#f1f5f9" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{reportData.inventory.qrTaggedPercentage.toFixed(0)}%</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tagged Rate</span>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4 text-[10px] font-bold text-slate-650">
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span>Tagged QR Code</span>
                            <span className="font-mono text-slate-800 font-bold">{Math.round(reportData.summary.totalCylinders * (reportData.inventory.qrTaggedPercentage/100))} Tanks</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span>Untagged / Legacy Tanks</span>
                            <span className="font-mono text-slate-800 font-bold">{reportData.summary.totalCylinders - Math.round(reportData.summary.totalCylinders * (reportData.inventory.qrTaggedPercentage/100))} Tanks</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Department Allocation list */}
                    <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                      <SectionHeader title="Cylinder Allocation by Ward / Location" subtitle="Current Stock Deployment" icon={Landmark} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                        {reportData.inventory.departmentDistribution.map((d, idx) => {
                          return (
                            <div key={idx} className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-all duration-200">
                              <span className="text-xs font-semibold text-slate-700 truncate mr-2">{d.department}</span>
                              <span className="text-[11px] font-bold text-slate-850 font-mono bg-white px-2 py-0.5 rounded border border-slate-200/40 shadow-sm shrink-0">{d.count} Tanks</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 6: FORECASTING ─────────────────────────────────────── */}
                {activeTab === 'forecasting' && (
                  <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <KpiCard label="Runway Remaining" value={reportData.forecast.budgetRunway.monthsRemaining} suffix=" Months" icon={TrendingUp} color="amber" decimals={1} />
                      <KpiCard label="Next Month Total Projection" value={reportData.forecast.next3Months[0].predicted} suffix=" Cyls" icon={Activity} color="teal" />
                      <KpiCard label="Monthly Consumption Burn" value={reportData.forecast.budgetRunway.burnRate} prefix="RM " icon={Landmark} color="rose" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Forecasting 3 Months area chart with upper and lower bands */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                        <SectionHeader title="3-Month Consumption Forecast (Linear Regression)" subtitle="Oxygen Consumption Forecasting" icon={TrendingUp} />
                        
                        <div className="mb-4 mt-4 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-100/40 rounded-lg text-[10px] font-semibold text-amber-700">
                          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>Predictions are calculated via linear regression with confidence bands at ±15% forecasting threshold.</span>
                        </div>

                        <div className="h-[280px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportData.forecast.next3Months} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00a68a" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#00a68a" stopOpacity={0.005} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                              <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area name="Upper Confidence Band" dataKey="upper" stroke="none" fill="url(#forecastGlow)" />
                              <Area name="Predicted Demand" dataKey="predicted" stroke="#00a68a" strokeWidth={2.5} fill="none" dot={{ r: 3.5, stroke: '#00a68a', strokeWidth: 1.5, fill: '#fff' }} />
                              <Area name="Lower Confidence Band" dataKey="lower" stroke="none" fill="none" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Forecast table per type */}
                      <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                          <SectionHeader title="Next Month Predictions by Size" subtitle="Cylinder Categories" icon={Boxes} />
                        </div>
                        <div className="space-y-3 mt-4">
                          {reportData.forecast.nextMonth.map((f, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all duration-200 flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{f.type}</span>
                                <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">Model Confidence: {f.confidence}%</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-[#00a68a] font-mono">{f.predicted}</span>
                                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">predicted tanks</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Seasonal Trend overlay over 12 months */}
                    <div className="bg-white border border-slate-200/50 rounded-xl p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
                      <SectionHeader title="Annual Seasonal Consumption Average" subtitle="Seasonality Pattern" icon={Activity} />
                      <div className="h-[220px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={reportData.forecast.seasonalPattern} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="seasonalGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00a68a" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="#00a68a" stopOpacity={0.005} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area name="Average Seasonal Usage" dataKey="avgUsage" stroke="#00a68a" strokeWidth={2.5} fill="url(#seasonalGlow)" dot={{ r: 3, stroke: '#00a68a', strokeWidth: 1.5, fill: '#fff' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 7: DETAILED REGISTER DATA ──────────────────────────── */}
                {activeTab === 'detailed' && (
                  <div className="space-y-6">
                    {/* Filters header panel */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          placeholder="Search serial number, location, ward..."
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 bg-slate-50/40 hover:bg-slate-50 transition-all placeholder:text-slate-400 text-slate-800"
                        />
                      </div>

                      {/* Dropdowns */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filters:</span>
                        </div>

                        {/* Status Filter */}
                        <select
                          value={statusFilter}
                          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 hover:border-slate-300 transition-all text-slate-700 cursor-pointer"
                        >
                          <option value="all">All Statuses</option>
                          <option value="full">Full</option>
                          <option value="empty">Empty</option>
                          <option value="in_use">In Use</option>
                          <option value="maintenance">Maintenance</option>
                        </select>

                        {/* Size Filter */}
                        <select
                          value={sizeFilter}
                          onChange={e => { setSizeFilter(e.target.value); setCurrentPage(1); }}
                          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 hover:border-slate-300 transition-all text-slate-700 cursor-pointer"
                        >
                          <option value="all">All Sizes</option>
                          <option value="Size D">Size D</option>
                          <option value="Size F">Size F</option>
                          <option value="Size G">Size G</option>
                          <option value="Size K">Size K</option>
                        </select>

                        {/* Count label */}
                        <span className="text-xs bg-slate-50 text-slate-500 font-semibold px-3 py-2 rounded-lg border border-slate-200/60 tabular-nums">
                          {filteredCylinders.length} matched
                        </span>
                      </div>
                    </div>

                    {/* Cylinder Register Table */}
                    <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/60 bg-slate-50/60 text-xs font-semibold text-slate-500">
                              <th className="px-6 py-3.5">Cylinder Serial</th>
                              <th className="px-6 py-3.5">Size Code</th>
                              <th className="px-6 py-3.5">Full Description</th>
                              <th className="px-6 py-3.5">Current Location</th>
                              <th className="px-6 py-3.5">Assigned Ward</th>
                              <th className="px-6 py-3.5">QR Tracking</th>
                              <th className="px-6 py-3.5">Fulfillment</th>
                              <th className="px-6 py-3.5 text-right">Last Movement</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-normal text-slate-600 divide-y divide-slate-100">
                            {paginatedCylinders.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                                  No cylinders match your search criteria. Try modifying your filter values.
                                </td>
                              </tr>
                            ) : (
                              paginatedCylinders.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="px-6 py-3 font-mono font-semibold text-slate-900">{c.serial_number}</td>
                                  <td className="px-6 py-3 font-mono text-slate-500">{c.size_code}</td>
                                  <td className="px-6 py-3 text-slate-700 font-medium">{c.type_name}</td>
                                  <td className="px-6 py-3 text-slate-600">{c.location_name}</td>
                                  <td className="px-6 py-3 text-slate-600">{c.department_name || '—'}</td>
                                  <td className="px-6 py-3">
                                    {c.qr_code ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-[#00a68a] font-medium bg-[#e6f7f4] border border-[#00a68a]/10 px-2 py-0.5 rounded">
                                        <CheckCircle2 className="w-3 h-3 text-[#00a68a]" />
                                        QR Tagged
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-200/40 px-2 py-0.5 rounded">
                                        Legacy
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3">
                                    {(() => {
                                      const labelMap: Record<string, string> = {
                                        full: 'Full',
                                        empty: 'Empty',
                                        in_use: 'In Use',
                                        maintenance: 'Maintenance'
                                      };
                                      const statusLabel = labelMap[c.status] || c.status;
                                      const statusColor = getStatusColor(statusLabel);
                                      return (
                                        <span className={cn(
                                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
                                          c.status === 'full' && "bg-emerald-50/40 text-emerald-700 border-emerald-100/60",
                                          c.status === 'empty' && "bg-rose-50/40 text-rose-700 border-rose-100/60",
                                          c.status === 'in_use' && "bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/10",
                                          c.status === 'maintenance' && "bg-amber-50/40 text-amber-700 border-amber-100/60"
                                        )}>
                                          <span className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: statusColor }} />
                                          {statusLabel}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-6 py-3 text-right text-slate-500 font-mono tabular-nums">
                                    {c.last_movement_date ? new Date(c.last_movement_date).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="p-4 bg-slate-50/40 border-t border-slate-100/80 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">
                            Showing Page <span className="text-slate-800 font-semibold font-mono tabular-nums">{currentPage}</span> of <span className="text-slate-800 font-semibold font-mono tabular-nums">{totalPages}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-3.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default CylinderReportPage

