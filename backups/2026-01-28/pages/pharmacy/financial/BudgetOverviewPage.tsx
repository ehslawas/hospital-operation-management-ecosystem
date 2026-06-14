import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Wallet, PieChart, Calendar, AlertTriangle, FileDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Spinner, Badge, Select } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { FinancialStatsGrid } from '@/components/pharmacy/financial/FinancialStatsGrid'
import { getBudgetSummary, getBudgets } from '@/services/pharmacy/budgetService'
import type { BudgetSummary, Budget } from '@/types/pharmacy'

export const BudgetOverviewPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!isSessionReady || !hospitalId) return

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const [summaryRes, budgetsRes] = await Promise.all([
        getBudgetSummary(hospitalId, fiscalYear),
        getBudgets(hospitalId, fiscalYear),
      ])

      if (summaryRes.error) {
        setError(summaryRes.error)
      } else {
        setSummary(summaryRes.data)
      }

      if (budgetsRes.data) {
        setBudgets(budgetsRes.data)
      }

      setIsLoading(false)
    }

    void load()
  }, [isSessionReady, hospitalId, fiscalYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  const headerActions = (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-500" />
      <Select
        value={fiscalYear.toString()}
        onChange={(e) => setFiscalYear(Number(e.target.value))}
        className="w-32"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            FY {year}
          </option>
        ))}
      </Select>
    </div>
  )

  return (
    <FinancialPageLayout
      title="Budget Overview"
      description="Monitor pharmacy budget allocation, commitment, and actual utilization across all funds."
      icon={DollarSign}
      breadcrumbs={[{ label: 'Budget Overview' }]}
      actions={headerActions}
      notice={{
        title: `Fiscal Year ${fiscalYear} Overview`,
        message: 'This dashboard provides a consolidated view of all pharmacy budgets, including details on committed vs. actual usage.',
        type: 'info'
      }}
    >
      <div className="space-y-8">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Failed to load budget data</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {!isLoading && !error && summary && (
          <>
            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Allocation */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div className="text-emerald-100 bg-emerald-500/30 px-2 py-1 rounded-lg backdrop-blur-sm border border-emerald-400/30">
                      <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                    </div>
                  </div>
                  <p className="text-emerald-100 text-sm font-medium mb-1 tracking-wide">Total Allocation</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.total_allocated)}</p>
                </div>
              </div>

              {/* Total Utilized (Expenses) */}
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="text-rose-100 bg-rose-500/30 px-2 py-1 rounded-lg backdrop-blur-sm border border-rose-400/30">
                      <span className="text-xs font-bold uppercase tracking-wider">Utilized</span>
                    </div>
                  </div>
                  <p className="text-rose-100 text-sm font-medium mb-1 tracking-wide">Total Utilized</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.total_utilized)}</p>
                  <p className="text-rose-200 text-xs mt-3 bg-rose-500/30 inline-block px-2 py-1 rounded-lg backdrop-blur-sm border border-rose-400/30">
                    {summary.utilization_percentage.toFixed(1)}% of allocation
                  </p>
                </div>
              </div>

              {/* Available Balance */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm font-medium mb-1 tracking-wide">Available Balance</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.total_available)}</p>
                  <p className="text-blue-200 text-xs mt-3 bg-blue-500/30 inline-block px-2 py-1 rounded-lg backdrop-blur-sm border border-blue-400/30">
                    {summary.total_allocated > 0
                      ? ((summary.total_available / summary.total_allocated) * 100).toFixed(1)
                      : '0'}% remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <FinancialStatsGrid
              liabilities={summary.total_committed}
              netExpenses={summary.total_utilized}
              usageRate={summary.utilization_percentage}
              currencyFormatter={formatCurrency}
            />

            {/* Charts & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget by Type */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-royal-blue flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-blue-500" />
                  Budget by Type
                </h2>
                <div className="space-y-6">
                  {summary.by_type.map((item) => (
                    <div key={item.type} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                          {item.type}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-800">
                            {formatCurrency(item.utilized)}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">
                            / {formatCurrency(item.allocated)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.allocated > 0 ? (item.utilized / item.allocated) * 100 : 0}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget by Category */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-royal-blue flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Budget by Category
                </h2>
                <div className="space-y-6">
                  {summary.by_category.map((item) => (
                    <div key={item.category} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 capitalize group-hover:text-purple-600 transition-colors">
                          {item.category.replace('_', ' ')}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-800">
                            {formatCurrency(item.utilized)}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">
                            / {formatCurrency(item.allocated)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.allocated > 0 ? (item.utilized / item.allocated) * 100 : 0}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget List */}
            <div className="glass-card rounded-2xl p-6 overflow-hidden">
              <h2 className="text-lg font-semibold text-royal-blue mb-4">Budget Allocations</h2>
              {budgets.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto mb-3">
                    <FileDown className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No budget allocations found</p>
                  <p className="text-sm text-slate-400 mt-1">There are no budgets for fiscal year {fiscalYear}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="pb-3 pl-2 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold text-right">Allocated</th>
                        <th className="pb-3 font-semibold text-right">Utilized</th>
                        <th className="pb-3 font-semibold text-right">Committed</th>
                        <th className="pb-3 font-semibold text-right">Available</th>
                        <th className="pb-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {budgets.map((budget) => (
                        <tr key={budget.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pl-2 font-medium text-slate-700 uppercase tracking-wide text-xs">{budget.budget_type}</td>
                          <td className="py-4 font-medium text-slate-800 capitalize">{budget.category.replace('_', ' ')}</td>
                          <td className="py-4 text-right font-mono text-slate-600">{formatCurrency(budget.allocated_amount)}</td>
                          <td className="py-4 text-right font-mono text-rose-600">{formatCurrency(budget.utilized_amount)}</td>
                          <td className="py-4 text-right font-mono text-amber-600">{formatCurrency(budget.committed_amount)}</td>
                          <td className="py-4 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(budget.available_amount)}
                          </td>
                          <td className="py-4 text-center">
                            <Badge variant={budget.status === 'active' ? 'success' : 'secondary'} className="px-2 py-0.5">
                              {budget.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </FinancialPageLayout>
  )
}

export default BudgetOverviewPage

