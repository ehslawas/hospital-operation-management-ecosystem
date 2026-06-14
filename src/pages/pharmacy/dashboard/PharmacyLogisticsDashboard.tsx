import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Package,
  Pill,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  ClipboardList,
  BarChart3,
  DollarSign,
  Wind,
  Calendar,
  Activity,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Layers,
  ArrowRightLeft,
  Timer,
  Megaphone,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Button, Spinner } from '@/components/ui'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { getDashboardStats } from '@/services/pharmacy/pharmacyDashboardService'
import type { PharmacyDashboardStats, PharmacyAlert } from '@/types/pharmacy'

// =====================================================
// STAT CARD COMPONENT
// =====================================================

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  link?: string
  subtitle?: string
}

const colorClasses = {
  primary: {
    bg: 'bg-teal-50/50',
    border: 'border-teal-100',
    icon: 'bg-teal-100 text-teal-600 border-teal-200',
    text: 'text-teal-900',
    subText: 'text-teal-900/60',
    accent: 'bg-teal-500/10'
  },
  success: {
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-100',
    icon: 'bg-emerald-100 text-emerald-600 border-emerald-100',
    text: 'text-emerald-900',
    subText: 'text-emerald-900/60',
    accent: 'bg-emerald-500/10'
  },
  warning: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-100',
    icon: 'bg-amber-100 text-amber-600 border-amber-100',
    text: 'text-amber-900',
    subText: 'text-amber-900/60',
    accent: 'bg-amber-500/10'
  },
  error: {
    bg: 'bg-rose-50/50',
    border: 'border-rose-100',
    icon: 'bg-rose-100 text-rose-600 border-rose-100',
    text: 'text-rose-900',
    subText: 'text-rose-900/60',
    accent: 'bg-rose-500/10'
  },
  info: {
    bg: 'bg-sky-50/50',
    border: 'border-sky-100',
    icon: 'bg-sky-100 text-sky-600 border-sky-100',
    text: 'text-sky-900',
    subText: 'text-sky-900/60',
    accent: 'bg-sky-500/10'
  },
  purple: {
    bg: 'bg-violet-50/50',
    border: 'border-violet-100',
    icon: 'bg-violet-100 text-violet-600 border-violet-100',
    text: 'text-violet-900',
    subText: 'text-violet-900/60',
    accent: 'bg-violet-500/10'
  },
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  link,
  subtitle,
}) => {
  const colors = colorClasses[color]
  const isPositive = change !== undefined && change > 0

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
      className={cn(
        'relative overflow-hidden rounded-[2.5rem] p-6 transition-all duration-300 border-2 shadow-sm group',
        colors.bg,
        colors.border,
        link && 'cursor-pointer'
      )}
    >
      {/* Background pattern */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 opacity-50", colors.accent)} />

      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm transition-transform group-hover:scale-110', colors.icon)}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm',
                isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <div>
          <p className={cn("text-sm font-bold uppercase tracking-wider", colors.subText)}>{title}</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={cn("text-4xl font-black tracking-tight", colors.text)}>{value}</h3>
          </div>
          {subtitle && <p className={cn("text-xs font-bold mt-2", colors.subText.replace('900/60', '600'))}>{subtitle}</p>}
          {changeLabel && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{changeLabel}</p>}
        </div>
      </div>
    </motion.div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }

  return content
}

// =====================================================
// ALERT ITEM COMPONENT
// =====================================================

interface AlertItemProps {
  alert: PharmacyAlert
  index: number
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, index }) => {
  const iconMap = {
    critical: <AlertCircle className="w-4 h-4 text-rose-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <Activity className="w-4 h-4 text-sky-600" />,
  }

  const bgMap = {
    critical: 'bg-rose-50 border-rose-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-sky-50 border-sky-200',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={alert.link || '#'}
        className={cn(
          'flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm',
          bgMap[alert.type]
        )}
      >
        <div className="flex-shrink-0 mt-0.5">{iconMap[alert.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{alert.message}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(new Date(alert.timestamp), { hour: 'numeric', minute: 'numeric' })}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </Link>
    </motion.div>
  )
}

// =====================================================
// QUICK ACTION COMPONENT
// =====================================================

interface QuickActionProps {
  icon: React.ElementType
  label: string
  description: string
  link: string
  color: string
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, description, link, color }) => (
  <Link to={link}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </motion.div>
  </Link>
)

