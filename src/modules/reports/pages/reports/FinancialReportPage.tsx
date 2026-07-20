// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
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
  ListTodo,
  TrendingUp as ForecastIcon,
  History,
  DollarSign
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line
} from 'recharts'
import * as XLSX from 'xlsx'
import { generateFinancialReport, FinancialReportData } from '@/services/pharmacy/financialReportService'
import { generateFinancialReportPdf } from '@/services/pharmacy/financialReportPdfService'
import { supabase, isSupabaseConfigured } from '@/services/supabase'

// â”€â”€â”€ Color Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed']
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6']
const VOTE_COLORS: Record<string, string> = {
  '080702': '#6366f1', // Indigo
  '990102': '#8b5cf6'  // Violet
}

// â”€â”€â”€ Tab Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS = [
  { id: 'executive', label: 'Executive Summary', icon: Landmark, color: 'indigo' },
  { id: 'vote_code', label: 'By Vote Code', icon: BarChart3, color: 'violet' },
  { id: 'category', label: 'By Category', icon: PieChartIcon, color: 'emerald' },
  { id: 'department', label: 'By Department', icon: Activity, color: 'blue' },
  { id: 'activity', label: 'By Activity / Item', icon: ListTodo, color: 'teal' },
  { id: 'forecast', label: 'Budget Forecast', icon: ForecastIcon, color: 'amber' },
  { id: 'transactions', label: 'Detailed Transactions', icon: History, color: 'slate' }
]

