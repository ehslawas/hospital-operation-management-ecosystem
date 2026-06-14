import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Activity,
    Users,
    Building2,
    HardDrive,
    AlertTriangle,
    CheckCircle,
    TrendingUp
} from 'lucide-react'
import { systemAnalyticsService } from '@/services/systemAnalyticsService'
import type { AggregatedSystemAnalytics } from '@/types/systemAdmin.types'
import { Card, LoadingOverlay } from '@/components/ui'

const SystemAdminDashboard = () => {
    const [analytics, setAnalytics] = useState<AggregatedSystemAnalytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const { data } = await systemAnalyticsService.getOverviewStats()
            if (data) {
                setAnalytics(data)
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingOverlay message="Loading System Overview..." />

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
                    <p className="text-slate-500">Global insights across all hospital tenants</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100">
                    <Activity className="w-4 h-4" />
                    <span>System Healthy</span>
                </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Tenants"
                    value={analytics?.overview.total_tenants || 0}
                    icon={Building2}
                    color="blue"
                    subtext={`${analytics?.overview.active_tenants_last_24h || 0} active in 24h`}
                />
                <StatsCard
                    title="Total Users"
                    value={analytics?.overview.total_users_system_wide.toLocaleString() || 0}
                    icon={Users}
                    color="indigo"
                    subtext="Across all hospitals"
                />
                <StatsCard
                    title="Storage Used"
                    value={`${analytics?.overview.total_storage_gb || 0} GB`}
                    icon={HardDrive}
                    color="amber"
                    subtext="Database & Assets"
                />
                <StatsCard
                    title="API Load"
                    value={`${analytics?.system_load.api_requests_per_min || 0}/min`}
                    icon={TrendingUp}
                    color="emerald"
                    subtext="Request Rate"
                />
            </div>

            {/* System Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                    <h3 className="font-semibold text-lg mb-4">Tenant Growth</h3>
                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        {/* Chart Placeholder */}
                        <p className="text-slate-400">Growth Chart Visualization</p>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Resource Usage</h3>
                    <div className="space-y-4">
                        <ResourceBar
                            label="CPU Usage"
                            value={analytics?.system_load.cpu_average || 0}
                            color="bg-blue-500"
                        />
                        <ResourceBar
                            label="Memory Usage"
                            value={analytics?.system_load.memory_average || 0}
                            color="bg-purple-500"
                        />
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-600">Database Connections</span>
                                <span className="font-medium text-slate-900">45/100</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

const StatsCard = ({ title, value, icon: Icon, color, subtext }: any) => {
    const colorStyles: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    }

    return (
        <Card className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </Card>
    )
}

const ResourceBar = ({ label, value, color }: any) => (
    <div>
        <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">{label}</span>
            <span className="font-medium text-slate-900">{value}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
            <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
)

export default SystemAdminDashboard
