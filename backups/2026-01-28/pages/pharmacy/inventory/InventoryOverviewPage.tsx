import React, { useEffect, useState } from 'react'
import { AlertTriangle, Package, Search, ThermometerSun } from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Table, Spinner, Input, Badge } from '@/components/ui'
import { getStockLevelSummary } from '@/services/pharmacy/inventoryService'
import type { StockLevelSummary, InventoryFilter } from '@/types/pharmacy'
import type { ApiResponse, Column } from '@/types'

export const InventoryOverviewPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [items, setItems] = useState<StockLevelSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const columns: Column<StockLevelSummary>[] = [
    {
      key: 'item_code',
      label: 'Code',
      className: 'font-mono text-xs text-gray-700',
    },
    {
      key: 'item_name',
      label: 'Item',
      className: 'text-sm text-gray-900',
    },
    {
      key: 'item_type',
      label: 'Type',
      className: 'text-xs uppercase text-gray-500',
      render: (value) => (value === 'drug' ? 'Drug' : 'Non-Drug'),
    },
    {
      key: 'current_stock',
      label: 'Current',
      className: 'text-right text-sm',
    },
    {
      key: 'min_stock',
      label: 'Min',
      className: 'text-right text-xs text-gray-500',
    },
    {
      key: 'max_stock',
      label: 'Max',
      className: 'text-right text-xs text-gray-500',
      render: (value) => (value ?? '-') as React.ReactNode,
    },
    {
      key: 'reorder_level',
      label: 'Reorder',
      className: 'text-right text-xs text-gray-500',
      render: (value) => (value ?? '-') as React.ReactNode,
    },
    {
      key: 'status',
      label: 'Status',
      className: 'text-right',
      render: (_, row) => renderStatusBadge(row.status),
    },
  ]

  useEffect(() => {
    if (!isSessionReady || !hospitalId) return

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const filter: InventoryFilter = {
        search: search || undefined,
        item_type: 'all',
        stock_status: 'all',
        status: 'all',
      }

      const res: ApiResponse<StockLevelSummary[]> = await getStockLevelSummary(
        hospitalId,
        filter
      )

      if (res.error) {
        setError(res.error)
        setItems([])
      } else {
        setItems(res.data || [])
      }

      setIsLoading(false)
    }

    void load()
  }, [isSessionReady, hospitalId, search])

  const renderStatusBadge = (status: StockLevelSummary['status']) => {
    const map: Record<
      StockLevelSummary['status'],
      { color: 'success' | 'warning' | 'error' | 'secondary'; label: string }
    > = {
      in_stock: { color: 'success', label: 'In Stock' },
      low_stock: { color: 'warning', label: 'Low' },
      critical: { color: 'error', label: 'Critical' },
      out_of_stock: { color: 'secondary', label: 'Out' },
    }

    const cfg = map[status]
    return (
      <Badge variant={cfg.color}>
        {cfg.label}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            Pharmacy Inventory
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time overview of drug and non-drug stock levels for your hospital.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Search by code or name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <ThermometerSun className="w-3 h-3 text-amber-500" />
            <span>Low / Critical indicate items below buffer level.</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load inventory</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Table
            data={items}
            columns={columns}
            emptyMessage="No inventory records found."
          />
        </div>
      )}
    </div>
  )
}

export default InventoryOverviewPage