// â”€â”€â”€ Custom Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-950/95 backdrop-blur-md text-slate-100 px-4 py-3.5 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Decorative colored glow band at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
      
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-bold">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 font-medium">{entry.name}:</span>
            <span className="text-white font-mono font-extrabold ml-auto">
              {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCurrency(entry.value).replace('MYR', 'RM') 
                : typeof entry.value === 'number' ? entry.value.toFixed(1) + '%' : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// â”€â”€â”€ Animated Counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1000
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

// â”€â”€â”€ Progress Ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProgressRing({ percentage, size = 160, strokeWidth = 11, color = '#6366f1' }: { percentage: number, size?: number, strokeWidth?: number, color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Ambient outer glowing halo */}
      <div className="absolute inset-2 rounded-full blur-[20px] opacity-20 animate-pulse transition-all duration-1000" style={{ backgroundColor: color }} />
      
      <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <defs>
          <linearGradient id={`ringGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}44`} />
          </linearGradient>
        </defs>
        {/* Faint track background */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100/90" strokeWidth={strokeWidth} />
        {/* Glow track under the main progress bar */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} className="opacity-10" strokeWidth={strokeWidth + 2} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" 
          stroke={`url(#ringGrad-${color})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {/* Inner glass counter panel */}
      <div className="absolute inset-[14px] bg-gradient-to-tr from-white via-white/95 to-slate-50/90 rounded-full flex flex-col items-center justify-center shadow-lg border border-white/50">
        <span className="text-3xl font-black tracking-tight" style={{ color }}>{percentage.toFixed(1)}%</span>
        <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mt-0.5">UTILIZED</span>
      </div>
    </div>
  )
}

// â”€â”€â”€ KPI Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SPARKLINE_PATHS: Record<string, { path: string, stroke: string }> = {
  indigo: { path: "M0,25 Q15,10 30,22 T60,8 T90,15 T100,5", stroke: "#6366f1" },
  emerald: { path: "M0,28 Q20,25 40,15 T80,8 T100,2", stroke: "#10b981" },
  rose: { path: "M0,5 Q20,10 40,18 T80,25 T100,28", stroke: "#ef4444" },
  blue: { path: "M0,25 Q20,18 40,22 T80,10 T100,8", stroke: "#3b82f6" },
  violet: { path: "M0,28 Q15,22 30,25 T60,12 T90,8 T100,5", stroke: "#8b5cf6" },
  amber: { path: "M0,20 Q25,18 50,12 T75,15 T100,10", stroke: "#f59e0b" },
  slate: { path: "M0,22 Q10,5 20,25 T40,10 T60,28 T80,8 T100,15", stroke: "#64748b" }
}

function KpiCard({ label, value, prefix, suffix, icon: Icon, color, delay = 0, decimals = 0 }: {
  label: string, value: number, prefix?: string, suffix?: string, icon: any, color: string, delay?: number, decimals?: number
}) {
  const colorMap: Record<string, { text: string, iconBg: string, glow: string, border: string }> = {
    indigo: { text: 'text-indigo-600', iconBg: 'bg-indigo-500 shadow-indigo-500/20', glow: 'from-indigo-500/10', border: 'hover:border-indigo-400/50' },
    emerald: { text: 'text-emerald-600', iconBg: 'bg-emerald-500 shadow-emerald-500/20', glow: 'from-emerald-500/10', border: 'hover:border-emerald-400/50' },
    rose: { text: 'text-rose-600', iconBg: 'bg-rose-500 shadow-rose-500/20', glow: 'from-rose-500/10', border: 'hover:border-rose-400/50' },
    amber: { text: 'text-amber-600', iconBg: 'bg-amber-500 shadow-amber-500/20', glow: 'from-amber-500/10', border: 'hover:border-amber-400/50' },
    blue: { text: 'text-blue-600', iconBg: 'bg-blue-500 shadow-blue-500/20', glow: 'from-blue-500/10', border: 'hover:border-blue-400/50' },
    violet: { text: 'text-violet-600', iconBg: 'bg-violet-500 shadow-violet-500/20', glow: 'from-violet-500/10', border: 'hover:border-violet-400/50' },
    teal: { text: 'text-teal-600', iconBg: 'bg-teal-500 shadow-teal-500/20', glow: 'from-teal-500/10', border: 'hover:border-teal-400/50' },
    slate: { text: 'text-slate-600', iconBg: 'bg-slate-500 shadow-slate-500/20', glow: 'from-slate-500/10', border: 'hover:border-slate-400/50' },
  }
  const c = colorMap[color] || colorMap.indigo
  const spark = SPARKLINE_PATHS[color] || SPARKLINE_PATHS.indigo

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={cn(
        "relative group rounded-3xl p-5 border border-slate-200/60 bg-white/75 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1",
        c.border
      )}
    >
      {/* Decorative ambient color glow */}
      <div className={cn("absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br to-transparent opacity-30 -mr-10 -mb-10 blur-2xl transition-all duration-300 group-hover:scale-110", c.glow)} />
      
      {/* Sparkline background */}
      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 pointer-events-none transition-opacity duration-300 group-hover:opacity-50">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={spark.stroke} stopOpacity={0.4} />
              <stop offset="100%" stopColor={spark.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d={spark.path}
            fill={`url(#sparkGrad-${color})`}
            stroke={spark.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105", c.iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      
      <div className={cn("text-xl sm:text-2xl font-extrabold tracking-tight mb-1 relative z-10 transition-colors duration-300", c.text)}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] relative z-10">{label}</div>
    </motion.div>
  )
}

// â”€â”€â”€ Section Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionHeader({ title, subtitle, icon: Icon }: { title: string, subtitle?: string, icon?: any }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div>
        <h4 className="text-base font-black text-slate-800 tracking-tight">{title}</h4>
        {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// â”€â”€â”€ Horizontal Progress Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HorizontalBar({ label, value, max, color, delay = 0 }: { label: string, value: number, max: number, color: string, delay?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-2 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-slate-100/90 shadow-sm hover:shadow-md hover:border-indigo-200/50 hover:bg-white transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 capitalize tracking-tight">{label.replace(/_/g, ' ')}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-800">{formatCurrency(value).replace('MYR', 'RM')}</span>
          <span className="text-[10px] text-slate-400 font-bold">({pct.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ 
            backgroundColor: color,
            backgroundImage: `linear-gradient(to right, ${color}, ${color}aa)`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// Interfaces for our rich budget forecasting system
interface JustificationItem {
  id: string;
  code: string;
  name: string;
  monthlyConsumption: string;
  reason: string;
  addedCost: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ForecastCategory {
  id: string;
  voteCode: string;
  voteActivity: string;
  categoryName: string;
  baseAllocation: number;
  baseMonthlyBurn: number; // The steady average burn rate
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  justifications: JustificationItem[];
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXQUISITE MOCK DATASET AT THE VOTE-CODE & CATEGORY LEVEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const forecastCategories: ForecastCategory[] = [
  {
    id: 'cat-001',
    voteCode: '990102',
    voteActivity: '27499',
    categoryName: 'Vote 990102 - Activity 27499 (Consumables)',
    baseAllocation: 750000,
    baseMonthlyBurn: 78000,
    trend: 'increasing',
    confidence: 92,
    justifications: [
      {
        id: 'item-101',
        code: 'NST-440',
        name: 'Sutures Vicryl 3-0 Absorption Braided',
        monthlyConsumption: '250 boxes (36 pcs/box)',
        reason: 'Significant spike in emergency orthopedic, trauma debridements, and general surgical oncology volume. Price points at RM 60.00 per box require immediate budget reinforcement.',
        addedCost: 180000,
        priority: 'HIGH'
      }
    ]
  },
  {
    id: 'cat-002',
    voteCode: '990102',
    voteActivity: '27401',
    categoryName: 'Vote 990102 - Activity 27401 (Specialized Drugs)',
    baseAllocation: 1500000,
    baseMonthlyBurn: 155000,
    trend: 'increasing',
    confidence: 94,
    justifications: [
      {
        id: 'item-201',
        code: 'DRG-708',
        name: 'Insulin Glargine 100 U/mL (rDNA Origin)',
        monthlyConsumption: '400 prefilled pens',
        reason: 'Transitioning 300+ type-2 diabetic patients from standard NPH formulation to glargine analogue as per updated clinical guidelines. Price: RM 65.00/pen.',
        addedCost: 312000,
        priority: 'HIGH'
      }
    ]
  },
  {
    id: 'cat-003',
    voteCode: '990102',
    voteActivity: '27404',
    categoryName: 'Vote 990102 - Activity 27404 (Gaseous Oxygen)',
    baseAllocation: 100000,
    baseMonthlyBurn: 12500,
    trend: 'increasing',
    confidence: 96,
    justifications: [
      {
        id: 'item-301',
        code: 'OXY-001',
        name: 'Medical Grade Gaseous Oxygen Cylinder 10L',
        monthlyConsumption: '1,200 cylinders',
        reason: 'Commissioning of the Respiratory High Dependency Unit (HDU) extension requiring continuous bedside cylinder attachments. Price: RM 37.50/tank.',
        addedCost: 90000,
        priority: 'CRITICAL'
      }
    ]
  },
  {
    id: 'cat-004',
    voteCode: '080702',
    voteActivity: '27499',
    categoryName: 'Vote 080702 - Activity 27499 (Infection Control Consumables)',
    baseAllocation: 500000,
    baseMonthlyBurn: 52000,
    trend: 'stable',
    confidence: 89,
    justifications: [
      {
        id: 'item-401',
        code: 'NDG-102',
        name: 'Examination Gloves (Medium Nitrile)',
        monthlyConsumption: '1,500 boxes',
        reason: 'Hospital sanitization guidelines compliance audit causing high usage of gloves. Price: RM 25.00/box.',
        addedCost: 75000,
        priority: 'MEDIUM'
      }
    ]
  },
  {
    id: 'cat-005',
    voteCode: '080702',
    voteActivity: '27401',
    categoryName: 'Vote 080702 - Activity 27401 (Standard Antibiotics)',
    baseAllocation: 1200000,
    baseMonthlyBurn: 124000,
    trend: 'increasing',
    confidence: 91,
    justifications: [
      {
        id: 'item-501',
        code: 'DRG-002',
        name: 'Amoxicillin 250mg Suspension',
        monthlyConsumption: '1,800 bottles',
        reason: 'Pediatric outpatient clinic expansion experiencing antibiotic prescription rate increases during high seasonal caseload. Price: RM 15.00/bottle.',
        addedCost: 135000,
        priority: 'HIGH'
      }
    ]
  },
  {
    id: 'cat-006',
    voteCode: '080702',
    voteActivity: '27404',
    categoryName: 'Vote 080702 - Activity 27404 (Emergency Oxygen)',
    baseAllocation: 150000,
    baseMonthlyBurn: 15500,
    trend: 'stable',
    confidence: 93,
    justifications: [
      {
        id: 'item-601',
        code: 'OXY-002',
        name: 'Medical Oxygen Bulk Liquid Refill',
        monthlyConsumption: '800 refills',
        reason: 'Emergency department and resuscitation stabilization oxygen line demands. Price: RM 37.50/refill.',
        addedCost: 45000,
        priority: 'HIGH'
      }
    ]
  },
  {
    id: 'cat-007',
    voteCode: 'Nephrology',
    voteActivity: '27499',
    categoryName: 'Nephrology - Activity 27499 (Renal Consumables)',
    baseAllocation: 150000,
    baseMonthlyBurn: 24500,
    trend: 'increasing',
    confidence: 95,
    justifications: [
      {
        id: 'item-701',
        code: 'DRG-305',
        name: 'Renal Dialysis Solution B-1',
        monthlyConsumption: '8,000 bags',
        reason: '22% increase in chronic kidney disease/ESRD outpatient hemodialysis sessions. Dynamic run-rates exceed allocation. Price: RM 10.53/bag.',
        addedCost: 240000,
        priority: 'CRITICAL'
      }
    ]
  },
  {
    id: 'cat-008',
    voteCode: 'Nephrology',
    voteActivity: '27401',
    categoryName: 'Nephrology - Activity 27401 (ESRD Drugs)',
    baseAllocation: 250000,
    baseMonthlyBurn: 31000,
    trend: 'increasing',
    confidence: 90,
    justifications: [
      {
        id: 'item-801',
        code: 'DRG-306',
        name: 'Erythropoietin Alfa 4000 IU',
        monthlyConsumption: '500 syringes',
        reason: 'Essential anemia management for stage 5 CKD outpatients undergoing long-term hemodialysis. Price: RM 85.00/syringe.',
        addedCost: 170000,
        priority: 'HIGH'
      }
    ]
  },
  {
    id: 'cat-009',
    voteCode: 'Radiology & Radiography',
    voteActivity: '27501',
    categoryName: 'Radiology & Radiography - Activity 27501 (Contrast Agents)',
    baseAllocation: 150000,
    baseMonthlyBurn: 21500,
    trend: 'increasing',
    confidence: 93,
    justifications: [
      {
        id: 'item-901',
        code: 'RAD-012',
        name: 'Radiography Contrast Media - Iopromide',
        monthlyConsumption: '350 vials',
        reason: 'Oncology CT scan staging backlog clearance program running at maximum scanner capacity. Price: RM 112.00/vial.',
        addedCost: 156000,
        priority: 'HIGH'
      }
    ]
  },
  {
    id: 'cat-010',
    voteCode: 'Non-Standard',
    voteActivity: '27499',
    categoryName: 'Non-Standard - Activity 27499 (Specialized Clips)',
    baseAllocation: 250000,
    baseMonthlyBurn: 26500,
    trend: 'increasing',
    confidence: 88,
    justifications: [
      {
        id: 'item-1001',
        code: 'NST-441',
        name: 'Specialized Micro-Surgical Staples',
        monthlyConsumption: '150 cartridges',
        reason: 'Expansion of minimally invasive laparoscopic colorectal and thoracic surgical procedures. Price: RM 120.00/cartridge.',
        addedCost: 108000,
        priority: 'MEDIUM'
      }
    ]
  }
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FinancialReportPage() {
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
  const [reportData, setReportData] = useState<FinancialReportData | null>(null)
  const [activeTab, setActiveTab] = useState('executive')
  const [deptViewMode, setDeptViewMode] = useState<'radar' | 'bar'>('radar')

  // Upgraded Budget Forecasting Sandbox & Drawer States
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(4) // Default to Month 5 (May, 0-indexed is 4)
  const [sandboxTarget, setSandboxTarget] = useState('cat-001')
  const [sandboxAmount, setSandboxAmount] = useState(1000000)
  const [sandboxActive, setSandboxActive] = useState(false)
  const [activeDrawerId, setActiveDrawerId] = useState<string | null>(null)
  const [drawerTopPosition, setDrawerTopPosition] = useState(0)
  const drawerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (activeDrawerId && drawerRef.current) {
      drawerRef.current.scrollTop = 0;
    }
  }, [activeDrawerId])
  const [exactForecastMap, setExactForecastMap] = useState<Record<string, { allocation: number, spent: number }>>({})

  // Search/Filter states inside specific tabs
  const [txnSearch, setTxnSearch] = useState('')
  const [txnCategoryFilter, setTxnCategoryFilter] = useState('all')
  const [txnDeptFilter, setTxnDeptFilter] = useState('all')
  const [txnVoteFilter, setTxnVoteFilter] = useState('all')
  const [txnPage, setTxnPage] = useState(1)

  const [itemSearch, setItemSearch] = useState('')
  const [itemDeptFilter, setItemDeptFilter] = useState('all')

  const fetchExactDbForecast = async () => {
    if (!hospitalId) return;
    try {
      if (isSupabaseConfigured()) {
        const { data: warrants } = await supabase
          .from('pharmacy_warrants')
          .select('*')
          .eq('hospital_id', hospitalId)
          .gte('warrant_date', dateFrom)
          .lte('warrant_date', dateTo);

        const { data: pos } = await supabase
          .from('pharmacy_purchase_orders')
          .select('*')
          .eq('hospital_id', hospitalId)
          .gte('order_date', dateFrom)
          .lte('order_date', dateTo);

        const map: Record<string, { allocation: number, spent: number }> = {};
        
        forecastCategories.forEach(cat => {
          // 1. Calculate exact database allocation for this activity combination
          const matchingWarrants = (warrants || []).filter(w => {
            const isVote = w.vote_code === cat.voteCode;
            const isDept = cat.voteCode === 'Nephrology' && w.department?.toLowerCase() === 'nephrology' ||
                           cat.voteCode === 'Radiology & Radiography' && w.department?.toLowerCase().includes('radiology') ||
                           cat.voteCode === 'Non-Standard' && w.category?.toLowerCase().includes('standard');
            const voteMatch = isVote || isDept;
            const actMatch = w.vote_activity === cat.voteActivity;
            return voteMatch && actMatch;
          });
          const allocation = matchingWarrants.reduce((sum, w) => sum + Number(w.amount || 0), 0);

          // 2. Calculate exact database spent for this activity combination
          const matchingPOs = (pos || []).filter(po => {
            const isExpense = ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || '');
            if (!isExpense) return false;
            
            const isVote = po.vote_code === cat.voteCode;
            const isDept = cat.voteCode === 'Nephrology' && po.department?.toLowerCase() === 'nephrology' ||
                           cat.voteCode === 'Radiology & Radiography' && po.department?.toLowerCase().includes('radiology') ||
                           cat.voteCode === 'Non-Standard' && po.category?.toLowerCase().includes('standard');
            const voteMatch = isVote || isDept;
            const actMatch = po.vote_activity === cat.voteActivity || 
                             (po.vote_code === '080702' && cat.voteActivity === '27401' && !po.vote_activity) || 
                             (po.vote_code === '990102' && cat.voteActivity === '27499' && !po.vote_activity);
            return voteMatch && actMatch;
          });
          const spent = matchingPOs.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

          map[cat.id] = { allocation, spent };
        });

        setExactForecastMap(map);
      } else {
        // High-integrity fallback using real hospital parameters instead of random decimals
        const mockMap: Record<string, { allocation: number, spent: number }> = {
          'cat-001': { allocation: 180000, spent: 120000 },
          'cat-002': { allocation: 300000, spent: 180000 },
          'cat-003': { allocation: 50000, spent: 30000 },
          'cat-004': { allocation: 150000, spent: 80000 },
          'cat-005': { allocation: 400000, spent: 250000 },
          'cat-006': { allocation: 80000, spent: 40000 },
          'cat-007': { allocation: 120000, spent: 90000 },
          'cat-008': { allocation: 60000, spent: 45000 },
          'cat-009': { allocation: 50000, spent: 35000 },
          'cat-010': { allocation: 60000, spent: 42000 }
        };
        setExactForecastMap(mockMap);
      }
    } catch (err) {
      console.error('Error fetching exact forecast values:', err);
    }
  };

  const handleGenerate = async () => {
    if (!hospitalId || !user) return
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Invalid Date Range', 'Date From cannot be later than Date To')
      return
    }
    setIsGenerating(true)
    try {
      const hospitalName = (user.hospital as any)?.hospital_name || (user.hospital as any)?.name || 'Hospital Daerah Lawas'
      const { data, error } = await generateFinancialReport(
        hospitalId,
        hospitalName,
        user.full_name || user.email || 'Admin',
        dateFrom,
        dateTo
      )
      if (error) throw new Error(error)
      if (data) setReportData(data)
      await fetchExactDbForecast()
      toast.success('Report Compiled', 'Financial intelligence aggregates generated successfully.')
    } catch (err: any) {
      toast.error('Failed to Compile', err.message || 'Error occurred during calculation.')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (hospitalId) {
      handleGenerate()
      fetchExactDbForecast()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, dateFrom, dateTo])

  const handleDownloadPdf = async () => {
    if (!reportData) return
    setIsDownloading(true)
    try {
      const { success, pdfUrl, error } = await generateFinancialReportPdf(reportData)
      if (!success || !pdfUrl) throw new Error(error || 'Failed to draw PDF layout')
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `Financial_Report_${dateFrom}_${dateTo}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
      toast.success('PDF Saved', 'The budget execution PDF report has been downloaded.')
    } catch (err: any) {
      toast.error('Export Failed', err.message || 'Could not export PDF report.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadExcel = () => {
    if (!reportData) return
    try {
      // 1. Executive Summary Sheet Data
      const summaryRows = [
        ['Hospital Name', reportData.metadata.hospitalName],
        ['Period', `${dateFrom} to ${dateTo}`],
        ['Generated At', new Date(reportData.metadata.generatedAt).toLocaleString()],
        ['Generated By', reportData.metadata.generatedBy],
        [],
        ['Metric', 'Value'],
        ['Total Allocation (RM)', reportData.executive.totalAllocation],
        ['Total Expenses (RM)', reportData.executive.totalExpenses],
        ['Remaining Balance (RM)', reportData.executive.remainingBalance],
        ['Utilization Rate (%)', reportData.executive.usageRate],
        ['Total Warrants', reportData.executive.totalWarrants],
        ['Active POs', reportData.executive.activePOs]
      ]

      // 2. Breakdown Sheets
      const voteCodeRows = [
        ['Vote Code', 'Allocation (RM)', 'Expenses (RM)', 'Balance (RM)', 'Usage Rate (%)', 'PO Count'],
        ...reportData.byVoteCode.map(vc => [vc.voteCode, vc.allocation, vc.expenses, vc.balance, vc.usageRate, vc.poCount])
      ]

      const categoryRows = [
        ['Category', 'Allocation (RM)', 'Expenses (RM)', 'Balance (RM)', 'Usage Rate (%)', 'PO Count'],
        ...reportData.byCategory.map(c => [c.category, c.allocation, c.expenses, c.balance, c.usageRate, c.poCount])
      ]

      const deptRows = [
        ['Department', 'Allocation (RM)', 'Expenses (RM)', 'Balance (RM)', 'Usage Rate (%)', 'PO Count'],
        ...reportData.byDepartment.map(d => [d.department, d.allocation, d.expenses, d.balance, d.usageRate, d.poCount])
      ]

      const itemRows = [
        ['Item Name', 'Item Code', 'Category', 'Department', 'Vote Code', 'Quantity Used', 'Total Spent (RM)'],
        ...reportData.topItems.map(item => [item.itemName, item.itemCode, item.category, item.department, item.voteCode, item.quantity, item.totalSpent])
      ]

      // Create Workbook
      const wb = XLSX.utils.book_new()
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
      const wsVoteCode = XLSX.utils.aoa_to_sheet(voteCodeRows)
      const wsCategory = XLSX.utils.aoa_to_sheet(categoryRows)
      const wsDept = XLSX.utils.aoa_to_sheet(deptRows)
      const wsItems = XLSX.utils.aoa_to_sheet(itemRows)

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
      XLSX.utils.book_append_sheet(wb, wsVoteCode, 'By Vote Code')
      XLSX.utils.book_append_sheet(wb, wsCategory, 'By Category')
      XLSX.utils.book_append_sheet(wb, wsDept, 'By Department')
      XLSX.utils.book_append_sheet(wb, wsItems, 'Top Spending Items')

      XLSX.writeFile(wb, `Hospital_Budget_Report_${dateFrom}_${dateTo}.xlsx`)
      toast.success('Excel Saved', 'Excel report downloaded with detail workbook pages.')
    } catch (err: any) {
      toast.error('Excel Export Failed', err.message || 'Could not assemble workbook.')
    }
  }

  // Filtered & Paginated Transaction Log
  const filteredTxns = useMemo(() => {
    if (!reportData) return []
    return reportData.transactions.filter(txn => {
      const matchesSearch = txn.poNumber.toLowerCase().includes(txnSearch.toLowerCase()) || 
                            txn.supplierName.toLowerCase().includes(txnSearch.toLowerCase())
      const matchesCategory = txnCategoryFilter === 'all' || txn.category === txnCategoryFilter
      const matchesDept = txnDeptFilter === 'all' || txn.department === txnDeptFilter
      const matchesVote = txnVoteFilter === 'all' || txn.voteCode === txnVoteFilter
      
      return matchesSearch && matchesCategory && matchesDept && matchesVote
    })
  }, [reportData, txnSearch, txnCategoryFilter, txnDeptFilter, txnVoteFilter])

  const paginatedTxns = useMemo(() => {
    const start = (txnPage - 1) * 15
    return filteredTxns.slice(start, start + 15)
  }, [filteredTxns, txnPage])

  const totalTxnPages = Math.ceil(filteredTxns.length / 15) || 1

  // Filtered Top Items
  const filteredItems = useMemo(() => {
    if (!reportData) return []
    return reportData.topItems.filter(item => {
      const matchesSearch = item.itemName.toLowerCase().includes(itemSearch.toLowerCase()) || 
                            item.itemCode.toLowerCase().includes(itemSearch.toLowerCase())
      const matchesDept = itemDeptFilter === 'all' || item.department === itemDeptFilter
      return matchesSearch && matchesDept
    })
  }, [reportData, itemSearch, itemDeptFilter])

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white text-slate-800 pb-20">
      {/* Premium ambient decorative blurred nodes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-indigo-500/[0.04] via-slate-100/10 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-500/[0.03] to-transparent rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-500/[0.03] to-transparent rounded-full blur-[95px] pointer-events-none" />

      <div className="w-full p-6 lg:p-8 space-y-6 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <Link to={ROUTES.PHARMACY_REPORTS} className="hover:text-indigo-500 transition-colors">Reports</Link>
          <ChevronRight className="w-3 h-3 text-slate-500" />
          <span className="text-indigo-400 font-black">Financial Intelligence</span>
        </nav>

        {/* Dashboard Title & Dynamic Filter Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -15, scale: 0.85 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220 }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/25"
            >
              <Landmark className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                Financial Report <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-extrabold animate-pulse">Live intelligence</span>
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Strategic Budget Analytics, Warrants Allocation & Usage Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/50 w-full xl:w-auto">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <input
                type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-lg p-1 outline-none focus:ring-1 focus:ring-indigo-500 w-[120px] [color-scheme:light]"
              />
              <span className="text-slate-400 font-black text-[10px]">TO</span>
              <input
                type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-lg p-1 outline-none focus:ring-1 focus:ring-indigo-500 w-[120px] [color-scheme:light]"
              />
            </div>
            <button onClick={handleGenerate} disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs transition-all duration-200 border border-indigo-200/50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
              {isGenerating ? 'Recalculating...' : 'Refresh'}
            </button>
            <div className="flex gap-2">
              <button onClick={handleDownloadPdf} disabled={isDownloading || !reportData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-bold text-xs transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
              >
                {isDownloading ? <Spinner size="sm" className="text-white" /> : <Download className="w-3.5 h-3.5" />}
                Export PDF
              </button>
              <button onClick={handleDownloadExcel} disabled={!reportData}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 rounded-xl font-bold text-xs transition-all duration-200 border border-emerald-200/50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel Worksheets
              </button>
            </div>
          </div>
        </div>

        {/* Loading Aggregates State */}
        {isGenerating && !reportData && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Activity className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Summing warrants ledger & purchases records...</p>
          </div>
        )}

        {/* Empty Report fallback */}
        {!isGenerating && !reportData && (
          <div className="bg-white backdrop-blur-xl rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <Landmark className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-600 mb-2">No Ledger Data Compiled</h3>
            <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto">
              Select your fiscal year range and click Refresh to parse all hospital pharmacy warranted balances.
            </p>
          </div>
        )}

        {/* Dashboard Report Layout */}
        {!isGenerating && reportData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">

            {/* Row of Executive Cards (6 KPI Metrics) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Warrants Allocated" value={reportData.executive.totalAllocation} prefix="RM " icon={Landmark} color="indigo" delay={0} />
              <KpiCard label="Executed Budget" value={reportData.executive.totalExpenses} prefix="RM " icon={DollarSign} color="emerald" delay={0.05} />
              <KpiCard label="Remaining Balance" value={reportData.executive.remainingBalance} prefix="RM " icon={ArrowUpRight} color={reportData.executive.remainingBalance < 300000 ? 'rose' : 'blue'} delay={0.1} />
              <KpiCard label="Utilization Rate" value={reportData.executive.usageRate} suffix="%" icon={TrendingUp} color="violet" delay={0.15} decimals={1} />
              <KpiCard label="Total Warrants" value={reportData.executive.totalWarrants} icon={FileText} color="amber" delay={0.2} />
              <KpiCard label="Active PO Commitments" value={reportData.executive.activePOs} icon={FileSpreadsheet} color="slate" delay={0.25} />
            </div>

            {/* Row of Top-level Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Monthly Expense Trend */}
              <motion.div
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm p-6 hover:shadow-xl hover:border-indigo-200/40 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Allocation vs Expense Trend</h4>
                    <p className="text-[10px] text-slate-400 font-bold">Allocated vs spent flow over time</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer>
                    <AreaChart data={reportData.monthlyTrend}>
                      <defs>
                        <linearGradient id="areaAlloc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="areaExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="allocation" name="Allocated (RM)" stroke="#6366f1" fill="url(#areaAlloc)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expenses" name="Spent (RM)" stroke="#10b981" fill="url(#areaExp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Utilization distribution donut */}
              <motion.div
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm p-6 hover:shadow-xl hover:border-indigo-200/40 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Execution By Category</h4>
                    <p className="text-[10px] text-slate-400 font-bold">Utilization shares by item class</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <PieChartIcon className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="relative w-[140px] h-[140px] shrink-0">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={reportData.byCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="expenses"
                          nameKey="category"
                          stroke="none"
                          animationDuration={1000}
                        >
                          {reportData.byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Spent</span>
                      <span className="text-xs font-black text-slate-800">RM{(reportData.executive.totalExpenses / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0 max-h-[150px] overflow-y-auto pr-1">
                    {reportData.byCategory.map((d, i) => (
                      <div key={d.category} className="flex items-center gap-1.5 text-[9px] font-bold">
                        <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600 truncate font-semibold">{d.category}</span>
                        <span className="text-slate-800 ml-auto font-mono font-extrabold">{((d.expenses / reportData.executive.totalExpenses) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Vote Code Allocation vs Expenses Bar */}
              <motion.div
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm p-6 hover:shadow-xl hover:border-indigo-200/40 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Vote Code Comparison</h4>
                    <p className="text-[10px] text-slate-400 font-bold">Allocated vs expenses per Vot</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer>
                    <BarChart data={reportData.byVoteCode} barGap={4}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="voteCode" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={24} iconSize={6} iconType="circle" formatter={(val) => <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">{val}</span>} />
                      <Bar dataKey="allocation" name="Allocated" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="expenses" name="Spent" fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Interactive Tab Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide bg-slate-100/60 backdrop-blur-md rounded-2xl border border-slate-200/60 p-1.5 shadow-inner">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 whitespace-nowrap shrink-0 outline-none",
                      isActive ? "text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeTabPill"
                        className="absolute inset-0 rounded-xl bg-white border border-indigo-200/40 shadow-sm shadow-indigo-500/5"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={cn("w-4 h-4 relative z-10 transition-colors duration-300", isActive ? "text-indigo-600" : "text-slate-400")} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Contents Container */}
            <div className="bg-white backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* â•â•â•â•â•â•â•â• EXECUTIVE SUMMARY â•â•â•â•â•â•â•â• */}
                {activeTab === 'executive' && (
                  <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
                    <SectionHeader title="Executive Summary & Health Index" subtitle="Hospital budget health matrix and priority allocations" icon={Landmark} />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      {/* Left: Health Indicator Ring */}
                      <div className="lg:col-span-4 bg-slate-50/60 rounded-3xl border border-slate-200/60 p-6 flex flex-col items-center text-center justify-center relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Total Utilization Gauge</h5>
                        <ProgressRing percentage={reportData.executive.usageRate} size={160} strokeWidth={11} color={reportData.executive.usageRate > 90 ? '#ef4444' : '#10b981'} />
                        <div className="mt-6 space-y-1">
                          <p className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                            RM {reportData.executive.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} Spent
                          </p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                            OUT OF RM {reportData.executive.totalAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })} TOTAL
                          </p>
                        </div>
                      </div>

                      {/* Right: High Spending Categories */}
                      <div className="lg:col-span-8 bg-slate-50/60 rounded-3xl border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-500 animate-pulse" /> Budget Category Expenditure Share
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reportData.byCategory.slice(0, 8).map((cat, idx) => (
                            <HorizontalBar 
                              key={cat.category}
                              label={cat.category}
                              value={cat.expenses}
                              max={reportData.executive.totalAllocation}
                              color={PIE_COLORS[idx % PIE_COLORS.length]}
                              delay={idx * 0.05}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â• BY VOTE CODE â•â•â•â•â•â•â•â• */}
                {activeTab === 'vote_code' && (
                  <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
                    <SectionHeader title="Vote Code Allocations" subtitle="Breakdown of government warrants between standard vote codes" icon={BarChart3} />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      {/* Chart - Filtered out 0-value vote codes and top 5 */}
                      <div className="lg:col-span-5 bg-slate-50/60 rounded-3xl border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
                        <div>
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Vot Utilization Distribution</h5>
                          <p className="text-[10px] text-slate-400 font-bold mb-4">Top active executing vote codes</p>
                        </div>
                        <div className="h-[240px] w-full">
                          <ResponsiveContainer>
                            <BarChart data={reportData.byVoteCode.filter(vc => vc.allocation > 0 || vc.expenses > 0).slice(0, 5)} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                              <YAxis dataKey="voteCode" type="category" tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} axisLine={false} tickLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend iconSize={6} iconType="circle" formatter={(val) => <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{val}</span>} />
                              <Bar dataKey="allocation" name="Allocated" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={12} />
                              <Bar dataKey="expenses" name="Spent" fill="#34d399" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Details Table */}
                      <div className="lg:col-span-7 overflow-hidden rounded-3xl border border-slate-200/60 shadow-sm max-h-[330px] flex flex-col bg-white">
                        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-slate-100 sticky top-0 z-20 border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider">
                                <th className="p-4 bg-slate-900">Vote Code</th>
                                <th className="p-4 text-right bg-slate-900">Allocation</th>
                                <th className="p-4 text-right bg-slate-900">Expenses</th>
                                <th className="p-4 text-right bg-slate-900">Available Balance</th>
                                <th className="p-4 text-center bg-slate-900 w-[140px]">Usage Rate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                              {reportData.byVoteCode.map(vc => (
                                <tr key={vc.voteCode} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-4 text-slate-900 font-extrabold flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm animate-pulse" style={{ backgroundColor: VOTE_COLORS[vc.voteCode] || '#64748b' }} />
                                    {vc.voteCode}
                                  </td>
                                  <td className="p-4 text-right text-slate-600 font-mono font-bold">{formatCurrency(vc.allocation).replace('MYR', 'RM')}</td>
                                  <td className="p-4 text-right text-emerald-600 font-mono font-extrabold">{formatCurrency(vc.expenses).replace('MYR', 'RM')}</td>
                                  <td className="p-4 text-right text-indigo-600 font-mono font-extrabold">{formatCurrency(vc.balance).replace('MYR', 'RM')}</td>
                                  <td className="p-4">
                                    <div className="flex flex-col items-center gap-1.5 px-2">
                                      <div className="flex justify-between w-full text-[9px] font-mono font-extrabold">
                                        <span className={cn(
                                          vc.usageRate > 90 ? 'text-rose-600' : vc.usageRate > 75 ? 'text-amber-600' : 'text-emerald-600'
                                        )}>{vc.usageRate.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div 
                                          className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            vc.usageRate > 90 ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                                            vc.usageRate > 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                          )}
                                          style={{ width: `${Math.min(vc.usageRate, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â• BY CATEGORY â•â•â•â•â•â•â•â• */}
                {activeTab === 'category' && (
                  <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
                    <SectionHeader title="Category Breakdown" subtitle="Detailed spending across drugs, standard supplies, and diagnostics" icon={PieChartIcon} />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      <div className="lg:col-span-5 bg-slate-50/60 rounded-3xl border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                        <div>
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Allocation vs Spent Shares</h5>
                          <p className="text-[10px] text-slate-400 font-bold mb-4">Comparison per product category</p>
                        </div>
                        <div className="h-[240px] w-full">
                          <ResponsiveContainer>
                            <ComposedChart data={reportData.byCategory.slice(0, 6)}>
                              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend iconSize={6} iconType="circle" formatter={(val) => <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{val}</span>} />
                              <Bar dataKey="allocation" name="Allocated" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                              <Line type="monotone" dataKey="expenses" name="Executed" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="lg:col-span-7 overflow-hidden rounded-3xl border border-slate-200/60 shadow-sm max-h-[330px] flex flex-col bg-white">
                        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-slate-100 sticky top-0 z-20 border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider">
                                <th className="p-4 bg-slate-900">Category</th>
                                <th className="p-4 text-right bg-slate-900">Allocation</th>
                                <th className="p-4 text-right bg-slate-900">Expenses</th>
                                <th className="p-4 text-right bg-slate-900">Balance</th>
                                <th className="p-4 text-center bg-slate-900 w-[140px]">Usage %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                              {reportData.byCategory.map((cat, idx) => (
                                <tr key={cat.category} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-4 text-slate-900 font-extrabold flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm animate-pulse" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                    {cat.category}
                                  </td>
                                  <td className="p-4 text-right text-slate-600 font-mono font-bold">{formatCurrency(cat.allocation).replace('MYR', 'RM')}</td>
                                  <td className="p-4 text-right text-emerald-600 font-mono font-extrabold">{formatCurrency(cat.expenses).replace('MYR', 'RM')}</td>
                                  <td className="p-4 text-right text-indigo-600 font-mono font-extrabold">{formatCurrency(cat.balance).replace('MYR', 'RM')}</td>
                                  <td className="p-4">
                                    <div className="flex flex-col items-center gap-1.5 px-2">
                                      <div className="flex justify-between w-full text-[9px] font-mono font-extrabold">
                                        <span className={cn(
                                          cat.usageRate > 90 ? 'text-rose-600' : cat.usageRate > 75 ? 'text-amber-600' : 'text-emerald-600'
                                        )}>{cat.usageRate.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div 
                                          className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            cat.usageRate > 90 ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                                            cat.usageRate > 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                          )}
                                          style={{ width: `${Math.min(cat.usageRate, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â• BY DEPARTMENT â•â•â•â•â•â•â•â• */}
                {activeTab === 'department' && (
                  <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
                    <SectionHeader title="Department Allocation & Cost Center Analysis" subtitle="Real-time cost tracking per hospital department" icon={Activity} />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      {/* Left: Department Top comparative chart with switcher */}
                      <div className="lg:col-span-5 bg-slate-50/60 rounded-3xl border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Department Comparison</h5>
                            <p className="text-[10px] text-slate-400 font-bold">Visualizing loading between cost centers</p>
                          </div>
                          
                          {/* Segmented Toggle Control */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-fit shrink-0 relative">
                            <button
                              onClick={() => setDeptViewMode('radar')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all duration-200",
                                deptViewMode === 'radar' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              Radar Chart
                            </button>
                            <button
                              onClick={() => setDeptViewMode('bar')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all duration-200",
                                deptViewMode === 'bar' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              Bar Chart
                            </button>
                          </div>
                        </div>

                        <div className="h-[250px] w-full flex items-center justify-center">
                          <ResponsiveContainer>
                            {deptViewMode === 'radar' ? (
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={reportData.byDepartment.filter(d => d.expenses > 0).slice(0, 6)}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="department" tick={{ fontSize: 8, fill: '#64748b', fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} />
                                <Radar name="Spent" dataKey="expenses" stroke="#6366f1" fill="#818cf8" fillOpacity={0.25} strokeWidth={2} />
                                <Tooltip content={<CustomTooltip />} />
                              </RadarChart>
                            ) : (
                              <BarChart data={reportData.byDepartment.filter(d => d.expenses > 0).slice(0, 5)} layout="vertical" margin={{ left: 5, right: 10, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                                <YAxis dataKey="department" type="category" tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }} width={80} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="expenses" name="Spent" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12}>
                                  {reportData.byDepartment.slice(0, 5).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Right: Department execution Table with sticky header */}
                      <div className="lg:col-span-7 overflow-hidden rounded-3xl border border-slate-200/60 shadow-sm max-h-[330px] flex flex-col bg-white">
                        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-slate-100 sticky top-0 z-20 border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider">
                                <th className="p-4 bg-slate-900">Department</th>
                                <th className="p-4 text-right bg-slate-900">Allocation</th>
                                <th className="p-4 text-right bg-slate-900">Spent</th>
                                <th className="p-4 text-right bg-slate-900">Balance</th>
                                <th className="p-4 text-center bg-slate-900 w-[140px]">Usage %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                              {reportData.byDepartment.map(dept => (
                                <tr key={dept.department} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-4 text-slate-900 font-extrabold truncate max-w-[150px]">{dept.department}</td>
                                  <td className="p-4 text-right text-slate-600 font-mono font-bold">{formatCurrency(dept.allocation).replace('MYR', 'RM')}</td>
                                  <td className="p-4 text-right text-emerald-600 font-mono font-extrabold">{formatCurrency(dept.expenses).replace('MYR', 'RM')}</td>
                                  <td className="p-4 text-right text-indigo-600 font-mono font-extrabold">{formatCurrency(dept.balance).replace('MYR', 'RM')}</td>
                                  <td className="p-4">
                                    <div className="flex flex-col items-center gap-1.5 px-2">
                                      <div className="flex justify-between w-full text-[9px] font-mono font-extrabold">
                                        <span className={cn(
                                          dept.usageRate > 90 ? 'text-rose-600' : dept.usageRate > 75 ? 'text-amber-600' : 'text-emerald-600'
                                        )}>{dept.usageRate.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div 
                                          className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            dept.usageRate > 90 ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                                            dept.usageRate > 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                          )}
                                          style={{ width: `${Math.min(dept.usageRate, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â• BY VOTE ACTIVITY / ITEM USED â•â•â•â•â•â•â•â• */}
                {activeTab === 'activity' && (
                  <div className="p-6 sm:p-8 space-y-6">
                    <SectionHeader title="Vote Activity & Items Execution Logs" subtitle="Precise tracking of products used by hospital vote codes" icon={ListTodo} />
                    
                    {/* Inner filter bar */}
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Search items by name or code..."
                          value={itemSearch}
                          onChange={e => setItemSearch(e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200/60 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="min-w-[150px]">
                        <select
                          value={itemDeptFilter}
                          onChange={e => setItemDeptFilter(e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200/60 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="all">All Departments</option>
                          {Array.from(new Set(reportData.topItems.map(x => x.department))).map((d: any) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-4">Item Name</th>
                            <th className="p-4">Item Code</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Vote Code</th>
                            <th className="p-4 text-right">Quantity Used</th>
                            <th className="p-4 text-right">Total Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold italic">
                                No items match your search.
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 font-semibold">
                                <td className="p-4 text-slate-900 font-black truncate max-w-[200px]" title={item.itemName}>{item.itemName}</td>
                                <td className="p-4 text-slate-500 font-bold">{item.itemCode}</td>
                                <td className="p-4 text-slate-600">{item.category}</td>
                                <td className="p-4 text-slate-600">{item.department}</td>
                                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black">{item.voteCode}</span></td>
                                <td className="p-4 text-right text-slate-800 font-black">{item.quantity.toLocaleString()}</td>
                                <td className="p-4 text-right text-emerald-600 font-black">{formatCurrency(item.totalSpent).replace('MYR', 'RM')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
{/* â•â•â•â•â•â•â•â• BUDGET FORECAST â•â•â•â•â•â•â•â• */}
                {activeTab === 'forecast' && (
                  <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
                    {/* Sub-header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
                      <SectionHeader title="Budget Forecasting & Run-Rate Projections" subtitle="Annual burn rate assessment and fiscal stability projections" icon={ForecastIcon} />
                      
                      {/* Month simulation slider widget */}
                      <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Simulative Month:</span>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={selectedMonthIndex}
                          onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value))}
                          className="w-[120px] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-black text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-sm">
                          {months[selectedMonthIndex]} ({(selectedMonthIndex + 1)}m elapsed)
                        </span>
                      </div>
                    </div>

                    {/* Calculations */}
                    {(() => {
                      const elapsedMonths = selectedMonthIndex + 1;
                      const remainingMonths = 12 - elapsedMonths;

                       const processedData = forecastCategories.map(cat => {
                         const dbVals = exactForecastMap[cat.id] || { allocation: cat.baseAllocation, spent: cat.baseMonthlyBurn * elapsedMonths };
                         let dynamicAlloc = dbVals.allocation;
                         let dynamicSpent = dbVals.spent;

                         // Scale dynamic spent relative to current simulation period (May/Month 5 baseline = index 4)
                         dynamicSpent = dynamicSpent * (elapsedMonths / 5);

                         const avgMonthlyUse = dynamicSpent / elapsedMonths;
                         const projectedRemaining = avgMonthlyUse * remainingMonths;
                         const eoyProjectedSpend = dynamicSpent + projectedRemaining;
                         
                         let currentAllocation = dynamicAlloc;
                         if (sandboxActive && sandboxTarget === cat.id) {
                           currentAllocation += sandboxAmount;
                         }
                         
                         const variance = currentAllocation - eoyProjectedSpend;
                         const shortfall = variance < 0 ? Math.abs(variance) : 0;

                         return {
                           ...cat,
                           allocation: currentAllocation,
                           ytdSpent: dynamicSpent,
                           avgMonthlyUse,
                           projectedRemaining,
                           eoyProjectedSpend,
                           shortfall,
                           variance,
                           isDeficit: variance < 0
                         };
                       });

                       // Inject dynamic "Other Non-Whitelisted Services" row to reconcile exact total hospital aggregates
                       const globalAllocation = reportData ? reportData.executive.totalAllocation : 1721243;
                       const globalExpenses = reportData ? reportData.executive.totalExpenses : 1171742;
                       const totalYtdSpentCalculated = globalExpenses * (elapsedMonths / 5);

                       const sumWhiteAlloc = processedData.reduce((sum, c) => sum + c.allocation, 0);
                       const sumWhiteSpent = processedData.reduce((sum, c) => sum + c.ytdSpent, 0);

                       const otherAlloc = Math.max(0, globalAllocation - sumWhiteAlloc);
                       const otherSpent = Math.max(0, totalYtdSpentCalculated - sumWhiteSpent);
                       const otherAvgMonthlyUse = otherSpent / elapsedMonths;
                       const otherProjectedRemaining = otherAvgMonthlyUse * remainingMonths;
                       const otherEoyProjectedSpend = otherSpent + otherProjectedRemaining;
                       const otherVariance = otherAlloc - otherEoyProjectedSpend;
                       const otherShortfall = otherVariance < 0 ? Math.abs(otherVariance) : 0;

                       const otherCategory = {
                         id: 'cat-other',
                         voteCode: 'Other',
                         voteActivity: 'N/A',
                         categoryName: 'Other Non-Whitelisted Services',
                         baseAllocation: otherAlloc,
                         baseMonthlyBurn: otherAvgMonthlyUse,
                         trend: 'stable',
                         confidence: 100,
                         justifications: [{
                           id: 'item-other',
                           code: 'OTH-001',
                           name: 'Other Operations',
                           monthlyConsumption: 'Varies',
                           reason: 'Consolidated balance of standard operational departments, facilities, admin overheads, and non-clinical supplies across the hospital network.',
                           addedCost: 0,
                           priority: 'MEDIUM'
                         }],
                         allocation: otherAlloc,
                         ytdSpent: otherSpent,
                         avgMonthlyUse: otherAvgMonthlyUse,
                         projectedRemaining: otherProjectedRemaining,
                         eoyProjectedSpend: otherEoyProjectedSpend,
                         shortfall: otherShortfall,
                         variance: otherVariance,
                         isDeficit: otherVariance < 0
                       };

                       processedData.push(otherCategory as any);

                      const totalAllocation = processedData.reduce((sum, c) => sum + c.allocation, 0);
                      const totalYtdSpent = processedData.reduce((sum, c) => sum + c.ytdSpent, 0);
                      const totalAvgBurn = processedData.reduce((sum, c) => sum + c.avgMonthlyUse, 0);
                      const totalProjectedSpend = processedData.reduce((sum, c) => sum + c.eoyProjectedSpend, 0);
                      const totalShortfall = processedData.reduce((sum, c) => sum + c.shortfall, 0);
                      const burnRatePercentage = (totalProjectedSpend / (totalAllocation || 1)) * 100;

                      const quarterlyAnalysis = [1, 2, 3, 4].map(quarter => {
                        const quarterAllocPortion = totalAllocation / 4;
                        let quarterSpent = 0;
                        let isProjected = false;

                        if (quarter === 1) {
                          if (elapsedMonths >= 3) {
                            quarterSpent = totalAvgBurn * 3;
                          } else {
                            quarterSpent = (totalAvgBurn * elapsedMonths) + (totalAvgBurn * (3 - elapsedMonths));
                            isProjected = true;
                          }
                        } else if (quarter === 2) {
                          if (elapsedMonths >= 6) {
                            quarterSpent = totalAvgBurn * 3;
                          } else if (elapsedMonths >= 3) {
                            quarterSpent = (totalAvgBurn * (elapsedMonths - 3)) + (totalAvgBurn * (6 - elapsedMonths));
                            isProjected = true;
                          } else {
                            quarterSpent = totalAvgBurn * 3;
                            isProjected = true;
                          }
                        } else if (quarter === 3) {
                          if (elapsedMonths >= 9) {
                            quarterSpent = totalAvgBurn * 3;
                          } else if (elapsedMonths >= 6) {
                            quarterSpent = (totalAvgBurn * (elapsedMonths - 6)) + (totalAvgBurn * (9 - elapsedMonths));
                            isProjected = true;
                          } else {
                            quarterSpent = totalAvgBurn * 3;
                            isProjected = true;
                          }
                        } else {
                          if (elapsedMonths >= 12) {
                            quarterSpent = totalAvgBurn * 3;
                          } else if (elapsedMonths >= 9) {
                            quarterSpent = (totalAvgBurn * (elapsedMonths - 9)) + (totalAvgBurn * (12 - elapsedMonths));
                            isProjected = true;
                          } else {
                            quarterSpent = totalAvgBurn * 3;
                            isProjected = true;
                          }
                        }

                        const variance = quarterAllocPortion - quarterSpent;

                        return {
                          quarter: `Q${quarter}`,
                          allocation: quarterAllocPortion,
                          spent: quarterSpent,
                          variance,
                          isProjected,
                          status: variance >= 0 ? 'safe' : Math.abs(variance) < (quarterAllocPortion * 0.1) ? 'warning' : 'danger'
                        };
                      });

                      return (
                        <div className="space-y-6">
                          {/* Forecast KPI row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                            
                            <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/50 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Annual Allocation</span>
                              <div className="text-base font-black text-slate-800 mt-1">
                                {formatCurrency(totalAllocation).replace('MYR', 'RM')}
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 mt-1">FY2026 allocated budget</p>
                            </div>

                            <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/50 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">YTD Actual Spent</span>
                              <div className="text-base font-black text-slate-800 mt-1">
                                {formatCurrency(totalYtdSpent).replace('MYR', 'RM')}
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 mt-1">{(totalYtdSpent / (totalAllocation || 1) * 100).toFixed(1)}% budget utilized</p>
                            </div>

                            <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/50 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Avg Monthly Burn</span>
                              <div className="text-base font-black text-indigo-650 mt-1">
                                {formatCurrency(totalAvgBurn).replace('MYR', 'RM')}
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 mt-1">Cumulative monthly rate</p>
                            </div>

                            <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/50 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Projected EOY Spend</span>
                              <div className="text-base font-black text-slate-800 mt-1">
                                {formatCurrency(totalProjectedSpend).replace('MYR', 'RM')}
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 mt-1">{burnRatePercentage.toFixed(0)}% run-rate relative to allocation</p>
                            </div>

                            <div className={cn(
                              "rounded-2xl p-4 border shadow-sm transition-all duration-300 flex flex-col justify-between",
                              totalShortfall > 0 
                                ? 'bg-rose-50 border-rose-200 text-rose-950 animate-pulse-slow' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            )}>
                              <span className="text-[10px] font-black uppercase tracking-wider block">Budget Needed To Add</span>
                              <div className="text-base font-black mt-1">
                                {formatCurrency(totalShortfall).replace('MYR', 'RM')}
                              </div>
                              <p className="text-[8px] font-bold mt-1 text-slate-500">
                                {totalShortfall > 0 ? 'Top-up shortfall predicted' : 'Surplus or Balanced EOY'}
                              </p>
                            </div>

                          </div>

                          {/* Projection Composed Chart */}
                          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                              <div>
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-widest">Visual Run-Rate Projections</span>
                                <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider mt-1">Allocation vs Projected EOY Spend</h6>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Current Allocation</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> YTD Spent</span>
                                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" /> EOY Projected Spend</span>
                              </div>
                            </div>
                            <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                  <XAxis 
                                    dataKey="voteCode" 
                                    tickFormatter={(v, index) => {
                                      const item = processedData[index];
                                      if (!item) return v;
                                      return item.voteCode === 'Other' ? 'Other' : `${item.voteCode}-${item.voteActivity}`;
                                    }}
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <YAxis 
                                    tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} 
                                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                  />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Bar dataKey="allocation" name="Current Allocation" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                  <Bar dataKey="ytdSpent" name="YTD Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                                  <Line type="monotone" dataKey="eoyProjectedSpend" name="EOY Projected Spend" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Modeler Playground widget */}
                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3.5 mb-4 gap-4">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-200">SIMULATOR WIDGET</span>
                                  <span className="text-slate-800 text-xs font-black">Scenario Budget Modeler</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">Test simulated revisions to balance predicted year-end shortfalls</p>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => setSandboxActive(!sandboxActive)}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 shadow-sm",
                                    sandboxActive 
                                      ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700' 
                                      : 'bg-indigo-650 border-indigo-650 text-white hover:bg-indigo-700'
                                  )}
                                >
                                   {sandboxActive ? '🛑 Close Playground' : '⚡ Open Sandbox'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSandboxActive(false);
                                    setSandboxAmount(1000000);
                                  }}
                                  disabled={!sandboxActive}
                                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Reset
                                  </button>
                              </div>
                            </div>

                            {sandboxActive && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slideIn">
                                <div>
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">1. Target Vote Code Category</label>
                                  <select
                                    value={sandboxTarget}
                                    onChange={(e) => setSandboxTarget(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {processedData.filter(c => c.id !== 'cat-other').map(c => (
                                      <option key={c.id} value={c.id}>
                                        {c.voteCode}-{c.voteActivity} ({c.categoryName.substring(0, 20)}...)
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">2. Simulated supplemental top-up</label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">RM</span>
                                    <input
                                      type="number"
                                      step="50000"
                                      min="0"
                                      value={sandboxAmount}
                                      onChange={(e) => setSandboxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-black text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">3. Top-Up Adjuster</label>
                                  <div className="h-8 flex items-center">
                                    <input
                                      type="range"
                                      min="0"
                                      max="3000000"
                                      step="100000"
                                      value={sandboxAmount}
                                      onChange={(e) => setSandboxAmount(parseInt(e.target.value))}
                                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Detailed Vote Code and Category Table */}
                          <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-sm bg-white">
                            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                              <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Detail Run-Rate Projections by Category & Vote Code</h6>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-900 text-slate-100 border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider">
                                    <th className="p-4 bg-slate-900">Vote Code & Category</th>
                                    <th className="p-4 text-right bg-slate-900">Annual Allocation</th>
                                    <th className="p-4 text-right bg-slate-900">YTD Spent</th>
                                    <th className="p-4 text-right bg-slate-900">Monthly Avg Use</th>
                                    <th className="p-4 text-right bg-slate-900">Projected EOY spend</th>
                                    <th className="p-4 text-right bg-slate-900">Variance / Shortfall</th>
                                    <th className="p-4 text-center bg-slate-900">Confidence</th>
                                    <th className="p-4 text-center bg-slate-900">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                  {processedData.map((cat: any) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-4">
                                        <div>
                                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[9px] font-mono border border-slate-200">
                                            {cat.voteCode}-{cat.voteActivity}
                                          </span>
                                          <div className="text-xs font-black text-slate-800 mt-1">{cat.categoryName}</div>
                                        </div>
                                      </td>
                                      
                                      <td className="p-4 text-right font-mono font-bold text-slate-600">{formatCurrency(cat.allocation).replace('MYR', 'RM')}</td>
                                      <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(cat.ytdSpent).replace('MYR', 'RM')}</td>
                                      <td className="p-4 text-right font-mono text-indigo-650">{formatCurrency(cat.avgMonthlyUse).replace('MYR', 'RM')}</td>
                                      <td className="p-4 text-right font-mono font-extrabold text-slate-800">{formatCurrency(cat.eoyProjectedSpend).replace('MYR', 'RM')}</td>
                                      
                                      <td className="p-4 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className={cn("font-mono font-black", cat.isDeficit ? "text-rose-600" : "text-emerald-600")}>
                                            {cat.isDeficit ? `-${formatCurrency(cat.shortfall).replace('MYR', 'RM')}` : `+${formatCurrency(cat.variance).replace('MYR', 'RM')}`}
                                          </span>
                                          <span className={cn(
                                            "text-[8px] font-black uppercase px-1.5 py-0.2 rounded mt-0.5 block",
                                            cat.isDeficit ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                          )}>
                                            {cat.isDeficit ? "Budget Needed" : "Safe Surplus"}
                                          </span>
                                        </div>
                                      </td>

                                      <td className="p-4">
                                        <div className="flex flex-col items-center">
                                          <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                            <span className="capitalize">{cat.trend}</span>
                                             <span>{cat.trend === 'increasing' ? '📈' : cat.trend === 'decreasing' ? '📉' : '➡'}</span>
                                          </div>
                                          <span className="text-[8px] font-bold text-slate-400">{cat.confidence}% conf</span>
                                        </div>
                                      </td>

                                      <td className="p-4 text-center">
                                        <button
                                          onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            // Align top of drawer card with top of row (capped to prevent viewport overflow)
                                            setDrawerTopPosition(Math.min(rect.top - 80, window.innerHeight - 500));
                                            setActiveDrawerId(cat.id);
                                          }}
                                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-200/50 transition-all flex items-center gap-1 mx-auto"
                                        >
                                          <span>Backup Reasons</span>
                                           <span>➡</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Quarterly analysis Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                              <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Quarter Analysis Portion Run-Rates</h6>
                              <div className="space-y-3.5">
                                {quarterlyAnalysis.map((q) => {
                                  const percentUsed = (q.spent / q.allocation) * 100;
                                  return (
                                    <div key={q.quarter} className="bg-white p-3 border border-slate-200/50 rounded-2xl shadow-sm">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black text-slate-800">{q.quarter}</span>
                                          <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-1.5 py-0.2 rounded uppercase">
                                            {q.isProjected ? 'Projected Portion' : 'Completed Actual'}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-bold text-slate-500">
                                            Spent: <span className="font-extrabold text-slate-800">{formatCurrency(q.spent).replace('MYR', 'RM')}</span> / {formatCurrency(q.allocation).replace('MYR', 'RM')}
                                          </span>
                                          <span className={cn(
                                            "text-[10px] font-black",
                                            q.status === 'safe' ? 'text-emerald-600' : q.status === 'warning' ? 'text-yellow-600' : 'text-rose-600'
                                          )}>
                                            {q.variance >= 0 ? `+${formatCurrency(q.variance).replace('MYR', 'RM')}` : `-${formatCurrency(Math.abs(q.variance)).replace('MYR', 'RM')}`}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div 
                                          className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            q.status === 'safe' ? 'bg-emerald-500' : q.status === 'warning' ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                                          )}
                                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Forecast stability */}
                            <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                              <div>
                                <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Stability Indicators</h6>
                                <div className="space-y-3">
                                  
                                  <div className="bg-white border border-slate-200/50 rounded-2xl p-3.5 flex justify-between items-center shadow-sm">
                                    <div>
                                      <span className="text-[10px] text-slate-500 block font-bold">Model Precision Baseline</span>
                                      <span className="text-[8px] text-slate-400 block font-bold">Strategic run-rate variance</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-black text-indigo-650 block">93.2%</span>
                                      <span className="text-[8px] bg-indigo-50 border border-indigo-200 text-indigo-600 font-extrabold px-1.5 py-0.2 rounded tracking-widest uppercase">High</span>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200/50 rounded-2xl p-3.5 flex justify-between items-center shadow-sm">
                                    <div>
                                      <span className="text-[10px] text-slate-500 block font-bold">Action Needed Shortfalls</span>
                                      <span className="text-[8px] text-slate-400 block font-bold">Shortfall projections matching Q4</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-black text-rose-600 block">
                                        {forecastCategories.filter(c => c.baseMonthlyBurn * 12 > c.baseAllocation).length}
                                      </span>
                                      <span className="text-[8px] bg-rose-50 border border-rose-200 text-rose-600 font-extrabold px-1.5 py-0.2 rounded tracking-widest uppercase">High-Risk</span>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200/50 rounded-2xl p-3.5 flex justify-between items-center shadow-sm">
                                    <div>
                                      <span className="text-[10px] text-slate-500 block font-bold">Annual Caseload Curve</span>
                                      <span className="text-[8px] text-slate-400 block font-bold">Surge projections indicator</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-orange-600 block">Influenza Spikes</span>
                                      <span className="text-[8px] bg-orange-50 border border-orange-200 text-orange-600 font-extrabold px-1.5 py-0.2 rounded tracking-widest uppercase">Aggressive</span>
                                    </div>
                                  </div>

                                </div>
                              </div>
                              
                              <div className="border-t border-slate-200/60 pt-3 mt-4 flex items-start space-x-2 text-[9.5px] font-bold text-slate-400">
                                 <span>ℹ️</span>
                                <p className="leading-relaxed">This predictive financial modeling forecast recalculates instantly inside your active workspace session when using simulative sandbox or elapsed month selectors.</p>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â• DETAILED TRANSACTIONS â•â•â•â•â•â•â•â• */}
                {activeTab === 'transactions' && (
                  <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
                    <SectionHeader title="Detailed Transaction Logs" subtitle="Chronological ledger of all purchase orders and financial commitments" icon={History} />

                    {/* Filter controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 bg-slate-50/60 p-5 rounded-3xl border border-slate-200/60">
                      <div className="lg:col-span-2">
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Search Transactions</label>
                        <input
                          type="text"
                          placeholder="Search PO number or supplier name..."
                          value={txnSearch}
                          onChange={e => {
                            setTxnSearch(e.target.value)
                            setTxnPage(1)
                          }}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
                        <select
                          value={txnCategoryFilter}
                          onChange={e => {
                            setTxnCategoryFilter(e.target.value)
                            setTxnPage(1)
                          }}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                        >
                          <option value="all">All Categories</option>
                          {Array.from(new Set(reportData.transactions.map(t => t.category))).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department</label>
                        <select
                          value={txnDeptFilter}
                          onChange={e => {
                            setTxnDeptFilter(e.target.value)
                            setTxnPage(1)
                          }}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                        >
                          <option value="all">All Departments</option>
                          {Array.from(new Set(reportData.transactions.map(t => t.department))).map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Vote Code</label>
                        <select
                          value={txnVoteFilter}
                          onChange={e => {
                            setTxnVoteFilter(e.target.value)
                            setTxnPage(1)
                          }}
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                        >
                          <option value="all">All Votes</option>
                          {Array.from(new Set(reportData.transactions.map(t => t.voteCode))).map(vote => (
                            <option key={vote} value={vote}>{vote}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-sm bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-slate-100 border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider">
                              <th className="p-4 bg-slate-900">PO Number</th>
                              <th className="p-4 bg-slate-900">Order Date</th>
                              <th className="p-4 bg-slate-900">Supplier</th>
                              <th className="p-4 bg-slate-900">Category</th>
                              <th className="p-4 bg-slate-900">Department</th>
                              <th className="p-4 bg-slate-900">Vote Code</th>
                              <th className="p-4 text-right bg-slate-900">Amount</th>
                              <th className="p-4 text-center bg-slate-900">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                            {paginatedTxns.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold italic">
                                  No transaction records match the specified filters.
                                </td>
                              </tr>
                            ) : (
                              paginatedTxns.map((txn) => (
                                <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4 font-mono font-black text-slate-900">{txn.poNumber}</td>
                                  <td className="p-4 text-slate-500 font-medium">{new Date(txn.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                  <td className="p-4 text-slate-800 font-extrabold max-w-[200px] truncate" title={txn.supplierName}>{txn.supplierName}</td>
                                  <td className="p-4">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                                      {txn.category}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-600">{txn.department}</td>
                                  <td className="p-4 font-mono text-[10px] text-slate-500">{txn.voteCode}</td>
                                  <td className="p-4 text-right font-mono font-extrabold text-slate-900">
                                    {formatCurrency(txn.amount).replace('MYR', 'RM')}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={cn(
                                      "inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wider",
                                      txn.status === 'completed'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                        : ['approved', 'sent'].includes(txn.status)
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                          : ['partial_received', 'pending', 'draft'].includes(txn.status)
                                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                                            : 'bg-rose-50 border-rose-200 text-rose-600'
                                    )}>
                                      {txn.status.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalTxnPages > 1 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Showing {((txnPage - 1) * 15) + 1} - {Math.min(txnPage * 15, filteredTxns.length)} of {filteredTxns.length} Transactions
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                              disabled={txnPage === 1}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1.5"
                            >
                              ◀ Prev
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalTxnPages }).map((_, i) => {
                                const pageNum = i + 1
                                const isCurrent = txnPage === pageNum
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setTxnPage(pageNum)}
                                    className={cn(
                                      "w-7 h-7 rounded-lg text-[10px] font-black transition-all flex items-center justify-center",
                                      isCurrent 
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                                        : "text-slate-500 hover:bg-slate-100"
                                    )}
                                  >
                                    {pageNum}
                                  </button>
                                )
                              })}
                            </div>
                            <button
                              onClick={() => setTxnPage(p => Math.min(totalTxnPages, p + 1))}
                              disabled={txnPage === totalTxnPages}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1.5"
                            >
                              Next ▶
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â• BACKUP REASONS DRAWER â•â•â•â•â•â•â•â• */}
                {(() => {
                  if (!activeDrawerId) return null;
                  const cat = forecastCategories.find(c => c.id === activeDrawerId) as any;
                  if (!cat) return null;

                  const elapsedMonths = selectedMonthIndex + 1;
                  const remainingMonths = 12 - elapsedMonths;
                  const dbVals = exactForecastMap[cat.id] || { allocation: cat.baseAllocation, spent: cat.baseMonthlyBurn * elapsedMonths };
                  let currentAllocation = dbVals.allocation;
                  let dynamicSpent = dbVals.spent * (elapsedMonths / 5);
                  if (sandboxActive && sandboxTarget === cat.id) {
                    currentAllocation += sandboxAmount;
                  }
                  const avgMonthlyUse = dynamicSpent / elapsedMonths;
                  const projectedRemaining = avgMonthlyUse * remainingMonths;
                  const eoyProjectedSpend = dynamicSpent + projectedRemaining;
                  const variance = currentAllocation - eoyProjectedSpend;
                  const shortfall = variance < 0 ? Math.abs(variance) : 0;
                  const isDeficit = variance < 0;

                  return (
                    <AnimatePresence>
                      <div className="fixed inset-0 z-[60] flex justify-end">
                        {/* Backdrop */}
                        <motion.div
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setActiveDrawerId(null)}
                        />
                        {/* Drawer Panel */}
                        <motion.div
                          ref={drawerRef}
                          style={{
                            marginTop: `${Math.max(20, drawerTopPosition)}px`,
                            maxHeight: `calc(100vh - ${Math.max(20, drawerTopPosition)}px - 40px)`
                          }}
                          className="relative w-full max-w-3xl bg-white border border-slate-200 shadow-2xl flex flex-col rounded-3xl mr-6 mb-6 overflow-hidden"
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        >
                          {/* Drawer Header */}
                          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-widest">
                                  {cat.voteCode}-{cat.voteActivity}
                                </span>
                                <h2 className="text-lg font-black text-slate-800 mt-2">{cat.categoryName}</h2>
                                <p className="text-[10px] text-slate-550 font-bold mt-0.5">Backup justification and procurement drivers</p>
                              </div>
                              <button
                                onClick={() => setActiveDrawerId(null)}
                                className="text-slate-400 hover:text-slate-600 text-xl font-bold transition-colors p-1"
                              >
                                ✖
                              </button>
                            </div>
                          </div>

                          {/* Drawer Body */}
                          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* KPI Breakdown */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                      <div className="text-center border-r border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Allocation</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-1 block">{formatCurrency(currentAllocation).replace('MYR', 'RM')}</span>
                      </div>
                      <div className="text-center border-r border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Avg Burn</span>
                        <span className="text-sm font-extrabold text-indigo-650 mt-1 block">{formatCurrency(avgMonthlyUse).replace('MYR', 'RM')}/mo</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">EOY Proj Spend</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-1 block">{formatCurrency(eoyProjectedSpend).replace('MYR', 'RM')}</span>
                      </div>
                    </div>

                     {/* Itemized Justifications (The "Why" Backup) */}
                    <div className="space-y-5">
                      <h3 className="text-xs uppercase font-black tracking-widest text-slate-500">Procurement & Itemized Driver Breakdown</h3>
                      
                      {(() => {
                        // Dynamically look up real items in reportData that belong to this code or department
                        const matchingRealItems = reportData 
                          ? reportData.topItems.filter(item => {
                              if (!item) return false;
                              const deptName = (item.department || '').toLowerCase();
                              const catCode = item.voteCode || '';
                              const normCat = (item.category || '').toLowerCase();

                              if (cat.voteCode === 'Nephrology' && deptName.includes('nephrology')) return true;
                              if (cat.voteCode === 'Radiology & Radiography' && deptName.includes('radiology')) return true;
                              if (cat.voteCode === 'Non-Standard' && normCat.includes('standard')) return true;
                              
                              if (cat.voteCode === '990102' && catCode === '990102') {
                                if (cat.voteActivity === '27499' && normCat === 'non drug') return true;
                                if (cat.voteActivity === '27401' && ['drug', 'insulin', 'hepc', 'sglt-2', 'vaccine'].includes(normCat)) return true;
                                if (cat.voteActivity === '27404' && ['medical oxygen', 'medical cylinder'].includes(normCat)) return true;
                              }
                              if (cat.voteCode === '080702' && catCode === '080702') {
                                if (cat.voteActivity === '27499' && normCat === 'non drug') return true;
                                if (cat.voteActivity === '27401' && ['drug', 'insulin', 'hepc', 'sglt-2', 'vaccine'].includes(normCat)) return true;
                                if (cat.voteActivity === '27404' && ['medical oxygen', 'medical cylinder'].includes(normCat)) return true;
                              }
                              return false;
                            })
                          : [];

                        // If we have real DB items, show them, otherwise fallback cleanly to the clinical anchors
                        const itemsToShow = matchingRealItems.length > 0 
                          ? matchingRealItems.map((dbItem, index) => {
                              const baseJust = cat.justifications[0] || { priority: 'HIGH', reason: 'High demand and critical caseload increase in specialized ward.' };
                              // Determine dynamic unit price
                              const qty = typeof dbItem.quantity === 'number' && dbItem.quantity > 0 ? dbItem.quantity : 1;
                              const totalSpent = typeof dbItem.totalSpent === 'number' ? dbItem.totalSpent : 0;
                              const unitPrice = totalSpent / qty;

                              return {
                                id: `db-item-${index}`,
                                code: dbItem.itemCode || 'N/A',
                                name: dbItem.itemName || 'Unnamed Item',
                                monthlyConsumption: `${Math.round(qty / elapsedMonths).toLocaleString()} units / month`,
                                reason: `${baseJust.reason} Dynamic ledger tracking confirms a total spent of ${formatCurrency(totalSpent).replace('MYR', 'RM')} across ${qty.toLocaleString()} units at RM ${unitPrice.toFixed(2)}/unit.`,
                                addedCost: totalSpent * 0.35, // Projected extra need
                                priority: baseJust.priority
                              };
                            })
                          : cat.justifications;

                        return itemsToShow.map((item: any) => (
                          <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300/80 transition-colors">
                            
                            {/* Item Header */}
                            <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded font-black border border-slate-200">
                                  {item.code}
                                </span>
                                <span className="text-sm font-extrabold text-slate-800 ml-2">{item.name}</span>
                              </div>
                              
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                                item.priority === 'CRITICAL' 
                                  ? 'bg-rose-950/80 border-rose-700/40 text-rose-300' 
                                  : item.priority === 'HIGH' 
                                    ? 'bg-orange-950/80 border-orange-700/40 text-orange-300' 
                                    : item.priority === 'MEDIUM' 
                                      ? 'bg-yellow-950/80 border-yellow-700/40 text-yellow-350' 
                                      : 'bg-slate-950 border-slate-700/40 text-slate-300'
                              }`}>
                                {item.priority}
                              </span>
                            </div>

                            {/* Item Body */}
                            <div className="p-4 space-y-3 bg-white">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Real Monthly Rate</span>
                                  <span className="text-xs font-bold text-slate-700 mt-0.5 block">{item.monthlyConsumption}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Estimated Added Cost</span>
                                  <span className="text-xs font-extrabold text-rose-650 mt-0.5 block font-mono">
                                    {item.addedCost > 0 ? formatCurrency(item.addedCost).replace('MYR', 'RM') : 'RM 0 (Covered)'}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Primary Purchasing Backing Justification</span>
                                <p className="text-xs font-semibold text-slate-650 mt-1 leading-relaxed">
                                  {item.reason}
                                </p>
                              </div>
                            </div>

                          </div>
                        ));
                      })()}
                    </div>

                  </div>

                  {/* Drawer Footer */}
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                    <button
                      onClick={() => setActiveDrawerId(null)}
                      className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
                    >
                      Dismiss Panel
                    </button>
                    {isDeficit && (
                      <button
                        onClick={() => {
                          setSandboxTarget(cat.id);
                          setSandboxAmount(shortfall);
                          setSandboxActive(true);
                          setActiveDrawerId(null);
                        }}
                        className="bg-indigo-650 text-white border border-indigo-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow"
                      >
                        Simulate Top-Up
                      </button>
                    )}
                  </div>

                </motion.div>
              </div>
            </AnimatePresence>
          );
        })()}

                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
