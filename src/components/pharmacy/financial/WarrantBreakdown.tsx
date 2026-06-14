import React from 'react'
import { motion } from 'framer-motion'
import { PieChart, BarChart3, Wallet, ArrowRight } from 'lucide-react'
import type { WarrantSummary } from '@/types/pharmacy'
import { CATEGORY_COLORS, DEPARTMENT_COLORS } from './constants'
import { WARRANT_CATEGORIES, WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'

interface WarrantBreakdownProps {
    summary: WarrantSummary
    currencyFormatter: (value: number) => string
}

export const WarrantBreakdown: React.FC<WarrantBreakdownProps> = ({
    summary,
    currencyFormatter,
}) => {
    const getCategoryLabel = (value: string) => {
        return WARRANT_CATEGORIES.find((c) => c.value === value)?.label || value
    }

    const getDepartmentLabel = (value: string) => {
        return WARRANT_DEPARTMENTS.find((d) => d.value === value)?.label || value
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vote Code Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Vote Code Allocation</h3>
                    </div>

                    <div className="space-y-4">
                        {summary.by_vote_code.map((item) => (
                            <div key={item.vote_code} className="group p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {item.vote_code}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {item.vote_code === '080702' ? 'Operating (CC)' : 'Development (APPL)'}
                                        </span>
                                    </div>
                                    <span className="font-bold text-slate-900">{currencyFormatter(item.allocation)}</span>
                                </div>

                                <div className="relative pt-2">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Used: {currencyFormatter(item.expenses)}</span>
                                        <span>{((item.expenses / (item.allocation || 1)) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.vote_code === '080702' ? 'bg-indigo-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${Math.min((item.expenses / (item.allocation || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {summary.by_vote_code.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No allocation data available
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <PieChart className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Category Breakdown</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {summary.by_category.slice(0, 6).map((item) => (
                            <div key={item.category} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 rounded-full ${CATEGORY_COLORS[item.category].split(' ')[0]}`} />
                                    <div>
                                        <h4 className="font-medium text-slate-800 text-sm">{getCategoryLabel(item.category)}</h4>
                                        <p className="text-xs text-slate-500">{item.count} warrants</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 text-sm">{currencyFormatter(item.allocation)}</p>
                                    <p className="text-xs text-slate-500">
                                        {((item.allocation / (summary.total_allocation || 1)) * 100).toFixed(1)}% of total
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {summary.by_category.length > 6 && (
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
                            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 transition-colors">
                                View All Categories <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Department Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Department Allocation</h3>
                </div>

                {/* Department Breakdown Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-100">
                                <th className="pb-3 font-medium pl-2">Department</th>
                                <th className="pb-3 font-medium text-right">Count</th>
                                <th className="pb-3 font-medium text-right">Allocated</th>
                                <th className="pb-3 font-medium text-right text-orange-600">Liabilities</th>
                                <th className="pb-3 font-medium text-right text-blue-600">Net Expenses</th>
                                <th className="pb-3 font-medium text-right">Total Used</th>
                                <th className="pb-3 font-medium text-right">Balance</th>
                                <th className="pb-3 font-medium w-32 text-center">Utilization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {summary.by_department.map((item) => (
                                <tr key={item.department} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 pl-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${DEPARTMENT_COLORS[item.department].split(' ')[0]}`} />
                                            <span className="font-medium text-slate-700">{getDepartmentLabel(item.department)}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right text-slate-500 font-mono text-xs">{item.count}</td>
                                    <td className="py-3 text-right font-medium text-slate-900">{currencyFormatter(item.allocation)}</td>
                                    <td className="py-3 text-right font-medium text-orange-600">{currencyFormatter(item.liabilities)}</td>
                                    <td className="py-3 text-right font-medium text-blue-600">{currencyFormatter(item.net_expenses)}</td>
                                    <td className="py-3 text-right font-medium text-rose-600">{currencyFormatter(item.expenses)}</td>
                                    <td className="py-3 text-right font-medium text-emerald-600">{currencyFormatter(item.balance)}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${DEPARTMENT_COLORS[item.department].split(' ')[0]}`}
                                                    style={{ width: `${item.allocation > 0 ? Math.min((item.expenses / item.allocation) * 100, 100) : 0}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                                                {item.allocation > 0 ? ((item.expenses / item.allocation) * 100).toFixed(0) : '0'}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
