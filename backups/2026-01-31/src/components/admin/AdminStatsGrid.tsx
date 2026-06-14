import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

export interface StatItem {
    label: string
    value: string | number
    icon: LucideIcon
    color: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate'
    trend?: {
        value: string
        isPositive: boolean
    }
    description?: string
}

interface AdminStatsGridProps {
    stats: StatItem[]
    isLoading?: boolean
}

const colorConfig = {
    blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-100',
        iconBg: 'bg-blue-100',
        shadow: 'shadow-blue-900/5'
    },
    emerald: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        iconBg: 'bg-emerald-100',
        shadow: 'shadow-emerald-900/5'
    },
    rose: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-100',
        iconBg: 'bg-rose-100',
        shadow: 'shadow-rose-900/5'
    },
    amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
        iconBg: 'bg-amber-100',
        shadow: 'shadow-amber-900/5'
    },
    indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100',
        iconBg: 'bg-indigo-100',
        shadow: 'shadow-indigo-900/5'
    },
    slate: {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-100',
        iconBg: 'bg-slate-100',
        shadow: 'shadow-slate-900/5'
    }
}

export const AdminStatsGrid: React.FC<AdminStatsGridProps> = ({
    stats,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-slate-100/50" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const config = colorConfig[stat.color] || colorConfig.slate
                const Icon = stat.icon

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                        {/* Background Decoration */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${config.bg} opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500`} />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${config.iconBg} ${config.text} ${config.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                {stat.trend && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {stat.trend.isPositive ? '+' : ''}{stat.trend.value}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {stat.value}
                                </h3>
                                <p className="text-sm font-medium text-slate-500">
                                    {stat.label}
                                </p>
                            </div>

                            {stat.description && (
                                <p className="mt-3 text-xs text-slate-400 font-medium">
                                    {stat.description}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
