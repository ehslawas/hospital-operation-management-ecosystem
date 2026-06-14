import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  DollarSign,
  Users,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  RefreshCw,
  Box,
  Truck,
  ClipboardList,
  AlertCircle,
  XCircle,
  Clock,
  MoreVertical,
  Calendar,
  Layers,
  ArrowRightLeft,
  Timer,
  Megaphone,
  CheckCircle,
  BarChart3,
  Wind,
  Wrench,
  Info,
  Activity,
  ChevronRight
} from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'
import { Badge, Button, Spinner } from '@/components/ui'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { getDashboardStats } from '@/services/pharmacy/pharmacyDashboardService'
import type { PharmacyDashboardStats, PharmacyAlert } from '@/types/pharmacy'
import { MemoFeed } from '@/components/dashboard/MemoFeed'
import { CreateMemoModal } from '@/components/dashboard/CreateMemoModal'
import { ShareStockModal } from '@/components/dashboard/ShareStockModal'

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
        'relative overflow-hidden rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-5 transition-all duration-300 min-h-[120px] xs:min-h-[140px]',
        'bg-white border shadow-sm hover:shadow-md',
        link && 'cursor-pointer touch-target',
        colors.border
      )}
    >
      {/* Background pattern - Responsive */}
      <div className="absolute top-0 right-0 -mt-2 -mr-2 xs:-mt-3 xs:-mr-3 sm:-mt-4 sm:-mr-4 w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className={cn('w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon className="w-5 h-5 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-0.5 xs:gap-1 text-[10px] xs:text-xs font-semibold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full flex-shrink-0',
              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
            ) : (
              <ArrowDownRight className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mt-3 xs:mt-4 relative z-10 min-w-0">
        <h3 className="text-2xl xs:text-3xl font-bold text-gray-900 truncate">{value}</h3>
        <p className="text-xs xs:text-sm font-medium text-gray-600 mt-1 line-clamp-2">{title}</p>
        {subtitle && <p className="text-[10px] xs:text-xs text-gray-400 mt-0.5 line-clamp-1">{subtitle}</p>}
        {changeLabel && <p className="text-[10px] xs:text-xs text-gray-400 mt-1 line-clamp-1">{changeLabel}</p>}
      </div>

      {link && (
        <div className="absolute bottom-3 xs:bottom-4 right-3 xs:right-4">
          <ChevronRight className={cn('w-4 h-4 xs:w-5 xs:h-5', colors.text)} />
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
    critical: <AlertCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-rose-600" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-600" />,
    info: <Activity className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-sky-600" />,
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
          'flex items-start gap-2 xs:gap-3 p-2.5 xs:p-3 rounded-lg xs:rounded-xl border transition-all hover:shadow-sm touch-target min-h-[64px]',
          bgMap[alert.type]
        )}
      >
        <div className="flex-shrink-0 mt-0.5">{iconMap[alert.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs xs:text-sm font-medium text-gray-900 line-clamp-2">{alert.title}</p>
          <p className="text-[10px] xs:text-xs text-gray-600 mt-0.5 line-clamp-1">{alert.message}</p>
          <p className="text-[10px] xs:text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 flex-shrink-0" />
            <span className="truncate">{formatDate(new Date(alert.timestamp), { hour: 'numeric', minute: 'numeric' })}</span>
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
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
  <Link to={link} className="block touch-target min-h-[64px] xs:min-h-[72px]">
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 rounded-lg xs:rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer h-full"
    >
      <div className={cn('w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm xs:text-base font-semibold text-gray-900 truncate">{label}</p>
        <p className="text-[10px] xs:text-xs text-gray-500 line-clamp-1 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 flex-shrink-0" />
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
  const [showMemoModal, setShowMemoModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)

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
    <div className="space-y-4 xs:space-y-6 sm:space-y-8 p-3 xs:p-4 sm:p-6 pt-6 xs:pt-8 sm:pt-10 overflow-x-hidden">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-4 xs:p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm xs:text-base text-gray-700">
              Welcome back, <span className="font-semibold text-gray-900">{user?.full_name?.split(' ')[0]}</span>!
              <span className="hidden sm:inline"> Manage inventory, procurement, and distribution for the Pharmacy department.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 touch-target"
              onClick={loadDashboardData}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              size="sm"
              onClick={() => setShowMemoModal(true)}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Post Announcement
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
              onClick={() => setShowStockModal(true)}
              title="Share Stock Status"
            >
              <AlertTriangle className="w-4 h-3 sm:mr-2" />
              <span className="hidden sm:inline">Stock Alert</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics - Primary Stats */}
      <div>
        <h2 className="text-base xs:text-lg font-semibold text-gray-900 mb-3 xs:mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 text-teal-600 flex-shrink-0" />
          <span className="truncate">Key Metrics</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
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
        <h2 className="text-base xs:text-lg font-semibold text-gray-900 mb-3 xs:mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 xs:w-5 xs:h-5 text-teal-600 flex-shrink-0" />
          <span className="truncate">Operations Overview</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1 bg-white rounded-xl xs:rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col"
        >
          <div className="p-3 xs:p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base xs:text-lg font-semibold text-gray-900 flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 xs:w-5 xs:h-5 text-rose-500 flex-shrink-0" />
                <span className="truncate">Active Alerts</span>
              </h2>
              <Badge variant="error" size="sm" className="flex-shrink-0">
                {stats?.alerts.length || 0}
              </Badge>
            </div>
          </div>

          <div className="p-3 xs:p-4 space-y-2 xs:space-y-3 flex-1 overflow-y-auto min-h-0 max-h-[300px] xs:max-h-[350px] sm:max-h-[400px]">
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
          className="md:col-span-2 bg-white rounded-xl xs:rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="p-3 xs:p-4 sm:p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base xs:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 xs:w-5 xs:h-5 text-teal-600 flex-shrink-0" />
              <span className="truncate">Quick Actions</span>
            </h2>
          </div>

          <div className="p-3 xs:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3">
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
        <h2 className="text-base xs:text-lg font-semibold text-gray-900 mb-3 xs:mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 xs:w-5 xs:h-5 text-teal-600 flex-shrink-0" />
          <span className="truncate">Summary Overview</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
          {/* Procurement Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 p-3 xs:p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3 xs:mb-4 pb-2 xs:pb-3 border-b border-gray-100 gap-2">
              <h3 className="text-sm xs:text-base font-semibold text-gray-900 flex items-center gap-1.5 xs:gap-2 min-w-0">
                <ShoppingCart className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-teal-600 flex-shrink-0" />
                <span className="truncate">Procurement</span>
              </h3>
              <Badge variant="primary" size="sm" className="flex-shrink-0 text-[10px] xs:text-xs">This Month</Badge>
            </div>
            <div className="space-y-2 xs:space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs xs:text-sm text-gray-600 truncate">Orders This Month</span>
                <span className="text-sm xs:text-base font-semibold flex-shrink-0">{stats?.procurement.orders_this_month || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs xs:text-sm text-gray-600 truncate">Total Value</span>
                <span className="text-sm xs:text-base font-semibold text-emerald-600 flex-shrink-0 text-right">
                  {formatCurrency(stats?.procurement.orders_value_this_month || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs xs:text-sm text-gray-600 truncate">Pending Deliveries</span>
                <span className="text-sm xs:text-base font-semibold text-amber-600 flex-shrink-0">{stats?.procurement.pending_deliveries || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs xs:text-sm text-gray-600 truncate">Active Suppliers</span>
                <span className="text-sm xs:text-base font-semibold flex-shrink-0">{stats?.procurement.supplier_count || 0}</span>
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

      {/* Hospital Announcements Feed */}
      <MemoFeed limit={3} />


      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-400 py-4"
      >
        Last updated: {formatDate(lastRefresh, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
      </motion.div>

      <CreateMemoModal isOpen={showMemoModal} onClose={() => setShowMemoModal(false)} />
      <ShareStockModal isOpen={showStockModal} onClose={() => setShowStockModal(false)} />
    </div>
  )
}

export default PharmacyLogisticsDashboard
