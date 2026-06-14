import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Package,
    ShoppingCart,
    AlertTriangle,
    ChevronRight,
    Wind,
    BarChart3,
    RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useMenuStore } from '@/stores/menuStore'
import { Spinner } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { getDashboardStats } from '@/services/pharmacy/pharmacyDashboardService'
import type { PharmacyDashboardStats } from '@/types/pharmacy'

/**
 * Condensed Stat Card for Widget use
 */
const MiniStatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ElementType
    color: string
    link?: string
    subtitle?: string
}> = ({ title, value, icon: Icon, color, link, subtitle }) => {
    const content = (
        <div className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
                    <p className="text-[10px] font-medium text-gray-500 truncate uppercase tracking-wider">{title}</p>
                </div>
            </div>
            {subtitle && <p className="text-[10px] text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
    )

    if (link) return <Link to={link}>{content}</Link>
    return content
}

/**
 * PharmacyLogisticsWidget
 * A summary widget to be embedded in other department dashboards
 */
export const PharmacyLogisticsWidget: React.FC = () => {
    const { user } = useAuthStore()
    const { menus } = useMenuStore()
    const [stats, setStats] = useState<PharmacyDashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasPermission, setHasPermission] = useState(false)

    // Check if user has permission to access pharmacy logistics
    useEffect(() => {
        // Check if any menu item or header belongs to pharmacy_logistics
        const checkPermission = (items: any[]): boolean => {
            for (const item of items) {
                if (item.module_code === 'pharmacy_logistics' || item.path?.includes('pharmacy')) return true
                if (item.children && checkPermission(item.children)) return true
            }
            return false
        }

        setHasPermission(checkPermission(menus))
    }, [menus])

    useEffect(() => {
        if (hasPermission && user?.hospital_id) {
            loadStats()
        } else if (!hasPermission) {
            setIsLoading(false)
        }
    }, [hasPermission, user?.hospital_id])

    const loadStats = async () => {
        setIsLoading(true)
        try {
            const result = await getDashboardStats(user?.hospital_id || '')
            if (result.data) {
                setStats(result.data)
            }
        } catch (error) {
            console.error('Error loading pharmacy widget stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!hasPermission) return null

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Spinner size="sm" className="mb-2" />
                <p className="text-xs text-gray-500 font-medium">Checking logistics access...</p>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
            {/* Widget Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Pharmacy & Logistics</h3>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">Real-time Summary</p>
                    </div>
                </div>
                <button
                    onClick={loadStats}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-teal-600"
                    title="Refresh stats"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Widget Grid */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MiniStatCard
                    title="Common Drugs"
                    value={stats?.inventory?.drugs_count || 0}
                    subtitle={`${stats?.inventory?.low_stock_count || 0} items low stock`}
                    icon={Package}
                    color="bg-teal-500"
                    link={ROUTES.PHARMACY_INVENTORY}
                />
                <MiniStatCard
                    title="Oxygen Supply"
                    value={stats?.oxygen?.full_cylinders || 0}
                    subtitle={`Total: ${stats?.oxygen?.total_cylinders || 0} cylinders`}
                    icon={Wind}
                    color="bg-blue-500"
                    link={ROUTES.PHARMACY_OXYGEN}
                />
                <MiniStatCard
                    title="Near Expiry"
                    value={stats?.inventory?.near_expiry_count || 0}
                    subtitle="Expires within 30 days"
                    icon={AlertTriangle}
                    color="bg-rose-500"
                    link={ROUTES.PHARMACY_NEAR_EXPIRY}
                />
                <MiniStatCard
                    title="Procurement"
                    value={stats?.procurement?.pending_orders || 0}
                    subtitle={formatCurrency(stats?.procurement?.pending_value || 0)}
                    icon={ShoppingCart}
                    color="bg-amber-500"
                    link={ROUTES.PHARMACY_PO}
                />
            </div>

            {/* View Full Dashboard Link */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <Link
                    to={ROUTES.PHARMACY_DASHBOARD}
                    className="flex items-center justify-between text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors group"
                >
                    <span>OPEN FULL LOGISTICS MODULE</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </motion.div>
    )
}
