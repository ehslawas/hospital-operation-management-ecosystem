import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Package, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select } from '@/components/ui'
import { getNonDrugs, getNonDrugCategories } from '@/services/pharmacy/inventoryService'
import type { NonDrugWithRelations, NonDrugCategory, InventoryFilter } from '@/types/pharmacy'

export const NonDrugInventoryPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [items, setItems] = useState<NonDrugWithRelations[]>([])
  const [categories, setCategories] = useState<NonDrugCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      const res = await getNonDrugCategories()
      if (res.data) {
        setCategories(res.data)
      }
    }
    void loadCategories()
  }, [])

  // Load non-drugs with filters
  const loadItems = useCallback(async () => {
    if (!hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter: InventoryFilter = {
      search: search || undefined,
      category_id: categoryId || undefined,
      status: status === 'all' ? undefined : status,
    }

    const res = await getNonDrugs(hospitalId, filter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setItems([])
    } else if (res.data) {
      setItems(res.data.data)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    }

    setIsLoading(false)
  }, [hospitalId, search, categoryId, status, page])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, categoryId, status])

  const renderStatusBadge = (itemStatus: 'active' | 'inactive') => {
    return itemStatus === 'active' ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="gray">Inactive</Badge>
    )
  }

  const renderStockBadge = (stockStatus?: string) => {
    if (!stockStatus) return <Badge variant="gray">—</Badge>
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'gray'; label: string }> = {
      in_stock: { color: 'success', label: 'In Stock' },
      low_stock: { color: 'warning', label: 'Low' },
      critical: { color: 'error', label: 'Critical' },
      out_of_stock: { color: 'gray', label: 'Out' },
    }
    const cfg = map[stockStatus] || { color: 'gray', label: stockStatus }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          Non-Drug Inventory
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage medical supplies, consumables, and other non-drug items.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Code or item name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="w-3 h-3" />
          <span>{total} items</span>
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
            <p className="font-medium">Failed to load items</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th">Code</Table.Cell>
                  <Table.Cell as="th">Item Name</Table.Cell>
                  <Table.Cell as="th">Category</Table.Cell>
                  <Table.Cell as="th">UOM</Table.Cell>
                  <Table.Cell as="th" className="text-right">Min</Table.Cell>
                  <Table.Cell as="th" className="text-right">Max</Table.Cell>
                  <Table.Cell as="th" className="text-right">Reorder</Table.Cell>
                  <Table.Cell as="th" className="text-center">Stock</Table.Cell>
                  <Table.Cell as="th" className="text-center">Status</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {items.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="text-center text-sm text-gray-500 py-8">
                      No non-drug items found matching your filters.
                    </Table.Cell>
                  </Table.Row>
                )}

                {items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell className="font-mono text-xs text-gray-700">
                      {item.item_code}
                    </Table.Cell>
                    <Table.Cell className="text-sm font-medium text-gray-900">
                      {item.item_name}
                    </Table.Cell>
                    <Table.Cell className="text-xs text-gray-500">
                      {item.category?.category_name || '—'}
                    </Table.Cell>
                    <Table.Cell className="text-xs uppercase text-gray-500">
                      {item.unit_of_measure}
                    </Table.Cell>
                    <Table.Cell className="text-right text-sm text-gray-600">
                      {item.min_stock_level}
                    </Table.Cell>
                    <Table.Cell className="text-right text-sm text-gray-600">
                      {item.max_stock_level ?? '—'}
                    </Table.Cell>
                    <Table.Cell className="text-right text-sm text-gray-600">
                      {item.reorder_level ?? '—'}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {renderStockBadge(item.stock_status)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {renderStatusBadge(item.status)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NonDrugInventoryPage

