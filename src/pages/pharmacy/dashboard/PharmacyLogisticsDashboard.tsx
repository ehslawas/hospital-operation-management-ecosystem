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
    bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
    light: 'bg-teal-50',
    icon: 'bg-teal-100 text-teal-600',
    text: 'text-teal-600',
    border: 'border-teal-200',
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    light: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    light: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
    light: 'bg-rose-50',
    icon: 'bg-rose-100 text-rose-600',
    text: 'text-rose-600',
    border: 'border-rose-200',
  },
  info: {
    bg: 'bg-gradient-to-br from-sky-500 to-sky-600',
    light: 'bg-sky-50',
    icon: 'bg-sky-100 text-sky-600',
    text: 'text-sky-600',
    border: 'border-sky-200',
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-500 to-violet-600',
    light: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
    text: 'text-violet-600',
    border: 'border-violet-200',
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
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
        'bg-white border shadow-sm hover:shadow-md',
        link && 'cursor-pointer',
        colors.border
      )}
    >
      {/* Background pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
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

      <div className="mt-4 relative z-10">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {changeLabel && <p className="text-xs text-gray-400 mt-1">{changeLabel}</p>}
      </div>

      {link && (
        <div className="absolute bottom-4 right-4">
          <ChevronRight className={cn('w-5 h-5', colors.text)} />
        </div>
      )}
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
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 rounded-3xl px-8 py-5 text-white"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pharmacy Logistics</h1>
                <p className="text-teal-100 text-sm">Central inventory & supply chain management</p>
              </div>
            </div>
            <p className="text-teal-50 max-w-lg">
              Welcome back, <span className="font-semibold">{user?.full_name?.split(' ')[0]}</span>! 
              Manage inventory, procurement, and distribution for the Pharmacy department.
            </p>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-teal-200 text-sm">Today</p>
            <p className="text-xl font-semibold">
              {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-white/80 hover:text-white hover:bg-white/10"
              onClick={loadDashboardData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics - Primary Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Operations Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          Operations Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Badge variant="error" size="sm">
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

