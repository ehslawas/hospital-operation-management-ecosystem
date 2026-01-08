import React, { useState } from 'react'
import {
  FileText,
  Download,
  Calendar,
  Package,
  DollarSign,
  Truck,
  Wind,
  Clock,
  TrendingDown,
  ShoppingCart,
  BarChart3,
} from 'lucide-react'
import { Select, Button, Input } from '@/components/ui'

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'inventory' | 'procurement' | 'financial' | 'distribution' | 'oxygen'
}

const reportTypes: ReportType[] = [
  {
    id: 'stock_level',
    name: 'Stock Level Report',
    description: 'Current stock levels for all drugs and non-drugs with min/max/reorder details.',
    icon: <Package className="w-5 h-5" />,
    category: 'inventory',
  },
  {
    id: 'near_expiry',
    name: 'Near Expiry Report',
    description: 'Items approaching expiry within specified days threshold.',
    icon: <Clock className="w-5 h-5" />,
    category: 'inventory',
  },
  {
    id: 'slow_moving',
    name: 'Slow Moving Items',
    description: 'Items with no movement beyond specified days.',
    icon: <TrendingDown className="w-5 h-5" />,
    category: 'inventory',
  },
  {
    id: 'stock_movement',
    name: 'Stock Movement Report',
    description: 'All stock transactions (receipts, issues, transfers, adjustments).',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'inventory',
  },
  {
    id: 'purchase_orders',
    name: 'Purchase Order Report',
    description: 'Summary of purchase orders by status, supplier, and date range.',
    icon: <ShoppingCart className="w-5 h-5" />,
    category: 'procurement',
  },
  {
    id: 'goods_receipts',
    name: 'Goods Receipt Report',
    description: 'Summary of goods received against purchase orders.',
    icon: <FileText className="w-5 h-5" />,
    category: 'procurement',
  },
  {
    id: 'supplier_performance',
    name: 'Supplier Performance',
    description: 'Supplier delivery performance, penalties, and ratings.',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'procurement',
  },
  {
    id: 'budget_utilization',
    name: 'Budget Utilization Report',
    description: 'Budget allocation, utilization, and variance analysis.',
    icon: <DollarSign className="w-5 h-5" />,
    category: 'financial',
  },
  {
    id: 'expenditure',
    name: 'Expenditure Report',
    description: 'Detailed expenditure breakdown by category and period.',
    icon: <DollarSign className="w-5 h-5" />,
    category: 'financial',
  },
  {
    id: 'transfers',
    name: 'Transfer Report',
    description: 'Inter and intra-facility transfers summary.',
    icon: <Truck className="w-5 h-5" />,
    category: 'distribution',
  },
  {
    id: 'oxygen_inventory',
    name: 'Oxygen Cylinder Report',
    description: 'Oxygen cylinder status, location, and maintenance schedule.',
    icon: <Wind className="w-5 h-5" />,
    category: 'oxygen',
  },
  {
    id: 'oxygen_consumption',
    name: 'Oxygen Consumption Report',
    description: 'Oxygen usage by department and period.',
    icon: <Wind className="w-5 h-5" />,
    category: 'oxygen',
  },
]

const categories = [
  { id: 'all', name: 'All Reports' },
  { id: 'inventory', name: 'Inventory' },
  { id: 'procurement', name: 'Procurement' },
  { id: 'financial', name: 'Financial' },
  { id: 'distribution', name: 'Distribution' },
  { id: 'oxygen', name: 'Medical Oxygen' },
]

export const ReportsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)

  const filteredReports =
    selectedCategory === 'all'
      ? reportTypes
      : reportTypes.filter((r) => r.category === selectedCategory)

  const handleGenerateReport = (report: ReportType) => {
    setSelectedReport(report)
    // In a real implementation, this would call a service to generate the report
    console.log('Generating report:', report.id, { dateFrom, dateTo })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      inventory: 'text-teal-600 bg-teal-50 border-teal-200',
      procurement: 'text-blue-600 bg-blue-50 border-blue-200',
      financial: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      distribution: 'text-purple-600 bg-purple-50 border-purple-200',
      oxygen: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    }
    return colors[category] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-gray-600" />
          Pharmacy Reports
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Generate and export reports for inventory, procurement, financial, and operational data.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Report Category</label>
          <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{filteredReports.length} reports available</span>
        </div>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className={`rounded-xl border p-4 transition-all hover:shadow-md ${getCategoryColor(report.category)}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/50">{report.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{report.description}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs uppercase font-medium opacity-70">{report.category}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateReport(report)}
                className="flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Generate
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Report Preview */}
      {selectedReport && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{selectedReport.name}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Report preview will be displayed here.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Select date range and click Generate to view report data.
            </p>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Report Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Select a date range for accurate period-based reports</li>
          <li>Stock Level and Near Expiry reports show current snapshot data</li>
          <li>Export to Excel for further analysis and custom formatting</li>
          <li>Schedule regular reports for automated distribution to stakeholders</li>
        </ul>
      </div>
    </div>
  )
}

export default ReportsPage

