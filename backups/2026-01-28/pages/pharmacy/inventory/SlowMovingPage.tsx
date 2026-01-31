import React, { useEffect, useState } from 'react'
import { AlertTriangle, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Table, Spinner, Badge, Select } from '@/components/ui'
import { getSlowMovingItems } from '@/services/pharmacy/inventoryService'
import type { SlowMovingItem } from '@/types/pharmacy'

export const SlowMovingPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [items, setItems] = useState<SlowMovingItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysSinceMovement, setDaysSinceMovement] = useState(90)

  useEffect(() => {
    if (!isSessionReady || !hospitalId) return

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const res = await getSlowMovingItems(hospitalId, daysSinceMovement)

      if (res.error) {
        setError(res.error)
        setItems([])
      } else {
        setItems(res.data || [])
      }

      setIsLoading(false)
    }

    void load()
  }, [isSessionReady, hospitalId, daysSinceMovement])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const totalValue = items.reduce((sum, item) => sum + item.total_value, 0)

  const renderAgeBadge = (days: number) => {
    if (days >= 180) {
      return <Badge variant="error">{days}d</Badge>
    }
    if (days >= 120) {
      return <Badge variant="warning">{days}d</Badge>
    }
    return <Badge variant="info">{days}d</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-orange-600" />
            Slow Moving Items
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Identify items with no movement to optimize stock levels and reduce holding costs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">No movement for at least:</label>
          <Select
            value={daysSinceMovement.toString()}
            onChange={(e) => setDaysSinceMovement(Number(e.target.value))}
            className="w-32"
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="120">120 days</option>
            <option value="180">180 days</option>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Slow Moving Items</span>
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-1">{items.length}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Total Value at Risk</span>
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Average Age</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {items.length > 0
              ? Math.round(items.reduce((sum, i) => sum + i.days_since_movement, 0) / items.length)
              : 0}{' '}
            days
          </p>
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
            <p className="font-medium">Failed to load slow moving items</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell as="th">Item Code</Table.Cell>
                <Table.Cell as="th">Item Name</Table.Cell>
                <Table.Cell as="th">Type</Table.Cell>
                <Table.Cell as="th" className="text-right">Current Stock</Table.Cell>
                <Table.Cell as="th" className="text-right">Unit Value</Table.Cell>
                <Table.Cell as="th" className="text-right">Total Value</Table.Cell>
                <Table.Cell as="th">Last Movement</Table.Cell>
                <Table.Cell as="th" className="text-center">Days Idle</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {items.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                    No slow moving items found. All items have recent movement. ✓
                  </Table.Cell>
                </Table.Row>
              )}

              {items.map((item) => (
                <Table.Row key={item.item_id}>
                  <Table.Cell className="font-mono text-xs text-gray-700">
                    {item.item_code}
                  </Table.Cell>
                  <Table.Cell className="text-sm font-medium text-gray-900">
                    {item.item_name}
                  </Table.Cell>
                  <Table.Cell className="text-xs uppercase text-gray-500">
                    {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                  </Table.Cell>
                  <Table.Cell className="text-right text-sm font-medium">
                    {item.current_stock}
                  </Table.Cell>
                  <Table.Cell className="text-right text-sm text-gray-600">
                    {formatCurrency(item.unit_value)}
                  </Table.Cell>
                  <Table.Cell className="text-right text-sm font-medium text-amber-700">
                    {formatCurrency(item.total_value)}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-gray-600">
                    {formatDate(item.last_movement_date)}
                  </Table.Cell>
                  <Table.Cell className="text-center">
                    {renderAgeBadge(item.days_since_movement)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}

      {/* Recommendations */}
      {!isLoading && !error && items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">💡 Recommendations</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Review items with 180+ days idle for potential write-off or return to supplier</li>
            <li>Consider inter-facility transfers to hospitals with higher demand</li>
            <li>Evaluate reorder levels to prevent future overstocking</li>
            <li>Coordinate with clinical departments to promote usage before expiry</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default SlowMovingPage

