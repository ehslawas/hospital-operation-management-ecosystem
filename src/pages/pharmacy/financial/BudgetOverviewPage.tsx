import React, { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, TrendingUp, PieChart, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, Badge, Select } from '@/components/ui'
import { getBudgetSummary, getBudgets } from '@/services/pharmacy/budgetService'
import type { BudgetSummary, Budget } from '@/types/pharmacy'

export const BudgetOverviewPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!hospitalId) return

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
  }, [hospitalId, fiscalYear])

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Budget Overview
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor pharmacy budget allocation and utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
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
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load budget data</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <span className="text-sm font-medium text-emerald-700">Total Allocated</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">
                {formatCurrency(summary.total_allocated)}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <span className="text-sm font-medium text-blue-700">Utilized</span>
              <p className="text-2xl font-bold text-blue-800 mt-1">
                {formatCurrency(summary.total_utilized)}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-sm font-medium text-amber-700">Committed</span>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {formatCurrency(summary.total_committed)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <span className="text-sm font-medium text-purple-700">Available</span>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {formatCurrency(summary.total_available)}
              </p>
            </div>
          </div>

          {/* Utilization Progress */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Budget Utilization
              </h2>
              <span className="text-2xl font-bold text-emerald-600">
                {summary.utilization_percentage.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(100, summary.utilization_percentage)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Budget by Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-blue-600" />
                Budget by Type
              </h2>

              <div className="space-y-4">
                {summary.by_type.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 uppercase">
                        {item.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(item.utilized)} / {formatCurrency(item.allocated)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${item.allocated > 0 ? (item.utilized / item.allocated) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-600" />
                Budget by Category
              </h2>

              <div className="space-y-4">
                {summary.by_category.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(item.utilized)} / {formatCurrency(item.allocated)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{
                          width: `${item.allocated > 0 ? (item.utilized / item.allocated) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget List */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Budget Allocations</h2>

            {budgets.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No budget allocations for FY {fiscalYear}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium text-right">Allocated</th>
                      <th className="pb-2 font-medium text-right">Utilized</th>
                      <th className="pb-2 font-medium text-right">Committed</th>
                      <th className="pb-2 font-medium text-right">Available</th>
                      <th className="pb-2 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {budgets.map((budget) => (
                      <tr key={budget.id}>
                        <td className="py-3 uppercase text-xs font-medium">{budget.budget_type}</td>
                        <td className="py-3 capitalize">{budget.category.replace('_', ' ')}</td>
                        <td className="py-3 text-right">{formatCurrency(budget.allocated_amount)}</td>
                        <td className="py-3 text-right">{formatCurrency(budget.utilized_amount)}</td>
                        <td className="py-3 text-right">{formatCurrency(budget.committed_amount)}</td>
                        <td className="py-3 text-right font-medium text-emerald-600">
                          {formatCurrency(budget.available_amount)}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={budget.status === 'active' ? 'success' : 'secondary'}>
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
  )
}

export default BudgetOverviewPage

