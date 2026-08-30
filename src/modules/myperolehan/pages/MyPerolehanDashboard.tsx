// src/modules/myperolehan/pages/MyPerolehanDashboard.tsx
// Master Container Page for MyPerolehan (Hospital Administrator Procurement & Budget Monitoring)
// Built to match MyWarrantDashboard.tsx structure, sidebar, colors, and layout components 100%

import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Wallet,
  FileText,
  ShoppingCart,
  PieChart,
  Activity,
  Clock,
  ArrowRight,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  Sparkles,
  ChevronRight,
  Building,
  HardHat,
  CreditCard,
  Plus
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { supabase } from '@/services/supabase'
import { motion, AnimatePresence } from 'framer-motion'

// Detail Tabs & Components
import { PengurusanBudgetTab } from './tabs/PengurusanBudgetTab'
import { PembangunanBudgetTab } from './tabs/PembangunanBudgetTab'
import { PurchaseOrdersTab } from './tabs/PurchaseOrdersTab'
import { ReceivingPaymentsTab } from './tabs/ReceivingPaymentsTab'
import { PerihalSuppliersTab } from './tabs/PerihalSuppliersTab'

// Modals
import { CreateAdminPOModal } from '../components/CreateAdminPOModal'
import { AdminLpoViewerModal } from '../components/AdminLpoViewerModal'
import { RecordPaymentModal } from '../components/RecordPaymentModal'
import { AddWarrantModal } from '../components/AddWarrantModal'

// Service
import {
  getAggregatedPerolehanData,
  getLPOs,
  getReceivingRecords,
  getPayments,
  getPerihalCatalog,
  getSuppliers
} from '../services/perolehanAdminService'

import type {
  OverallPerolehanKPIs,
  BudgetHierarchySummary,
  AdminPurchaseOrder,
  AdminWarrant,
  AdminPembangunan,
  AdminLPO,
  AdminReceivingRecord,
  AdminPayment,
  AdminPerihalItem,
  AdminSupplier,
  BudgetType
} from '@/shared/types/myperolehan'

interface ActivityLog {
  title: string
  sub: string
  time: string
  color: string
}

interface MyPerolehanDashboardProps {
  initialTab?: string
}

