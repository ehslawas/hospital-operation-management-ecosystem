import React from 'react'
import { AlertTriangle, BarChart3, PieChart } from 'lucide-react'
import { motion } from 'framer-motion'

interface FinancialStatsGridProps {
    liabilities: number
    netExpenses: number
    usageRate: number
    currencyFormatter: (value: number) => string
}

export const FinancialStatsGrid: React.FC<FinancialStatsGridProps> = ({
    liabilities,
    netExpenses,
    usageRate,
    currencyFormatter,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Liabilities */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-amber-200/50 transition-colors"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertTriangle className="w-24 h-24 text-amber-500 transform rotate-12 translate-x-4 -translate-y-4" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 shadow-sm group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Liabilities</h3>
                    </div>

                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                            {currencyFormatter(liabilities)}
                        </p>
                        <p className="text-xs font-medium text-amber-600/80 bg-amber-50 inline-block px-2 py-0.5 rounded-full border border-amber-100">
                            Committed
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Net Expenses */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-royal-blue/30 transition-colors"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart3 className="w-24 h-24 text-royal-blue transform rotate-12 translate-x-4 -translate-y-4" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-5 h-5 text-royal-blue" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Net Expenses</h3>
                    </div>

                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                            {currencyFormatter(netExpenses)}
                        </p>
                        <p className="text-xs font-medium text-blue-600/80 bg-blue-50 inline-block px-2 py-0.5 rounded-full border border-blue-100">
                            Actual Utilized
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Usage Rate */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-200/50 transition-colors"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PieChart className="w-24 h-24 text-emerald-500 transform rotate-12 translate-x-4 -translate-y-4" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform">
                            <PieChart className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Usage Rate</h3>
                    </div>

                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                            {usageRate.toFixed(2)}%
                        </p>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                style={{ width: `${Math.min(usageRate, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
