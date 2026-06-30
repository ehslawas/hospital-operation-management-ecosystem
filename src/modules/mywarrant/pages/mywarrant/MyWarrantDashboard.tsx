// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  ChevronRight
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { supabase } from '@/services/supabase'
import { motion } from 'framer-motion'

interface DashboardStats {
  totalBudget: number
  utilizationPercent: number
  activeContracts: number
  pendingApprovals: number
}

interface ActivityLog {
  title: string
  sub: string
  time: string
  color: string
}

export const MyWarrantDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalBudget: 0,
    utilizationPercent: 0,
    activeContracts: 0,
    pendingApprovals: 0
  })
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // 1. Fetch Total Budget
        const { data: warrantData } = await supabase
          .from('pharmacy_warrants')
          .select('amount')
        
        const totalBudget = warrantData?.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0) || 0

        // 2. Fetch Utilized Budget (Approved POs)
        const { data: poData } = await supabase
          .from('pharmacy_purchase_orders')
          .select('total_amount, status')
        
        const utilizedBudget = poData?.filter(po => po.status === 'approved' || po.status === 'sent')
          .reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0) || 0
        
        const pendingApprovals = poData?.filter(po => po.status === 'draft').length || 0

        const utilizationPercent = totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0

        // 3. Fetch Active Contracts
        const { count: contractCount } = await supabase
          .from('pharmacy_lou')
          .select('*', { count: 'exact', head: true })

        // 4. Fetch Recent Activities
        const { data: logs } = await supabase
          .from('approval_logs')
          .select(`
            id,
            action,
            notes,
            created_at,
            entity_type
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        const mappedActivities = logs?.map(log => {
          let title = 'System Activity'
          let color = 'bg-indigo-500'
          
          if (log.action?.includes('approved')) {
            title = 'Request Approved'
            color = 'bg-emerald-500'
          } else if (log.action?.includes('rejected')) {
            title = 'Request Rejected'
            color = 'bg-rose-500'
          } else if (log.action?.includes('draft')) {
            title = 'New Draft Created'
            color = 'bg-amber-500'
          }

          // Format time (e.g., "2 hours ago")
          const diffMs = new Date().getTime() - new Date(log.created_at).getTime()
          const diffMins = Math.floor(diffMs / 60000)
          const diffHours = Math.floor(diffMins / 60)
          const diffDays = Math.floor(diffHours / 24)
          
          let timeStr = 'Just now'
          if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
          else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
          else if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`

          return {
            title,
            sub: log.notes || `${log.entity_type} processed`,
            time: timeStr,
            color
          }
        }) || []

        setStats({
          totalBudget,
          utilizationPercent,
          activeContracts: contractCount || 0,
          pendingApprovals
        })
        setActivities(mappedActivities)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-[#fcfdfe] relative font-sans overflow-x-hidden pb-16">
      {/* Premium Ambient Radial Lights */}
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
            <button onClick={() => navigate('/pharmacy')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              Pharmacy
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-extrabold tracking-wide">Operations Dashboard</span>
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
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">System Operational</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Central Operations Ledger Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Budget Overview */}
          <Link 
            to={ROUTES.PHARMACY_BUDGET} 
            className="group bg-white border-2 border-slate-100 hover:border-blue-200 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-blue-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <PieChart className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">Budget Overview</h3>
              <p className="text-slate-400 font-semibold text-[11px]">Status & performance metrics</p>
            </div>
            <div className="flex items-center text-blue-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              EXPLORE <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Warrant Management */}
          <Link 
            to={ROUTES.PHARMACY_WARRANT} 
            className="group bg-white border-2 border-slate-100 hover:border-emerald-200 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Wallet className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allocation</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">Warrant Management</h3>
              <p className="text-slate-400 font-semibold text-[11px]">Distribution & limits control</p>
            </div>
            <div className="flex items-center text-emerald-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              MANAGE <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Purchase Orders */}
          <Link 
            to={ROUTES.PHARMACY_PO} 
            className="group bg-white border-2 border-slate-100 hover:border-indigo-200 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.02] group-hover:bg-indigo-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <ShoppingCart className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Procurement</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">Purchase Orders</h3>
              <p className="text-slate-400 font-semibold text-[11px]">Registry lifecycle & tracking</p>
            </div>
            <div className="flex items-center text-indigo-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              PROCURE <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* LOU & Penalties */}
          <Link 
            to={ROUTES.PHARMACY_LOU} 
            className="group bg-white border-2 border-slate-100 hover:border-purple-200 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-purple-100/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/[0.02] group-hover:bg-purple-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contracts</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors leading-tight">LOU & Penalties</h3>
              <p className="text-slate-400 font-semibold text-[11px]">Deficits & performance logs</p>
            </div>
            <div className="flex items-center text-purple-600 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              TRACK <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Item Catalogs */}
          <Link 
            to={ROUTES.PHARMACY_CATALOG} 
            className="group bg-white border-2 border-slate-100 hover:border-slate-300 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[190px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/[0.02] group-hover:bg-slate-500/[0.04] rounded-full -mr-6 -mt-6 transition-colors duration-300" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm group-hover:bg-slate-850 group-hover:text-white transition-all duration-300">
                <ClipboardList className="w-5.5 h-5.5" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Directory</span>
            </div>
            <div className="space-y-1 mt-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-slate-950 transition-colors leading-tight">Item Catalogs</h3>
              <p className="text-slate-400 font-semibold text-[11px]">Drugs & logistics indices</p>
            </div>
            <div className="flex items-center text-slate-800 text-[10px] font-black tracking-widest gap-1 pt-4 border-t border-slate-100/50 mt-4 relative z-10">
              VIEW <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Dynamic Multi-Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Statistics Metric Cards */}
          <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-xl shadow-slate-200/20 flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl flex items-center justify-center shadow-md">
                <BarChart3 className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Statistics</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time ledger overview</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 flex-1">
                <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing real-time values...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                {/* Total Allocated */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-blue-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Allocated Budget</p>
                  <div className="space-y-1 flex-1 flex flex-col justify-end">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                      RM {stats.totalBudget.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-400">Total hospital warrants registry</p>
                  </div>
                </div>

                {/* Utilization */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-emerald-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Budget Utilization</p>
                  <div className="space-y-2 flex-1 flex flex-col justify-end">
                    <div className="flex items-end justify-between">
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats.utilizationPercent}%</h4>
                      <span className="text-[10px] font-bold text-emerald-600">Active</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${stats.utilizationPercent}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Active Contracts */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-purple-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Contracts</p>
                  <div className="space-y-1 flex-1 flex flex-col justify-end">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{stats.activeContracts.toString().padStart(2, '0')}</h4>
                    <p className="text-[10px] font-semibold text-slate-400">Total verified agreements</p>
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col justify-between hover:border-orange-100 hover:shadow-md hover:shadow-slate-100/40 transition-all duration-300">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Pending Action</p>
                  <div className="space-y-1 flex-1 flex flex-col justify-end">
                    <h4 className="text-3xl font-black text-orange-600 tracking-tight tabular-nums">{stats.pendingApprovals.toString().padStart(2, '0')}</h4>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live procurement logstream</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 flex-1">
                <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching system logstream...</p>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4 flex-1">
                {activities.map((activity, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-4 hover:bg-slate-50/80 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100 group cursor-pointer"
                  >
                    <div className={cn("h-3 w-3 rounded-full mt-1.5 shadow-sm group-hover:scale-125 transition-transform shrink-0", activity.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{activity.title}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{activity.sub}</p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">
                        <Clock className="w-3.5 h-3.5" /> {activity.time}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0 self-center" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex-1">
                <LayoutDashboard className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No recent log records found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default MyWarrantDashboard