// =====================================================
// MAIN DASHBOARD COMPONENT
// =====================================================

export const PharmacyLogisticsDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<PharmacyDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const result = await getDashboardStats(user?.hospital_id || '')
      if (result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
      setLastRefresh(new Date())
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 pt-10">
      {/* Welcome Header - Photo 2 Target */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#00a68a] via-[#00c2a0] to-[#10b981] rounded-3xl px-8 py-6 text-white shadow-lg border-none"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MyWarrant</h1>
              <p className="text-teal-50/80 text-sm font-medium">Central inventory & supply chain management</p>
              <p className="text-white mt-2 leading-relaxed opacity-90">
                Welcome back, <span className="font-bold underline decoration-white/30 underline-offset-4">{user?.full_name?.split(' ')[0]}</span>! 
                Manage inventory, procurement, and distribution for the Pharmacy department.
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Today</p>
              <p className="text-xl font-bold">
                {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white border border-white/20 rounded-xl px-4 gap-2 h-9"
              onClick={loadDashboardData}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics - Primary Stats */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-teal-600" />
          </div>
          Key Metrics
        </h2>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Inventory Items"
              value={stats?.inventory.total_items.toLocaleString() || '0'}
              subtitle={`${stats?.inventory.drugs_count || 0} drugs, ${stats?.inventory.non_drugs_count || 0} non-drugs`}
              icon={Package}
              color="primary"
              link={ROUTES.PHARMACY_INVENTORY}
            />
            <StatCard
              title="Low Stock Items"
              value={stats?.inventory.low_stock_count || 0}
              icon={AlertTriangle}
              color="warning"
              link={ROUTES.PHARMACY_INVENTORY}
              subtitle="Requires attention"
            />
            <StatCard
              title="Near Expiry"
              value={stats?.inventory.near_expiry_count || 0}
              icon={Timer}
              color="error"
              link={ROUTES.PHARMACY_NEAR_EXPIRY}
              subtitle="Within 30 days"
            />
            <StatCard
              title="Pending Orders"
              value={stats?.procurement.pending_orders || 0}
              subtitle={formatCurrency(stats?.procurement.pending_value || 0)}
              icon={ShoppingCart}
              color="info"
              link={ROUTES.PHARMACY_PO}
            />
          </div>
        </div>
      </div>

      {/* Operations Overview */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          Operations Overview
        </h2>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Budget Utilization"
              value={`${Math.round(stats?.budget.utilization_percentage || 0)}%`}
              subtitle={`${formatCurrency(stats?.budget.total_available || 0)} available`}
              icon={DollarSign}
              color="success"
              link={ROUTES.PHARMACY_BUDGET}
            />
            <StatCard
              title="Oxygen Cylinders"
              value={stats?.oxygen.total_cylinders || 0}
              subtitle={`${stats?.oxygen.full_cylinders || 0} full, ${stats?.oxygen.empty_cylinders || 0} empty`}
              icon={Wind}
              color="purple"
              link={ROUTES.PHARMACY_OXYGEN}
            />
            <StatCard
              title="Pending Transfers"
              value={stats?.distribution.pending_requests || 0}
              subtitle={`${stats?.distribution.in_transit || 0} in transit`}
              icon={ArrowRightLeft}
              color="info"
              link={ROUTES.PHARMACY_DISTRIBUTION}
            />
            <StatCard
              title="Slow Moving"
              value={stats?.inventory.slow_moving_count || 0}
              subtitle="No movement in 90 days"
              icon={TrendingDown}
              color="warning"
              link={ROUTES.PHARMACY_SLOW_MOVING}
            />
          </div>
        </div>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Active Alerts
              </h2>
              <Badge variant="error" size="sm" className="bg-rose-600 text-white border-none min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold px-1.5">
                {stats?.alerts.length || 0}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {stats?.alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                <p className="font-medium">All clear!</p>
                <p className="text-sm">No active alerts at the moment.</p>
              </div>
            ) : (
              stats?.alerts.map((alert, index) => (
                <AlertItem key={alert.id} alert={alert} index={index} />
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Quick Actions
            </h2>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <QuickAction
              icon={Package}
              label="View Inventory"
              description="Check stock levels and batches"
              link={ROUTES.PHARMACY_INVENTORY}
              color="bg-gradient-to-br from-teal-500 to-teal-600"
            />
            <QuickAction
              icon={ShoppingCart}
              label="Create Purchase Order"
              description="Order from suppliers"
              link={ROUTES.PHARMACY_PO_CREATE}
              color="bg-gradient-to-br from-sky-500 to-sky-600"
            />
            <QuickAction
              icon={ClipboardList}
              label="Receive Goods"
              description="Process deliveries"
              link={ROUTES.PHARMACY_RECEIVING}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <QuickAction
              icon={ArrowRightLeft}
              label="Transfer Request"
              description="Move stock between locations"
              link={ROUTES.PHARMACY_TRANSFER_REQUEST}
              color="bg-gradient-to-br from-violet-500 to-violet-600"
            />
            <QuickAction
              icon={Wind}
              label="Oxygen Management"
              description="Track cylinders & consumption"
              link={ROUTES.PHARMACY_OXYGEN}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <QuickAction
              icon={BarChart3}
              label="Reports"
              description="View analytics & reports"
              link={ROUTES.PHARMACY_REPORTS}
              color="bg-gradient-to-br from-amber-500 to-amber-600"
            />
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Summary Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Procurement Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" />
                Procurement
              </h3>
              <Badge variant="primary" size="sm">This Month</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Orders This Month</span>
                <span className="font-semibold">{stats?.procurement.orders_this_month || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(stats?.procurement.orders_value_this_month || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Deliveries</span>
                <span className="font-semibold text-amber-600">{stats?.procurement.pending_deliveries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Suppliers</span>
                <span className="font-semibold">{stats?.procurement.supplier_count || 0}</span>
              </div>
            </div>
          </motion.div>

          {/* Budget Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Budget Overview
              </h3>
              <Badge variant="info" size="sm">FY {stats?.budget.fiscal_year || new Date().getFullYear()}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Allocated</span>
                <span className="font-semibold">{formatCurrency(stats?.budget.total_allocated || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Utilized</span>
                <span className="font-semibold text-sky-600">{formatCurrency(stats?.budget.total_utilized || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Committed</span>
                <span className="font-semibold text-amber-600">{formatCurrency(stats?.budget.total_committed || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(stats?.budget.total_available || 0)}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.budget.utilization_percentage || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {Math.round(stats?.budget.utilization_percentage || 0)}% utilized
              </p>
            </div>
          </motion.div>

          {/* Distribution Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600" />
                Distribution
              </h3>
              <Badge variant="success" size="sm">Live</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Requests</span>
                <span className="font-semibold text-amber-600">{stats?.distribution.pending_requests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Transit</span>
                <span className="font-semibold text-sky-600">{stats?.distribution.in_transit || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Today</span>
                <span className="font-semibold text-emerald-600">{stats?.distribution.completed_today || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed This Month</span>
                <span className="font-semibold">{stats?.distribution.completed_this_month || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-400 py-4"
      >
        Last updated: {formatDate(lastRefresh, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
      </motion.div>
    </div>
  )
}

export default PharmacyLogisticsDashboard

