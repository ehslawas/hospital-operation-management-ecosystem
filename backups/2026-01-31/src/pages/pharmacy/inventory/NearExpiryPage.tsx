import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Calendar } from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Table, Spinner, Badge, Select } from '@/components/ui'
import { getNearExpiryItems } from '@/services/pharmacy/inventoryService'
import type { ExpiryItem } from '@/types/pharmacy'

export const NearExpiryPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [items, setItems] = useState<ExpiryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysThreshold, setDaysThreshold] = useState(30)

  useEffect(() => {
    if (!isSessionReady || !hospitalId) return

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const res = await getNearExpiryItems(hospitalId, daysThreshold)

      if (res.error) {
        setError(res.error)
        setItems([])
      } else {
        setItems(res.data || [])
      }

      setIsLoading(false)
    }

    void load()
  }, [isSessionReady, hospitalId, daysThreshold])

  const renderExpiryBadge = (daysToExpiry: number, status: string) => {
    if (status === 'expired' || daysToExpiry <= 0) {
      return <Badge variant="error">Expired</Badge>
    }
    if (daysToExpiry <= 7) {
      return <Badge variant="error">{daysToExpiry}d left</Badge>
    }
    if (daysToExpiry <= 30) {
      return <Badge variant="warning">{daysToExpiry}d left</Badge>
    }
    return <Badge variant="info">{daysToExpiry}d left</Badge>
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            Near Expiry Items
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor items approaching expiry to prevent wastage and ensure patient safety.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Show items expiring within:</label>
          <Select
            value={daysThreshold.toString()}
            onChange={(e) => setDaysThreshold(Number(e.target.value))}
            className="w-32"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Expired</span>
          </div>
          <p className="text-2xl font-bold text-red-800 mt-1">
            {items.filter((i) => i.status === 'expired' || i.days_to_expiry <= 0).length}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">≤ 7 Days</span>
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {items.filter((i) => i.days_to_expiry > 0 && i.days_to_expiry <= 7).length}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">8 - 30 Days</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-1">
            {items.filter((i) => i.days_to_expiry > 7 && i.days_to_expiry <= 30).length}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">31+ Days</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {items.filter((i) => i.days_to_expiry > 30).length}
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
            <p className="font-medium">Failed to load near expiry items</p>
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
                <Table.Cell as="th">Batch No.</Table.Cell>
                <Table.Cell as="th">Location</Table.Cell>
                <Table.Cell as="th" className="text-right">Qty</Table.Cell>
                <Table.Cell as="th">Expiry Date</Table.Cell>
                <Table.Cell as="th" className="text-center">Status</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {items.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                    No items expiring within {daysThreshold} days. ✓
                  </Table.Cell>
                </Table.Row>
              )}

              {items.map((item) => (
                <Table.Row
                  key={item.batch_id}
                  className={item.status === 'expired' || item.days_to_expiry <= 0 ? 'bg-red-50' : ''}
                >
                  <Table.Cell className="font-mono text-xs text-gray-700">
                    {item.item_code}
                  </Table.Cell>
                  <Table.Cell className="text-sm font-medium text-gray-900">
                    {item.item_name}
                  </Table.Cell>
                  <Table.Cell className="text-xs uppercase text-gray-500">
                    {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs text-gray-600">
                    {item.batch_number}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-gray-600">
                    {item.location_name}
                  </Table.Cell>
                  <Table.Cell className="text-right text-sm font-medium">
                    {item.quantity}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-gray-600">
                    {formatDate(item.expiry_date)}
                  </Table.Cell>
                  <Table.Cell className="text-center">
                    {renderExpiryBadge(item.days_to_expiry, item.status)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  )
}

export default NearExpiryPage