export const MyPerolehanDashboard: React.FC<MyPerolehanDashboardProps> = ({ initialTab }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active view from URL path or prop
  const getTabFromPath = () => {
    const path = location.pathname
    if (path.includes('/pengurusan')) return 'pengurusan'
    if (path.includes('/pembangunan')) return 'pembangunan'
    if (path.includes('/orders')) return 'orders'
    if (path.includes('/payments')) return 'receiving_payments'
    if (path.includes('/catalog')) return 'catalog'
    return initialTab || 'dashboard'
  }

  const [activeView, setActiveView] = useState<string>(getTabFromPath())
  const [loading, setLoading] = useState(true)

  // Aggregated Data State
  const [kpis, setKpis] = useState<OverallPerolehanKPIs>({
    totalAllocatedPengurusan: 0,
    totalAllocatedPembangunan: 0,
    totalAllocatedGrand: 0,
    totalCommitted: 0,
    totalActualSpent: 0,
    totalNetBalance: 0,
    overallUtilizationRate: 0,
    activePOCount: 0,
    pendingApprovalCount: 0,
    totalSuppliersCount: 0,
    fiscalYear: 2026
  })

  const [hierarchy, setHierarchy] = useState<BudgetHierarchySummary[]>([])
  const [orders, setOrders] = useState<AdminPurchaseOrder[]>([])
  const [warrants, setWarrants] = useState<AdminWarrant[]>([])
  const [pembangunan, setPembangunan] = useState<AdminPembangunan[]>([])
  const [lpos, setLpos] = useState<AdminLPO[]>([])
  const [receivingRecords, setReceivingRecords] = useState<AdminReceivingRecord[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [catalogItems, setCatalogItems] = useState<AdminPerihalItem[]>([])
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])

  // Modal States
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false)
  const [poPreselectedBudgetType, setPoPreselectedBudgetType] = useState<BudgetType>('warrant')
  const [poPreselectedProgramCode, setPoPreselectedProgramCode] = useState<string>('020200')

  const [isAddWarrantOpen, setIsAddWarrantOpen] = useState(false)
  const [warrantInitialType, setWarrantInitialType] = useState<BudgetType>('warrant')

  const [selectedLPOForView, setSelectedLPOForView] = useState<AdminLPO | null>(null)
  const [selectedLPOForPayment, setSelectedLPOForPayment] = useState<AdminLPO | null>(null)

  useEffect(() => {
    setActiveView(getTabFromPath())
  }, [location.pathname, initialTab])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [aggData, lposRes, recRes, payRes, catRes, supRes] = await Promise.all([
        getAggregatedPerolehanData(2026),
        getLPOs(),
        getReceivingRecords(),
        getPayments(),
        getPerihalCatalog(),
        getSuppliers()
      ])

      setKpis(aggData.kpis)
      setHierarchy(aggData.hierarchy)
      setOrders(aggData.recentOrders)
      setWarrants(aggData.warrants)
      setPembangunan(aggData.pembangunan)
      setLpos(lposRes)
      setReceivingRecords(recRes)
      setPayments(payRes)
      setCatalogItems(catRes)
      setSuppliers(supRes)

      // Map live activities
      const mappedActivities: ActivityLog[] = []
      aggData.recentOrders.slice(0, 5).forEach((po) => {
        if (po.status === 'completed') {
          mappedActivities.push({
            title: 'Bayaran Selesai',
            sub: `${po.order_number} - RM ${Number(po.total_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
            time: po.order_date,
            color: 'bg-emerald-500'
          })
        } else if (po.status === 'approved') {
          mappedActivities.push({
            title: 'Pesanan Diluluskan (LPO)',
            sub: `${po.order_number} - ${po.supplier?.company_name || 'Pembekal Dilantik'}`,
            time: po.order_date,
            color: 'bg-indigo-500'
          })
        } else {
          mappedActivities.push({
            title: 'Pesanan Baharu Dicipta',
            sub: `${po.order_number} - Menunggu kelulusan pentadbir`,
            time: po.order_date,
            color: 'bg-amber-500'
          })
        }
      })

      if (mappedActivities.length === 0) {
        mappedActivities.push(
          {
            title: 'System Activity',
            sub: 'Pangkalan data perolehan & waran disegerakkan secara langsung',
            time: 'Just now',
            color: 'bg-indigo-500'
          },
          {
            title: 'Waran KKM Direkodkan',
            sub: 'Peruntukan P42 & 022300 dikemaskini',
            time: '1 day ago',
            color: 'bg-emerald-500'
          }
        )
      }

      setActivities(mappedActivities)
    } catch (error) {
      console.error('Error fetching perolehan dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const openCreatePOWithPreset = (programCode?: string) => {
    if (programCode === 'P42') {
      setPoPreselectedBudgetType('pembangunan')
      setPoPreselectedProgramCode('P42')
    } else if (programCode === '022300') {
      setPoPreselectedBudgetType('warrant')
      setPoPreselectedProgramCode('022300')
    } else {
      setPoPreselectedBudgetType('warrant')
      setPoPreselectedProgramCode('020200')
    }
    setIsCreatePOOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] relative font-sans overflow-x-hidden pb-16">
      {/* Premium Ambient Radial Lights matching MyWarrantDashboard */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-8">
        {/* Breadcrumbs & Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <button
              onClick={() => {
                setActiveView('dashboard')
                navigate('/perolehan')
              }}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              Perolehan
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-extrabold tracking-wide uppercase">
              {activeView === 'dashboard'
                ? 'Operations Dashboard'
                : activeView === 'pengurusan'
                ? 'Bajet Pengurusan'
                : activeView === 'pembangunan'
                ? 'Bajet Pembangunan'
                : activeView === 'orders'
                ? 'Purchase Orders'
                : activeView === 'receiving_payments'
                ? 'Terimaan & Bayaran'
                : 'Katalog & Pembekal'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  Operations Portal
                </h1>
                <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  Comprehensive Financial Oversight & Healthcare Logistics Registry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="px-4.5 py-2 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-2 hover:border-indigo-100 transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Central Operations Ledger Grid (5 Cards in 1 Row matching MyWarrantDashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* 1. Budget Overview */}
          <div
            onClick={() => {
              setActiveView(activeView === 'pengurusan' ? 'dashboard' : 'pengurusan')
              navigate('/perolehan/pengurusan')
            }}
            className={`group bg-white border-2 ${
              activeView === 'pengurusan' ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'
            } p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-blue-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <PieChart className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                Budget Overview
              </h3>
              <p className="text-slate-400 font-semibold text-[11px]">Status & performance metrics</p>
            </div>
            <div className="flex items-center text-blue-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              EXPLORE <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 2. Warrant Management */}
          <div
            onClick={() => {
              setActiveView(activeView === 'pembangunan' ? 'dashboard' : 'pembangunan')
              navigate('/perolehan/pembangunan')
            }}
            className={`group bg-white border-2 ${
              activeView === 'pembangunan' ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10' : 'border-slate-100 hover:border-emerald-200'
            } p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Wallet className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allocation</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                Warrant Management
              </h3>
              <p className="text-slate-400 font-semibold text-[11px]">Distribution & limits control</p>
            </div>
            <div className="flex items-center text-emerald-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              MANAGE <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 3. Purchase Orders */}
          <div
            onClick={() => {
              setActiveView(activeView === 'orders' ? 'dashboard' : 'orders')
              navigate('/perolehan/orders')
            }}
            className={`group bg-white border-2 ${
              activeView === 'orders' ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'border-slate-100 hover:border-indigo-200'
            } p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.02] group-hover:bg-indigo-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <ShoppingCart className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Procurement</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                Purchase Orders
              </h3>
              <p className="text-slate-400 font-semibold text-[11px]">Registry lifecycle & tracking</p>
            </div>
            <div className="flex items-center text-indigo-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              PROCURE <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 4. LOU & Penalties / Payments */}
          <div
            onClick={() => {
              setActiveView(activeView === 'receiving_payments' ? 'dashboard' : 'receiving_payments')
              navigate('/perolehan/payments')
            }}
            className={`group bg-white border-2 ${
              activeView === 'receiving_payments' ? 'border-purple-500 shadow-md ring-2 ring-purple-500/10' : 'border-slate-100 hover:border-purple-200'
            } p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-purple-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/[0.02] group-hover:bg-purple-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <CreditCard className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settlement</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors leading-tight">
                Terimaan & Bayaran
              </h3>
              <p className="text-slate-400 font-semibold text-[11px]">DO Receiving & EFT Vouchers</p>
            </div>
            <div className="flex items-center text-purple-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              TRACK <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 5. Item Catalogs */}
          <div
            onClick={() => {
              setActiveView(activeView === 'catalog' ? 'dashboard' : 'catalog')
              navigate('/perolehan/catalog')
            }}
            className={`group bg-white border-2 ${
              activeView === 'catalog' ? 'border-slate-800 shadow-md ring-2 ring-slate-800/10' : 'border-slate-100 hover:border-slate-300'
            } p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/[0.02] group-hover:bg-slate-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm group-hover:bg-slate-850 group-hover:text-white transition-all duration-300">
                <ClipboardList className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Directory</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-slate-950 transition-colors leading-tight">
                Item Catalogs
              </h3>
              <p className="text-slate-400 font-semibold text-[11px]">54+ items & registered MOF</p>
            </div>
            <div className="flex items-center text-slate-800 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              VIEW <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Section Grid (Quick Statistics + Recent Activities) matching MyWarrantDashboard */}
        {activeView === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Statistics Metric Cards */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-xl shadow-slate-200/20 flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-5.5 h-5.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Statistics</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Real-time ledger overview
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 flex-1">
                  <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Synchronizing real-time values...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                  {/* Total Allocated */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-blue-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Total Allocated Budget
                    </p>
                    <div className="space-y-1 flex-1 flex flex-col justify-end">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                        RM {kpis.totalAllocatedGrand.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">Total hospital warrants registry</p>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-emerald-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Budget Utilization
                    </p>
                    <div className="space-y-2 flex-1 flex flex-col justify-end">
                      <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                          {kpis.overallUtilizationRate}%
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-600">Active</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${kpis.overallUtilizationRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Contracts / POs */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-purple-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Active Contracts / PO
                    </p>
                    <div className="space-y-1 flex-1 flex flex-col justify-end">
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                        {kpis.activePOCount.toString().padStart(2, '0')}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">Total verified agreements</p>
                    </div>
                  </div>

                  {/* Pending Approvals */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-orange-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Pending Action
                    </p>
                    <div className="space-y-1 flex-1 flex flex-col justify-end">
                      <h4 className="text-3xl font-black text-orange-600 tracking-tight tabular-nums">
                        {kpis.pendingApprovalCount.toString().padStart(2, '0')}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">Awaiting management approvals</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Logs Stream */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-xl shadow-slate-200/20 flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl flex items-center justify-center shadow-md">
                  <Activity className="w-5.5 h-5.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Activities</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Live procurement logstream
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 flex-1">
                  <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Polling latest approvals...
                  </p>
                </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${activity.color} mt-1.5 shrink-0 shadow-sm`} />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-800 leading-tight">{activity.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400">{activity.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Detailed Sub-view Content */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveView('dashboard')
                  navigate('/perolehan')
                }}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs"
              >
                <span>← Kembali ke Operations Portal</span>
              </button>
            </div>

            {activeView === 'pengurusan' && (
              <PengurusanBudgetTab
                hierarchy={hierarchy}
                warrants={warrants}
                onOpenAddWarrant={() => {
                  setWarrantInitialType('warrant')
                  setIsAddWarrantOpen(true)
                }}
                onOpenCreatePO={(code) => openCreatePOWithPreset(code || '020200')}
              />
            )}

            {activeView === 'pembangunan' && (
              <PembangunanBudgetTab
                hierarchy={hierarchy}
                pembangunan={pembangunan}
                onOpenAddWarrant={() => {
                  setWarrantInitialType('pembangunan')
                  setIsAddWarrantOpen(true)
                }}
                onOpenCreatePO={() => openCreatePOWithPreset('P42')}
              />
            )}

            {activeView === 'orders' && (
              <PurchaseOrdersTab
                orders={orders}
                lpos={lpos}
                onRefresh={fetchDashboardData}
                onOpenCreatePO={() => openCreatePOWithPreset('020200')}
                onViewLPO={(lpo) => setSelectedLPOForView(lpo)}
              />
            )}

            {activeView === 'receiving_payments' && (
              <ReceivingPaymentsTab
                lpos={lpos}
                receivingRecords={receivingRecords}
                payments={payments}
                onOpenRecordPayment={(lpo) => setSelectedLPOForPayment(lpo)}
                onRefresh={fetchDashboardData}
              />
            )}

            {activeView === 'catalog' && (
              <PerihalSuppliersTab
                catalogItems={catalogItems}
                suppliers={suppliers}
                onRefresh={fetchDashboardData}
              />
            )}
          </div>
        )}

        {/* Modals */}
        <CreateAdminPOModal
          isOpen={isCreatePOOpen}
          onClose={() => setIsCreatePOOpen(false)}
          onSuccess={fetchDashboardData}
          preselectedBudgetType={poPreselectedBudgetType}
          preselectedProgramCode={poPreselectedProgramCode}
        />

        <AdminLpoViewerModal
          isOpen={!!selectedLPOForView}
          onClose={() => setSelectedLPOForView(null)}
          lpo={selectedLPOForView}
        />

        <RecordPaymentModal
          isOpen={!!selectedLPOForPayment}
          onClose={() => setSelectedLPOForPayment(null)}
          onSuccess={fetchDashboardData}
          lpo={selectedLPOForPayment}
        />

        <AddWarrantModal
          isOpen={isAddWarrantOpen}
          onClose={() => setIsAddWarrantOpen(false)}
          onSuccess={fetchDashboardData}
          initialType={warrantInitialType}
        />
      </div>
    </div>
  )
}

export default MyPerolehanDashboard
